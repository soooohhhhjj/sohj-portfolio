import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

void bootstrap();