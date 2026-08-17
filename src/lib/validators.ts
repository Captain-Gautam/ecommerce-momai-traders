import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name"),
    businessName: z.string().trim().optional(),
    email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotEmailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
    otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  name: z.string().trim().optional().or(z.literal("")),
  company: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  line1: z.string().trim().min(3, "Address line 1 is required"),
  line2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{10,15}$/, "Enter a valid phone number"),
  isDefault: z.boolean().optional(),
});

export const contactAddressSchema = addressSchema
  .refine((d) => (d.name ?? "").trim().length >= 2, {
    message: "Please enter your name",
    path: ["name"],
  })
  .refine((d) => (d.company ?? "").trim().length >= 2, {
    message: "Please enter your company name",
    path: ["company"],
  })
  .refine((d) => /^\S+@\S+\.\S+$/.test((d.email ?? "").trim()), {
    message: "Please enter a valid email address",
    path: ["email"],
  });

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().trim().optional().or(z.literal("")),
  specifications: z.string().trim().optional().or(z.literal("")),
  unit: z.string().default("pcs"),
  price: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().nonnegative().optional()
  ),
  gstRate: z.preprocess((v) => Number(v ?? 0), z.number().nonnegative().max(100)),
  hsnCode: z.string().trim().optional().or(z.literal("")),
  minOrderQty: z.preprocess((v) => Number(v ?? 1), z.number().int().positive()),
  stock: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().nonnegative().optional()
  ),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required"),
  description: z.string().trim().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  gstRate: z.preprocess((v) => Number(v ?? 18), z.number().nonnegative().max(100)),
  sortOrder: z.preprocess((v) => Number(v ?? 0), z.number().int()),
  isActive: z.boolean().optional(),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Your name is required"),
  company: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{10,15}$/, "Enter a valid phone number"),
  subject: z.string().trim().optional().or(z.literal("")),
  quantity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  unit: z.string().trim().optional().or(z.literal("")),
  specs: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please describe your requirement"),
});

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        unit: z.string().trim().optional().or(z.literal("")),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Add at least one product to the quote request"),
});
