import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // 💡 Jika dev (lokal), jangan pakai formatter. Jika production, baru pakai formatter.
  ...(!isDev && {
    formatters: {
      level: (label) => ({ level: label }),
    },
  }),

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