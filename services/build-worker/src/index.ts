import express from 'express';
import cors from 'cors';
import { BuildSandbox } from './sandbox';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const sandbox = new BuildSandbox();

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: '@platform/build-worker',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.post('/api/build/execute', async (req, res) => {
  const { projectId, buildId, files } = req.body;

  if (!projectId || !buildId || !files || !Array.isArray(files)) {
    return res.status(400).json({ error: 'Missing required parameters: projectId, buildId, files array' });
  }

  try {
    const result = await sandbox.executeBuild(projectId, buildId, files);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[BUILD-WORKER] Sandboxed Build Worker running on port ${PORT}`);
});
