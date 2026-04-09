export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/sohj-portfolio',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me',
};