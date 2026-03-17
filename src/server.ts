import { app, ensureBootstrapProfessor } from "./app";
import { env } from "./config/env";

async function start(): Promise<void> {
  await ensureBootstrapProfessor();
  app.listen(env.PORT, () => {
    console.log(`Focus Gradebook running at http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
