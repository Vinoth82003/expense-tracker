import { NextResponse, NextRequest } from "next/server";
import { sendAdminApiErrorNotification } from "./mail";

type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

/**
 * Wraps an API route handler with automatic admin error notifications.
 * When the handler throws or returns a 500, an email is sent to the admin.
 *
 * Usage:
 *   export const GET = withErrorNotification(async (req) => { ... });
 *   export const POST = withErrorNotification(async (req, ctx) => { ... }, "POST");
 */
export function withErrorNotification(handler: ApiHandler, method = "GET") {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    let userId: string | undefined;
    try {
      const authHeader = request.headers.get("x-internal-user-id");
      if (authHeader) userId = authHeader;
    } catch {}

    try {
      const response = await handler(request, context);

      if (response.status >= 500) {
        sendAdminApiErrorNotification(
          endpoint,
          method,
          new Error(`Handler returned status ${response.status}`),
          ip,
          userId
        ).catch(() => {});
      }

      return response;
    } catch (error: any) {
      sendAdminApiErrorNotification(endpoint, method, error, ip, userId).catch(
        () => {}
      );

      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
