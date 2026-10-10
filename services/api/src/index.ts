import { createServer } from "./server.js";

const PORT = process.env.PORT || 4000;
const app = createServer();

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
  console.log(`[API Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[API Server] REST routes registered at /api/v1/*`);
});
