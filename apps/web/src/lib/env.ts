import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  PRIVY_APP_SECRET: z.string().min(1).optional(),
  SERVER_WALLET_PRIVATE_KEY: z.string().optional(),
  TEDU_PASS_CONTRACT_ADDRESS: z.string().optional(),
  ALLOWED_EMAIL_DOMAIN: z.string().default("tedu.edu.tr")
});

const clientSchema = z.object({
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000")
});

export const serverEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://placeholder@localhost:5432/tedu_pass",
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
  SERVER_WALLET_PRIVATE_KEY: process.env.SERVER_WALLET_PRIVATE_KEY,
  TEDU_PASS_CONTRACT_ADDRESS: process.env.TEDU_PASS_CONTRACT_ADDRESS,
  ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});
