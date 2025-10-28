import { formatEventDateTimeTZ } from "@/lib/time";
import { expect, test } from "vitest";

test("returns a formatted date string", () => {
  const s = formatEventDateTimeTZ("2025-10-31T14:00:00","America/New_York");
  expect(typeof s).toBe("string");
  expect(s.length).toBeGreaterThan(5);
});

