import { BadRequestException, PipeTransform } from '@nestjs/common';

export class CepValidationPipe implements PipeTransform {
  transform(value: string): string {
    const cep = value.replace(/\D/g, '');

    if (!/^\d{8}$/.test(cep)) {
      throw new BadRequestException('CEP inválido');
    }

    return cep;
  }
}
