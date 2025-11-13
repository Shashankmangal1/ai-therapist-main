import { Inngest } from "inngest";

// Read Inngest configuration from environment variables to avoid committing secrets.
const INNGEST_CLIENT_ID = process.env.INNGEST_CLIENT_ID || "ai-therapy-agent";
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;

// Initialize the Inngest client. If INNGEST_EVENT_KEY is not set, the client will
// be created without a key (useful for local development if you don't have a key).
export const inngest = new Inngest({
  id: INNGEST_CLIENT_ID,
  ...(INNGEST_EVENT_KEY ? { eventKey: INNGEST_EVENT_KEY } : {}),
});

// Export the functions array (this will be populated by the functions.ts file)
export const functions: any[] = [];
