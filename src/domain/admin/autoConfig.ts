import { z } from "zod";

const cronExpressionSchema = z
  .string()
  .regex(
    /^(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)\s+(\*|[0-9,\-*/]+)$/,
    "유효한 cron 표현식이 아닙니다 (예: 0 9 * * 1)",
  );

export const autoConfigSchema = z.object({
  feature: z.literal("showcase"),
  enabled: z.boolean(),
  cronExpression: cronExpressionSchema,
  lastRunAt: z.string().datetime().nullable(),
  nextRunAt: z.string().datetime().nullable(),
});

export type AutoConfig = z.infer<typeof autoConfigSchema>;

export const updateAutoConfigSchema = z.object({
  enabled: z.boolean().optional(),
  cronExpression: cronExpressionSchema.optional(),
});

export type UpdateAutoConfigInput = z.infer<typeof updateAutoConfigSchema>;
