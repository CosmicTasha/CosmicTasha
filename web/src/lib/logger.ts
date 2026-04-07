import pino from "pino";

function buildTransport() {
  if (process.env.NODE_ENV === "production") return undefined;
  try {
    require.resolve("pino-pretty");
    return { target: "pino-pretty", options: { colorize: true } };
  } catch {
    return undefined;
  }
}

export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "*.token",
      "*.magicLink",
      "*.password",
      "*.secret",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
  transport: buildTransport(),
});
