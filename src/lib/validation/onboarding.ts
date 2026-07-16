import { z } from "zod";

export const businessInfoSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de tu negocio."),
  description: z.string().trim().min(1, "Cuéntanos brevemente qué hace tu negocio."),
  industry: z.string().trim().min(1, "Selecciona tu giro o industria."),
  country: z.string().trim().min(1, "Ingresa tu país."),
  city: z.string().trim().min(1, "Ingresa tu ciudad."),
  primaryLanguage: z.string().trim().min(1, "Selecciona el idioma principal."),
  websiteUrl: z.union([z.literal(""), z.string().trim().url("URL inválida.")]),
  phone: z.string().trim().min(1, "Ingresa un teléfono de contacto."),
  contactEmail: z.string().trim().email("Correo inválido."),
});
export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;

export const brandInfoSchema = z.object({
  colorPalette: z.array(z.string()).default([]),
  preferredFonts: z.array(z.string()).default([]),
  brandTone: z.string().trim().min(1, "Describe el tono de comunicación."),
  brandValues: z.array(z.string()).default([]),
  mission: z.string().trim().min(1, "Cuéntanos la misión de tu marca."),
  targetAudience: z.string().trim().min(1, "Describe tu público objetivo."),
});
export type BrandInfoInput = z.infer<typeof brandInfoSchema>;

export const socialLinksSchema = z.object({
  instagram: z.string().trim().default(""),
  facebook: z.string().trim().default(""),
  tiktok: z.string().trim().default(""),
  linkedin: z.string().trim().default(""),
  x: z.string().trim().default(""),
  youtube: z.string().trim().default(""),
  other: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
});
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;

export const goalsSchema = z.object({
  goals: z.array(z.string()).min(1, "Selecciona al menos un objetivo."),
  goalsOther: z.string().trim().default(""),
});
export type GoalsInput = z.infer<typeof goalsSchema>;

export const competitionSchema = z.object({
  mainCompetitors: z.array(z.string()).default([]),
  admiredCompanies: z.array(z.string()).default([]),
  styleReferences: z.array(z.string()).default([]),
});
export type CompetitionInput = z.infer<typeof competitionSchema>;

export const productsSchema = z.object({
  sellsDescription: z.string().trim().min(1, "Cuéntanos qué vendes."),
  productCategories: z.array(z.string()).default([]),
  mainProducts: z.array(z.string()).default([]),
  averageTicket: z.string().trim().default(""),
  frequentPromotions: z.string().trim().default(""),
});
export type ProductsInput = z.infer<typeof productsSchema>;

export const aiInfoSchema = z.object({
  personality: z.string().trim().min(1, "Describe la personalidad de tu marca."),
  aiForbiddenTopics: z.string().trim().default(""),
  aiForbiddenWords: z.array(z.string()).default([]),
  aiResponseStyle: z.string().trim().min(1, "Cuéntanos cómo debe responder la IA."),
  faqs: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
  businessHours: z.string().trim().default(""),
  address: z.string().trim().default(""),
  additionalInfo: z.string().trim().default(""),
});
export type AiInfoInput = z.infer<typeof aiInfoSchema>;

export const ONBOARDING_STEPS = [
  { step: 1, key: "negocio", title: "Información del negocio" },
  { step: 2, key: "marca", title: "Marca" },
  { step: 3, key: "redes", title: "Redes sociales" },
  { step: 4, key: "objetivos", title: "Objetivos" },
  { step: 5, key: "competencia", title: "Competencia" },
  { step: 6, key: "productos", title: "Productos o servicios" },
  { step: 7, key: "ia", title: "Información para la IA" },
] as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;
