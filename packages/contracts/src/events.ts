import { z } from "zod";

export const RealtimeEventTypeEnum = z.enum([
  "agent.started",
  "agent.progress",
  "agent.completed",
  "agent.failed",
  "artifact.created",
  "artifact.updated",
  "artifact.committed",
  "build.queued",
  "build.started",
  "build.log",
  "build.completed",
  "build.failed",
  "preview.ready",
  "preview.failed",
  "qa.started",
  "qa.progress",
  "qa.completed",
  "approval.requested",
  "approval.resolved",
]);
export type RealtimeEventType = z.infer<typeof RealtimeEventTypeEnum>;

export const RealtimeEventPayloadSchema = z.object({
  type: RealtimeEventTypeEnum,
  projectId: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()),
});
export type RealtimeEventPayload = z.infer<typeof RealtimeEventPayloadSchema>;
