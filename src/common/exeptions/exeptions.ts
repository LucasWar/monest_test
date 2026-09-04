import {
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class CepNotFoundException extends NotFoundException {}
export class CepProviderTimeoutException extends RequestTimeoutException {}
export class AllProvidersUnavailableException extends ServiceUnavailableException {
  constructor(cep: string, errors: any[]) {
    super({
      message: `Não foi possível consultar o CEP ${cep}`,
      providers: errors,
    });
  }
}

export class CepProviderUnavailableException extends Error {
  constructor(reason: string, providerName?: string) {
    super(`Provider indisponível: ${reason}, Provider: ${providerName}`);
  }
}
