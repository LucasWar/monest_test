import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exeption';

export class CepNotFoundException extends AppException {
  constructor(cep: string, providerName: string) {
    super(
      `CEP ${cep} não encontrado`,
      'CEP_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      providerName,
    );
  }
}

export class AllProvidersUnavailableException extends AppException {
  constructor(cep: string, attempts: { provider: string; reason: string }[]) {
    super(
      `Não foi possível consultar o CEP ${cep} em nenhum provider`,
      'CEP_ALL_PROVIDERS_DOWN',
      HttpStatus.SERVICE_UNAVAILABLE,
      { attempts },
    );
  }
}

export class CepProviderTimeoutException extends Error {
  constructor(timeoutMs: number, providerName?: string) {
    super(
      `Timeout após ${timeoutMs}ms${providerName ? ` (${providerName})` : ''}`,
    );
    this.name = 'CepProviderTimeoutException';
  }
}

export class CepProviderUnavailableException extends Error {
  constructor(reason: string, providerName?: string) {
    super(
      `Provider indisponível: ${reason}${providerName ? `, Provider: ${providerName}` : ''}`,
    );
    this.name = 'CepProviderUnavailableException';
  }
}

export class CepProviderInvalidResponseException extends Error {
  constructor(providerName: string, details: string) {
    super(`Resposta inválida do provider ${providerName}: ${details}`);
    this.name = 'CepProviderInvalidResponseException';
  }
}
