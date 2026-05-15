import { z } from "zod"

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(
    /[0-9!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/,
    "Password must contain a number or symbol.",
  )

export const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
})

export const updatePasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
