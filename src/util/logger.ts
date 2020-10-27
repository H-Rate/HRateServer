import { createLogger, format, transports } from 'winston'
import { consoleFormat } from 'winston-console-format'

export default process.env.NODE_ENV === 'development'
  ? console
  : createLogger({
      level: 'silly',
      format: format.combine(
        format.timestamp(),
        format.ms(),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
      ),
      defaultMeta: { service: 'api' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize({ all: true }),
            format.padLevels(),
            consoleFormat({
              showMeta: true,
              metaStrip: ['timestamp', 'service'],
              inspectOptions: {
                depth: Infinity,
                colors: true,
                maxArrayLength: Infinity,
                breakLength: 120,
                compact: Infinity,
              },
            }),
          ),
        }),
      ],
    })
