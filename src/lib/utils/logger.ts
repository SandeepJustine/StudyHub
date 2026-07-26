/**
 * Structured logging utility for StudyHub Malawi
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const base = {
      timestamp: entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.requestId && { requestId: entry.requestId }),
    };

    if (entry.error) {
      return JSON.stringify({
        ...base,
        error: {
          message: entry.error.message,
          stack: entry.error.stack,
          ...(entry.error as any).code && { code: (entry.error as any).code },
        },
      });
    }

    return JSON.stringify(base);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context,
      }));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.info(this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        context,
      }));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        context,
      }));
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      console.error(this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        error,
        context,
      }));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  createRequestLogger(requestId: string, userId?: string) {
    return {
      debug: (message: string, context?: Record<string, any>) =>
        this.debug(message, { ...context, requestId, userId }),
      info: (message: string, context?: Record<string, any>) =>
        this.info(message, { ...context, requestId, userId }),
      warn: (message: string, context?: Record<string, any>) =>
        this.warn(message, { ...context, requestId, userId }),
      error: (message: string, error?: Error, context?: Record<string, any>) =>
        this.error(message, error, { ...context, requestId, userId }),
    };
  }
}

export const logger = Logger.getInstance();
export default logger;