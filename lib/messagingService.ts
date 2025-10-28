import { Attendee } from "@/types/event";

export type SendInput = {
  from: string; // e.g., "Scheduling Agent <no-reply@scheduler.com>"
  to: Attendee;
  subject: string;
  body: string;   // plain text or lightweight markdown
  metadata?: Record<string, string>;
};

export async function sendMessage(input: SendInput): Promise<{status: "sent" | "failed"; error?: string;}> {
  // MOCK: simulate latency + success
  await new Promise(r => setTimeout(r, 150));
  // You could simulate partial failures based on email domain
  return { status: "sent" };
}

