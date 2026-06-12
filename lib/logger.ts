import pino from "pino";

const transport = pino.transport({
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
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  transport
);
