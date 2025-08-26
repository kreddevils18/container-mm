export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export interface LoggerConfig {
  includeTimestamp?: boolean;
  useColors?: boolean;
  logLevel?: LogLevel;
  prefix?: string;
}

export interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: Date;
  prefix?: string;
  data?: Record<string, unknown>;
}

export interface LogContext {
  prefix?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SingletonLoggerInterface {
  info(message: string, data?: Record<string, unknown>, prefix?: string): void;
  warn(message: string, data?: Record<string, unknown>, prefix?: string): void;
  error(message: string, data?: Record<string, unknown>, prefix?: string): void;
  success(message: string, data?: Record<string, unknown>, prefix?: string): void;
  debug(message: string, data?: Record<string, unknown>, prefix?: string): void;
  logError(error: unknown, message?: string, prefix?: string): void;
  withPrefix(prefix: string): SingletonLoggerInterface;
  withContext(context: LogContext): SingletonLoggerInterface;
  child(prefix: string): SingletonLoggerInterface;
}

export class ScriptLogger {
  private readonly config: Required<LoggerConfig>;

  private readonly levelEmojis: Record<LogLevel, string> = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    success: "✅",
    debug: "🔍",
  };

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    success: 1,
  };

  constructor(config: LoggerConfig = {}) {
    this.config = {
      includeTimestamp: config.includeTimestamp ?? true,
      useColors: config.useColors ?? true,
      logLevel: config.logLevel ?? "info",
      prefix: config.prefix ?? "",
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      this.levelPriority[level] >= this.levelPriority[this.config.logLevel]
    );
  }

  private formatMessage(logMessage: LogMessage): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${logMessage.timestamp.toISOString()}]`);
    }

    if (this.config.useColors) {
      parts.push(this.levelEmojis[logMessage.level]);
    }

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    if (logMessage.prefix) {
      parts.push(`[${logMessage.prefix}]`);
    }

    parts.push(logMessage.message);

    let formatted = parts.join(" ");

    if (logMessage.data && Object.keys(logMessage.data).length > 0) {
      formatted += `\n  Data: ${JSON.stringify(logMessage.data, null, 2)}`;
    }

    return formatted;
  }

  private output(logMessage: LogMessage): void {
    if (!this.shouldLog(logMessage.level)) {
      return;
    }

    const formatted = this.formatMessage(logMessage);
    const stream = logMessage.level === "error" ? process.stderr : process.stdout;

    stream.write(`${formatted}\n`);
  }

  public info(
    message: string,
    data?: Record<string, unknown>,
    prefix?: string
  ): void {
    this.output({
      level: "info",
      message,
      timestamp: new Date(),
      ...(prefix !== undefined && { prefix }),
      ...(data !== undefined && { data }),
    });
  }

  public warn(
    message: string,
    data?: Record<string, unknown>,
    prefix?: string
  ): void {
    this.output({
      level: "warn",
      message,
      timestamp: new Date(),
      ...(prefix !== undefined && { prefix }),
      ...(data !== undefined && { data }),
    });
  }

  public error(
    message: string,
    data?: Record<string, unknown>,
    prefix?: string
  ): void {
    this.output({
      level: "error",
      message,
      timestamp: new Date(),
      ...(prefix !== undefined && { prefix }),
      ...(data !== undefined && { data }),
    });
  }

  public success(
    message: string,
    data?: Record<string, unknown>,
    prefix?: string
  ): void {
    this.output({
      level: "success",
      message,
      timestamp: new Date(),
      ...(prefix !== undefined && { prefix }),
      ...(data !== undefined && { data }),
    });
  }

  public debug(
    message: string,
    data?: Record<string, unknown>,
    prefix?: string
  ): void {
    this.output({
      level: "debug",
      message,
      timestamp: new Date(),
      ...(prefix !== undefined && { prefix }),
      ...(data !== undefined && { data }),
    });
  }

  public logError(
    error: unknown,
    message?: string,
    prefix?: string
  ): void {
    let errorMessage = message || "An error occurred";
    const data: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
      data.stack = error.stack;
      data.name = error.name;
    } else if (typeof error === "string") {
      errorMessage += `: ${error}`;
    } else {
      errorMessage += `: ${String(error)}`;
      data.rawError = error;
    }

    this.error(errorMessage, data, prefix);
  }

  public child(prefix: string): ScriptLogger {
    const childPrefix = this.config.prefix
      ? `${this.config.prefix}:${prefix}`
      : prefix;

    return new ScriptLogger({
      ...this.config,
      prefix: childPrefix,
    });
  }
}

// Environment-based configuration
const LOG_LEVEL_BY_ENV: Record<string, LogLevel> = {
  production: "warn",
  test: "error",
  development: "debug",
};

function getLogLevel(): LogLevel {
  const env = process.env.NODE_ENV || "development";
  return LOG_LEVEL_BY_ENV[env] || "info";
}

function getEnvironmentConfig(): Required<LoggerConfig> {
  const env = process.env.NODE_ENV || "development";
  const baseConfig = {
    includeTimestamp: true,
    useColors: env !== "production",
    logLevel: getLogLevel(),
    prefix: "",
  };

  if (env === "test") {
    return {
      ...baseConfig,
      includeTimestamp: false,
      useColors: false,
      logLevel: "error" as LogLevel,
    };
  }

  return baseConfig;
}

// Singleton logger wrapper class
class SingletonLogger implements SingletonLoggerInterface {
  private static instance: SingletonLogger;
  private readonly baseLogger: ScriptLogger;
  private readonly context: LogContext;

  private constructor(baseLogger?: ScriptLogger, context: LogContext = {}) {
    this.baseLogger = baseLogger || new ScriptLogger(getEnvironmentConfig());
    this.context = context;
  }

  public static getInstance(): SingletonLogger {
    if (!SingletonLogger.instance) {
      SingletonLogger.instance = new SingletonLogger();
    }
    return SingletonLogger.instance;
  }

  private mergeContext(prefix?: string, data?: Record<string, unknown>): {
    finalPrefix: string | undefined;
    finalData: Record<string, unknown> | undefined;
  } {
    const finalPrefix = prefix || this.context.prefix;
    const finalData = data || this.context.data ? { ...this.context.data, ...data } : data;
    return { finalPrefix, finalData };
  }

  public info(message: string, data?: Record<string, unknown>, prefix?: string): void {
    const { finalPrefix, finalData } = this.mergeContext(prefix, data);
    this.baseLogger.info(message, finalData, finalPrefix);
  }

  public warn(message: string, data?: Record<string, unknown>, prefix?: string): void {
    const { finalPrefix, finalData } = this.mergeContext(prefix, data);
    this.baseLogger.warn(message, finalData, finalPrefix);
  }

  public error(message: string, data?: Record<string, unknown>, prefix?: string): void {
    const { finalPrefix, finalData } = this.mergeContext(prefix, data);
    this.baseLogger.error(message, finalData, finalPrefix);
  }

  public success(message: string, data?: Record<string, unknown>, prefix?: string): void {
    const { finalPrefix, finalData } = this.mergeContext(prefix, data);
    this.baseLogger.success(message, finalData, finalPrefix);
  }

  public debug(message: string, data?: Record<string, unknown>, prefix?: string): void {
    const { finalPrefix, finalData } = this.mergeContext(prefix, data);
    this.baseLogger.debug(message, finalData, finalPrefix);
  }

  public logError(error: unknown, message?: string, prefix?: string): void {
    const { finalPrefix } = this.mergeContext(prefix);
    this.baseLogger.logError(error, message, finalPrefix);
  }

  public withPrefix(prefix: string): SingletonLoggerInterface {
    const newPrefix = this.context.prefix ? `${this.context.prefix}:${prefix}` : prefix;
    return new SingletonLogger(this.baseLogger, { ...this.context, prefix: newPrefix });
  }

  public withContext(context: LogContext): SingletonLoggerInterface {
    const mergedContext = { ...this.context, ...context };
    if (context.prefix && this.context.prefix) {
      mergedContext.prefix = `${this.context.prefix}:${context.prefix}`;
    }
    return new SingletonLogger(this.baseLogger, mergedContext);
  }

  public child(prefix: string): SingletonLoggerInterface {
    return this.withPrefix(prefix);
  }
}

export function createScriptLogger(config?: LoggerConfig): ScriptLogger {
  return new ScriptLogger(config);
}

export const logger: SingletonLoggerInterface = SingletonLogger.getInstance();
export const dbLogger = logger.withPrefix("DATABASE");
export const migrationLogger = logger.withPrefix("MIGRATION");
export const serviceLogger = logger.withPrefix("SERVICE");
export const devLogger = logger.withPrefix("DEV");
export const settingsLogger = logger.withPrefix("SETTINGS");
export const defaultLogger = createScriptLogger(getEnvironmentConfig());
