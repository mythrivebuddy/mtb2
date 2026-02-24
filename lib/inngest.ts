import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "mtb-cmp",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
