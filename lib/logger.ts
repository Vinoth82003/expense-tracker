import { prisma } from "./prisma";

type LogLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";
type LogService = "API" | "WORKER" | "AUTH" | "SYSTEM" | "MAIL" | "QUEUE";

interface LogOptions {
  level: LogLevel;
  service: LogService;
  message: string;
  details?: any;
  ip?: string;
  userId?: string;
}

// Debounce admin error emails to avoid flooding
const loggerErrorDebounce = new Map<string, number>();
const LOGGER_DEBOUNCE_MS = 5 * 60 * 1000;

async function notifyAdminOfError(
  level: LogLevel,
  service: LogService,
  message: string,
  details?: any,
  ip?: string,
  userId?: string
) {
  const debounceKey = `${service}:${message}`;
  const lastSent = loggerErrorDebounce.get(debounceKey) || 0;
  if (Date.now() - lastSent < LOGGER_DEBOUNCE_MS) return;
  loggerErrorDebounce.set(debounceKey, Date.now());

  try {
    const { sendAdminApiErrorNotification } = await import("./mail");
    const fakeError = details instanceof Error ? details : new Error(message);
    await sendAdminApiErrorNotification(`[${service}] ${message}`, "SYSTEM", fakeError, ip, userId);
  } catch {
    // Never let email failures crash the logger
  }
}

class Logger {
  private async createLog(options: LogOptions) {
    const { level, service, message, details, ip, userId } = options;

    // Log to console
    const timestamp = new Date().toISOString();
    const consoleMsg = `[${timestamp}] [${level}] [${service}] ${message}`;
    
    if (level === "ERROR" || level === "CRITICAL") {
      console.error(consoleMsg, details || "");
    } else if (level === "WARN") {
      console.warn(consoleMsg, details || "");
    } else {
      console.log(consoleMsg, details || "");
    }

    // Notify admin via email on ERROR/CRITICAL (non-blocking, debounced)
    if (level === "ERROR" || level === "CRITICAL") {
      notifyAdminOfError(level, service, message, details, ip, userId);
    }

    // Log to database asynchronously (don't await to avoid blocking)
    try {
      // Check if we are in an environment that can access Prisma (standard Node runtime)
      if (typeof process !== 'undefined' && (prisma as any).systemLog) {
        await (prisma as any).systemLog.create({
          data: {
            level,
            service,
            message,
            details: details ? (typeof details === "string" ? details : JSON.stringify(details)) : null,
            ip,
            userId,
          },
        });
      }
    } catch (err) {
      // Silent error for database logging to prevent crashing the app
      // but console.error it for debugging
      console.error("[Logger] Failed to write to database:", err);
    }
  }

  async info(message: string, details?: any, service: LogService = "API", ip?: string, userId?: string) {
    await this.createLog({ level: "INFO", service, message, details, ip, userId });
  }

  async warn(message: string, details?: any, service: LogService = "API", ip?: string, userId?: string) {
    await this.createLog({ level: "WARN", service, message, details, ip, userId });
  }

  async error(message: string, details?: any, service: LogService = "API", ip?: string, userId?: string) {
    await this.createLog({ level: "ERROR", service, message, details, ip, userId });
  }

  async critical(message: string, details?: any, service: LogService = "API", ip?: string, userId?: string) {
    await this.createLog({ level: "CRITICAL", service, message, details, ip, userId });
  }
}

export const logger = new Logger();
