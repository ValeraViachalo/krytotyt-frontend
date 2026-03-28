import { createClient } from "next-sanity";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-03-20",
  useCdn: false,
  // useCdn: process.env.NODE_ENV === "production",
  token: process.env.NEXT_PUBLIC_SANITY_WRITE_TOKEN,
});