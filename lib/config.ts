export const config = {
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  },
  jwt: {
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  },
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT || "10"),
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT || "100"),
  },
  rateLimit: {
    login: {
      limit: parseInt(process.env.RATE_LIMIT_LOGIN || "5"),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"), // 1 minute
    },
    refresh: {
      limit: parseInt(process.env.RATE_LIMIT_REFRESH || "10"),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
    },
    pin: {
      limit: parseInt(process.env.RATE_LIMIT_PIN || "3"),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
    },
  },
};
