import pino from 'pino';
import pretty from 'pino-pretty';

export const stream = pretty({
  colorize: true,
});

export const logger = pino(
  {
    level: Bun.env['LOG_LEVEL'] ?? 'debug',
  },
  stream
);
