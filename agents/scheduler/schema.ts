// /agents/scheduler/schema.ts
import { z } from "zod";

export const SchedulerRequestSchema = z.object({
  text: z.string().min(1),
  freeBusy: z.array(
    z.object({
      start: z.string().min(1), // ISO-8601
      end: z.string().min(1),   // ISO-8601
    })
  ).default([]),
  preferences: z.object({
    quiet_hours: z.array(z.string()).optional(), // e.g., ["22:00-07:00"]
    ignored_categories: z.array(z.enum(["Academic", "Career", "Social"])).optional(),
    require_all: z.boolean().optional(),
    location_hint: z.string().optional(),
    duration_minutes: z.number().int().positive().default(60),
  }).default({}),
  previous: z.array(z.string()).optional(), // previously suggested ISO timestamps to avoid
});

export type SchedulerRequest = z.infer<typeof SchedulerRequestSchema>;

export const SchedulerResponseSchema = z.object({
  title: z.string(),
  who: z.array(z.string()).default([]),
  where: z.string().nullable(),
  slots: z.array(z.string()).min(1).max(3), // ISO-8601 strings; ascending order expected
});

export type SchedulerResponse = z.infer<typeof SchedulerResponseSchema>;

/** Simple helper to ensure ascending order (ISO strings sort lexicographically if Z times) */
export function sortIsoAscending(isoTimes: string[]): string[] {
  return [...isoTimes].sort((a,b) => (a < b ? -1 : a > b ? 1 : 0));
}
