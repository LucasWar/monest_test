import { Controller, Get, Param } from '@nestjs/common';
import { CepService } from './cep.service';
import { CepValidationPipe } from './pipe/cep-validation.pipe';

@Controller('cep')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get(':cep')
  findOne(@Param('cep', CepValidationPipe) cep: string) {
    return this.cepService.findByCep(cep);
  }
}
