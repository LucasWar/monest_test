import { z } from 'zod';

export const BrasilApiSuccessSchema = z.object({
  cep: z.string().min(1),
  state: z.string().length(2),
  city: z.string().min(1),
  neighborhood: z.string(),
  street: z.string(),
  service: z.string().optional(),
});

export const BrasilApiErrorSchema = z.object({
  name: z.literal('CepPromiseError'),
  message: z.string(),
  type: z.string(),
  errors: z.array(
    z.object({
      name: z.string(),
      message: z.string(),
      service: z.string(),
    }),
  ),
});

export type BrasilApiSuccess = z.infer<typeof BrasilApiSuccessSchema>;
export type BrasilApiError = z.infer<typeof BrasilApiErrorSchema>;
