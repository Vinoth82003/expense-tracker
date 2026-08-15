import Groq from "groq-sdk";

// V4 Groq provider — server-side only.
// - Reads env at call time (never at import) so tests and flag flips stay predictable.
// - Fail-closed: every call requires GROQ_CHAT_ENABLED=true AND GROQ_API_KEY to be set.
// - Hard timeouts per call kind; streaming NLG via a single accumulating pass.
// - No logging, no DB writes here — callers own persistence (AiUsageLog) and fallbacks.

export type GroqRole = "system" | "user" | "assistant";

export type GroqMessage = {
  role: GroqRole;
  content: string;
};

export type GroqCallKind = "nlu" | "nlg" | "analyze";

export type GroqErrorCode =
  | "disabled"
  | "missing_api_key"
  | "timeout"
  | "aborted"
  | "invalid_json"
  | "http";

export class GroqError extends Error {
  code: GroqErrorCode;
  status?: number;

  constructor(code: GroqErrorCode, message: string, status?: number) {
    super(message);
    this.name = "GroqError";
    this.code = code;
    this.status = status;
  }
}

export type GroqUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GroqCallOptions = {
  kind: GroqCallKind;
  messages: GroqMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type GroqNLUResult = {
  data: unknown;
  content: string;
  usage: GroqUsage;
  latencyMs: number;
  model: string;
};

export type GroqNLGResult = {
  content: string;
  usage: GroqUsage;
  latencyMs: number;
  model: string;
};

const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";

const TIMEOUTS_MS: Record<GroqCallKind, number> = {
  nlu: 10_000,
  nlg: 20_000,
  analyze: 30_000,
};

const MAX_TOKENS: Record<GroqCallKind, number> = {
  nlu: 200,
  nlg: 400,
  analyze: 1024,
};

export function isGroqChatEnabled(): boolean {
  const raw = process.env.GROQ_CHAT_ENABLED;
  if (!raw) return false;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

export function getGroqModel(kind: GroqCallKind): string {
  const override = kind === "analyze" ? process.env.GROQ_ANALYZE_MODEL : process.env.GROQ_CHAT_MODEL;
  return override?.trim() || DEFAULT_CHAT_MODEL;
}

function getGroqClient(): Groq {
  if (!isGroqChatEnabled()) {
    throw new GroqError("disabled", "Groq chat is disabled (GROQ_CHAT_ENABLED is not true).");
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError("missing_api_key", "GROQ_API_KEY is not set; Groq calls fail closed.");
  }
  return new Groq({ apiKey });
}

function toUsage(u?: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}): GroqUsage {
  return {
    promptTokens: u?.prompt_tokens ?? 0,
    outputTokens: u?.completion_tokens ?? 0,
    totalTokens: u?.total_tokens ?? 0,
  };
}

function createTimeoutController(timeoutMs: number, signal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      onExternalAbort();
    } else {
      signal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    isTimedOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onExternalAbort);
    },
  };
}

type RawCompletion = {
  content: string;
  usage: GroqUsage;
  latencyMs: number;
  model: string;
};

async function complete(
  client: Groq,
  opts: GroqCallOptions,
  onDelta?: (delta: string) => void,
): Promise<RawCompletion> {
  const model = getGroqModel(opts.kind);
  const maxTokens = opts.maxTokens ?? MAX_TOKENS[opts.kind];
  const temperature = opts.temperature ?? (opts.kind === "nlu" ? 0 : 0.4);
  const timeoutMs = opts.timeoutMs ?? TIMEOUTS_MS[opts.kind];
  const { signal, isTimedOut, cleanup } = createTimeoutController(timeoutMs, opts.signal);

  const startedAt = Date.now();

  try {
    if (opts.jsonMode) {
      const res = await client.chat.completions.create(
        {
          model,
          messages: opts.messages,
          max_tokens: maxTokens,
          temperature,
          response_format: { type: "json_object" },
          stream: false,
        },
        { signal },
      );
      return {
        content: res.choices?.[0]?.message?.content ?? "",
        usage: toUsage(res.usage),
        latencyMs: Date.now() - startedAt,
        model,
      };
    }

    const stream = await client.chat.completions.create(
      {
        model,
        messages: opts.messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      },
      { signal },
    );

    let content = "";
    let usage: GroqUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        content += delta;
        onDelta?.(delta);
      }
      const chunkUsage = (chunk as {
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }).usage;
      if (chunkUsage) {
        usage = toUsage(chunkUsage);
      }
    }

    return { content, usage, latencyMs: Date.now() - startedAt, model };
  } catch (err) {
    if (isTimedOut()) {
      throw new GroqError("timeout", `Groq ${opts.kind} call timed out after ${timeoutMs}ms.`);
    }
    if (err instanceof GroqError) {
      throw err;
    }
    const abortLike = (err as Error | undefined)?.name === "AbortError";
    if (abortLike) {
      throw new GroqError("aborted", `Groq ${opts.kind} call aborted.`);
    }
    const status = (err as { status?: number } | undefined)?.status;
    throw new GroqError(
      "http",
      err instanceof Error ? err.message : String(err),
      status,
    );
  } finally {
    cleanup();
  }
}

export async function callGroqNLU(
  messages: GroqMessage[],
  opts: Partial<GroqCallOptions> = {},
): Promise<GroqNLUResult> {
  const client = getGroqClient();
  const result = await complete(
    client,
    { ...opts, messages, kind: "nlu", jsonMode: true },
  );

  let data: unknown;
  try {
    data = JSON.parse(result.content);
  } catch {
    throw new GroqError("invalid_json", "Groq NLU response was not valid JSON.");
  }

  return { ...result, data };
}

export async function callGroqNLG(
  messages: GroqMessage[],
  onDelta?: (delta: string) => void,
  opts: Partial<GroqCallOptions> = {},
): Promise<GroqNLGResult> {
  const client = getGroqClient();
  return complete(client, { ...opts, messages, kind: "nlg" }, onDelta);
}

export async function callGroqAnalyze(
  messages: GroqMessage[],
  opts: Partial<GroqCallOptions> = {},
): Promise<GroqNLUResult> {
  const client = getGroqClient();
  const result = await complete(
    client,
    { ...opts, messages, kind: "analyze", jsonMode: true, temperature: 0.3 },
  );

  let data: unknown;
  try {
    data = JSON.parse(result.content);
  } catch {
    throw new GroqError("invalid_json", "Groq analyze response was not valid JSON.");
  }

  return { ...result, data };
}
