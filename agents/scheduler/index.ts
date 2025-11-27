// /agents/scheduler/index.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { z } from "zod";
import {
  SchedulerRequestSchema,
  SchedulerResponseSchema,
  type SchedulerRequest,
  type SchedulerResponse,
  sortIsoAscending,
} from "./schema.js";

// Initialize client lazily to allow for environment variable loading
let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Load system prompt from prompt.md so we have one source of truth
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptPath = path.resolve(__dirname, "prompt.md");
const SYSTEM_PROMPT = fs.readFileSync(promptPath, "utf-8").trim();

/**
 * generateSchedule
 * Orchestrates one call to the LLM, validates JSON, and returns 1–3 ISO slots.
 */
export async function generateSchedule(input: SchedulerRequest): Promise<SchedulerResponse> {
  // Validate input
  const { text, freeBusy, preferences, previous } = SchedulerRequestSchema.parse(input);

  const userPayload = {
    text,
    freeBusy,
    preferences,
    previous: previous ?? [],
  };

  // Call the LLM in JSON mode
  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Use the following inputs. Return ONLY a JSON object that matches the schema.\n\n" +
          JSON.stringify(userPayload, null, 2),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0, // determinism for tests
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Scheduler Agent did not return valid JSON. Got:\n${raw}`);
  }

  // Validate and normalize
  const data = SchedulerResponseSchema.parse(parsed);
  return {
    ...data,
    slots: sortIsoAscending(data.slots),
  };
}

/* -------------------------------------------------------
   Optional: quick CLI test
   run:  node agents/scheduler/index.ts
------------------------------------------------------- */
if (import.meta?.url === `file://${process.argv[1]}`) {
  (async () => {
    const demo = await generateSchedule({
      text: "Plan coffee with Milan and Ikenna this week near Spangler",
      freeBusy: [
        { start: "2025-11-11T09:00:00Z", end: "2025-11-11T12:00:00Z" },
        { start: "2025-11-11T14:00:00Z", end: "2025-11-11T18:00:00Z" },
      ],
      preferences: {
        quiet_hours: ["22:00-07:00"],
        duration_minutes: 45,
      },
      previous: [],
    });

    // Pretty print
    console.log(JSON.stringify(demo, null, 2));
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
