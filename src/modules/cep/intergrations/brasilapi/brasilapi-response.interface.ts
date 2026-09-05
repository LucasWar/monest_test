export interface BrasilApiSuccessResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: 'viacep';
}

interface CepServiceError {
  name: 'ServiceError';
  message: string;
  service: string;
}

export interface BrasilApiErrorResponse {
  name: 'CepPromiseError';
  message: string;
  type: 'service_error';
  errors: CepServiceError[];
}

export type BrasilApiResponse =
  BrasilApiSuccessResponse | BrasilApiErrorResponse;
