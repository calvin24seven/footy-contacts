import { z } from "zod"
import type { ReactElement } from "react"
import WelcomeEmail from "./welcome"
import ExportReadyEmail from "./export-ready"
import UnlockConfirmationEmail from "./unlock-confirmation"
import TeamInviteEmail from "./team-invite"
import Reactivation1Email from "./reactivation-1"
import Reactivation2Email from "./reactivation-2"
import Reactivation3Email from "./reactivation-3"
import Reactivation4Email from "./reactivation-4"
import Reactivation5Email from "./reactivation-5"
import WinbackCancelEmail from "./winback-cancel"

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

const ReactivationBaseSchema = z.object({
  firstName:      z.string().min(1).max(80),
  unsubscribeUrl: z.string().url(),
})

const Reactivation5Schema = ReactivationBaseSchema.extend({
  offerEndDate: z.string().min(1).max(40),
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
  "team-invite": {
    schema: z.object({
      inviterName: z.string().min(1).max(120),
      teamName:    z.string().min(1).max(120),
      acceptUrl:   z.string().url(),
    }),
    component: TeamInviteEmail,
    subject:   ({ inviterName }: { inviterName: string }) =>
      `${inviterName} invited you to their Footy Contacts team`,
    category:  "transactional",
  },
  "reactivation-1": {
    schema:    ReactivationBaseSchema,
    component: Reactivation1Email,
    subject:   () => "You signed up to Footy Contacts. I owe you an honest update.",
    category:  "marketing",
  },
  "reactivation-2": {
    schema:    ReactivationBaseSchema,
    component: Reactivation2Email,
    subject:   () => "What can you actually search inside Footy Contacts?",
    category:  "marketing",
  },
  "reactivation-3": {
    schema:    ReactivationBaseSchema,
    component: Reactivation3Email,
    subject:   () => "You have 3 free contact unlocks",
    category:  "marketing",
  },
  "reactivation-4": {
    schema:    ReactivationBaseSchema,
    component: Reactivation4Email,
    subject:   () => "What football contacts are you actually looking for?",
    category:  "marketing",
  },
  "reactivation-5": {
    schema:    Reactivation5Schema,
    component: Reactivation5Email,
    subject:   () => "Existing users: Pro is £19 for your first month",
    category:  "marketing",
  },
  "winback-cancel": {
    schema: z.object({
      firstName:     z.string().min(1).max(80),
      accessUntil:   z.string().min(1).max(60),
      reactivateUrl: z.string().url(),
    }),
    component: WinbackCancelEmail,
    subject:   ({ firstName }: { firstName: string }) =>
      `${firstName}, before your access ends — two options for you`,
    category:  "marketing",
  },
} as const satisfies Record<string, TemplateDefinition<z.ZodTypeAny>>

export type TemplateId = keyof typeof TEMPLATES
