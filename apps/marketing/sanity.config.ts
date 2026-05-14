import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { schemaTypes } from "./src/sanity/schemaTypes"

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"

export default defineConfig({
  name: "footy-contacts-marketing",
  title: "Footy Contacts",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
