import { ChatAPIResponse } from "./types";
import { sendChatTelemetry } from "./telemetry";

export async function sendChatMessage(
  message?: string,
  details?: any,
  intentType?: string,
  context?: any,
): Promise<ChatAPIResponse> {
  const start = Date.now();
  try {
    const body: any = {};
    if (message) body.message = message;
    if (details) body.details = details;
    if (intentType) body.intentType = intentType;
    if (context) body.context = context;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const took = Date.now() - start;

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const telemetryPayload = {
        messageLength: (message || "").length,
        success: false,
        status: response.status,
        error: errorBody?.error,
        took,
      };

      if (
        response.status === 400 &&
        errorBody?.error === "Message blocked for safety."
      ) {
        await sendChatTelemetry("chat.moderation.blocked", telemetryPayload);
      } else {
        await sendChatTelemetry("chat.error", telemetryPayload);
      }

      throw new Error(errorBody?.error || "Unable to send the chat request.");
    }

    const payload = await response.json();
    await sendChatTelemetry("chat.request", {
      messageLength: (message || "").length,
      success: true,
      status: response.status,
      took,
      replyLength: (payload.reply || "").toString().length,
    });
    await sendChatTelemetry("chat.response", {
      replyLength: (payload.reply || "").toString().length,
      took,
      success: true,
    });
    return payload as ChatAPIResponse;
  } catch (err: any) {
    await sendChatTelemetry("chat.error", {
      messageLength: (message || "").length,
      success: false,
      error: err?.message,
      took: Date.now() - start,
    });
    throw err;
  }
}

