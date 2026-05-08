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

    // Log to database asynchronously (don't await to avoid blocking)
    try {
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
    } catch (err) {
      console.error("[Logger] Failed to write to database:", err);
    }
  }

  async info(service: LogService, message: string, details?: any, ip?: string, userId?: string) {
    await this.createLog({ level: "INFO", service, message, details, ip, userId });
  }

  async warn(service: LogService, message: string, details?: any, ip?: string, userId?: string) {
    await this.createLog({ level: "WARN", service, message, details, ip, userId });
  }

  async error(service: LogService, message: string, details?: any, ip?: string, userId?: string) {
    await this.createLog({ level: "ERROR", service, message, details, ip, userId });
  }

  async critical(service: LogService, message: string, details?: any, ip?: string, userId?: string) {
    await this.createLog({ level: "CRITICAL", service, message, details, ip, userId });
  }
}

export const logger = new Logger();
