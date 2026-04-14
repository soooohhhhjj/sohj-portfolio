import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeedAdmin } from './modules/admin-auth/admin.service.js';

async function bootstrap() {
  await connectDb();
  await ensureSeedAdmin();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

void bootstrap();
