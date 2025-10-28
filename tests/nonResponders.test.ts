import { getNonResponders } from "@/lib/nonResponders";
import { Attendee } from "@/types/event";
import { expect, test } from "vitest";

test("filters needsAction attendees", () => {
  const a: Attendee[] = [
    {name:"A", email:"a@x.com", responseStatus:"accepted"},
    {name:"B", email:"b@x.com", responseStatus:"needsAction"},
    {name:"C", email:"c@x.com", responseStatus:"needsAction"},
  ];
  const r = getNonResponders(a);
  expect(r.map(x=>x.email)).toEqual(["b@x.com","c@x.com"]);
});

