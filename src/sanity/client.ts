import { createClient } from "next-sanity";

export const blogClient = createClient({
  projectId: "q5wpcza6",
  dataset: "blogs",
  apiVersion: "2024-01-01",
  useCdn: false,
});

export const eventClient = createClient({
  projectId: "q5wpcza6",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});
