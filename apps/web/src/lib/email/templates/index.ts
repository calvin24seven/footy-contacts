import { z } from "zod"
import type { ReactElement } from "react"
import WelcomeEmail from "./welcome"
import ExportReadyEmail from "./export-ready"
import UnlockConfirmationEmail from "./unlock-confirmation"

export interface TemplateDefinition<S extends z.ZodTypeAny> {
  schema: S
  component: (props: z.infer<S>) => ReactElement
  subject: (props: z.infer<S>) => string
  /** 'transactional' emails bypass marketing unsubscribes.
   *  'marketing' emails must respect List-Unsubscribe and suppression table. */
  category: "transactional" | "marketing"
}

const WelcomeSchema = z.object({
  firstName: z.string().min(1).max(80),
})

const ExportReadySchema = z.object({
  fileName:    z.string().min(1).max(120),
  downloadUrl: z.string().url(),
  rowCount:    z.number().int().nonnegative(),
})

const UnlockConfirmationSchema = z.object({
  contactName: z.string().min(1).max(120),
  contactRole: z.string().max(80).optional(),
})

export const TEMPLATES = {
  welcome: {
    schema:    WelcomeSchema,
    component: WelcomeEmail,
    subject:   () => "Welcome to Footy Contacts",
    category:  "transactional",
  },
  "export-ready": {
    schema:    ExportReadySchema,
    component: ExportReadyEmail,
    subject:   ({ fileName }: z.infer<typeof ExportReadySchema>) => `Your export "${fileName}" is ready`,
    category:  "transactional",
  },
  "unlock-confirmation": {
    schema:    UnlockConfirmationSchema,
    component: UnlockConfirmationEmail,
    subject:   ({ contactName }: z.infer<typeof UnlockConfirmationSchema>) =>
      `Contact unlocked: ${contactName}`,
    category:  "transactional",
  },
} as const satisfies Record<string, TemplateDefinition<z.ZodTypeAny>>

export type TemplateId = keyof typeof TEMPLATES
