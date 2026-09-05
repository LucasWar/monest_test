import { z } from 'zod';

export const ViaCepErrorSchema = z.object({
  erro: z.union([z.literal(true), z.literal('true')]),
});

export const ViaCepSuccessSchema = z.object({
  cep: z.string().min(1),
  logradouro: z.string(),
  complemento: z.string(),
  unidade: z.string(),
  bairro: z.string(),
  localidade: z.string().min(1),
  uf: z.string().length(2),
  estado: z.string(),
  regiao: z.string(),
  ibge: z.string(),
  gia: z.string(),
  ddd: z.string(),
  siafi: z.string(),
});

export type ViaCepSuccess = z.infer<typeof ViaCepSuccessSchema>;
export type ViaCepError = z.infer<typeof ViaCepErrorSchema>;
