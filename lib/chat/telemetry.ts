export type ChatTelemetryPayload = Record<string, unknown>;
export type ChatTelemetryEvent =
  | "chat.request"
  | "chat.response"
  | "chat.error"
  | "chat.moderation.blocked"
  | "chat.server.error";

export async function sendChatTelemetry(event: ChatTelemetryEvent, payload: ChatTelemetryPayload = {}) {
  try {
    await fetch("/api/chat/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, timestamp: Date.now(), payload }),
    });
  } catch (err) {
    // Telemetry failure must not block the user flow
    // Keep this minimal and resilient in the client.
    // eslint-disable-next-line no-console
    console.error("Telemetry send error:", err);
  }
}

export default sendChatTelemetry;
