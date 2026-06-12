import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }), // tampilkan "info" bukan angka 30
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev && {
    transport: {
      targets: [
        {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
        {
          target: "pino/file",
          options: {
            destination: "./logs/app.log",
            mkdir: true,
          },
        },
      ],
    },
  }),
});

export { logger };