import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { CepService } from './cep.service';
import { CepValidationPipe } from './pipe/cep-validation.pipe';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';

@Controller('cep')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get(':cep')
  @UseInterceptors(LoggingInterceptor)
  findOne(@Param('cep', CepValidationPipe) cep: string) {
    return this.cepService.findByCep(cep);
  }
}
