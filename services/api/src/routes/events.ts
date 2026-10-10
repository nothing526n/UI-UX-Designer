import { Router, Request, Response } from "express";

export const eventsRouter = Router();

// Store active client connections per project
const clientsByProject = new Map<string, Set<Response>>();

export function broadcastProjectEvent(projectId: string, eventType: string, data: any) {
  const clients = clientsByProject.get(projectId);
  if (!clients || clients.size === 0) return;

  const payload = `event: ${eventType}\ndata: ${JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

// SSE Subscription endpoint
eventsRouter.get("/projects/:projectId/events", (req: Request, res: Response) => {
  const { projectId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  if (!clientsByProject.has(projectId)) {
    clientsByProject.set(projectId, new Set());
  }
  clientsByProject.get(projectId)!.add(res);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "Connected to project event stream", projectId })}\n\n`);

  req.on("close", () => {
    clientsByProject.get(projectId)?.delete(res);
  });
});
