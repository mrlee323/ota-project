import { z } from "zod";
import {
  regionTabSchema,
  showcaseHotelCardSchema,
} from "@/domain/hotel/showcaseTypes";

export const showcaseStatusSchema = z.enum(["draft", "active", "archived"]);
export type ShowcaseStatus = z.infer<typeof showcaseStatusSchema>;

const regionSchema = z.object({
  tab: regionTabSchema,
  hotels: z.array(showcaseHotelCardSchema),
});

export const showcaseContentSchema = z.object({
  id: z.string().uuid(),
  promoTitle: z.string().min(1),
  regions: z.array(regionSchema).min(1),
  status: showcaseStatusSchema,
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ShowcaseContent = z.infer<typeof showcaseContentSchema>;

export const createShowcaseSchema = z.object({
  promoTitle: z.string().min(1),
  regions: z.array(regionSchema).min(1),
  status: showcaseStatusSchema.optional().default("draft"),
});

export type CreateShowcaseInput = z.infer<typeof createShowcaseSchema>;

export const updateShowcaseSchema = z.object({
  promoTitle: z.string().min(1).optional(),
  regions: z.array(regionSchema).min(1).optional(),
  status: showcaseStatusSchema.optional(),
});

export type UpdateShowcaseInput = z.infer<typeof updateShowcaseSchema>;
