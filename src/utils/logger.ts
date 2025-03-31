import winston from 'winston';

// Define custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

// Create a Winston logger with customized format
const logger = winston.createLogger({
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'rag-tool' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          ({ level, message, timestamp, service, ...meta }) => {
            let metaStr = '';
            if (Object.keys(meta).length > 0) {
              // Handle nested metadata
              try {
                metaStr = ` ${JSON.stringify(meta)}`;
              } catch (e) {
                metaStr = ` ${Object.keys(meta).join(',')}`;
              }
            }
            return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
          }
        )
      ),
      level: process.env.LOG_LEVEL || 'info',
    }),
  ],
});

// Add a simple stream for Express/HTTP logging if needed
logger.stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Set higher level logging for production
if (process.env.NODE_ENV === 'production') {
  logger.level = 'info';
}

export default logger;