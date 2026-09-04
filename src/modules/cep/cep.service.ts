import { Injectable } from '@nestjs/common';

@Injectable()
export class CepService {
  findCep(cep: string) {
    return `This action returns a #${cep} cep`;
  }
}
