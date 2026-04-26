import { z } from "zod";

export const ADMIN_FEATURES = ["showcase"] as const;
export type AdminFeature = (typeof ADMIN_FEATURES)[number];

export const adminPermissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  feature: z.enum(ADMIN_FEATURES),
  canRead: z.boolean(),
  canWrite: z.boolean(),
});

export type AdminPermission = z.infer<typeof adminPermissionSchema>;

export const featureAccessSchema = z.object({
  canRead: z.boolean(),
  canWrite: z.boolean(),
});

export type FeatureAccess = z.infer<typeof featureAccessSchema>;
