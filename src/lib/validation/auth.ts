import { z } from "zod";

const email = z.string().trim().min(1, "Ingresa tu correo.").email("Correo inválido.");

const password = z
  .string()
  .min(8, "Mínimo 8 caracteres.")
  .regex(/[A-Za-z]/, "Incluye al menos una letra.")
  .regex(/[0-9]/, "Incluye al menos un número.");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre."),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
