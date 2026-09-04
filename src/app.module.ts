import { Module } from '@nestjs/common';
import { CepModule } from './modules/cep/cep.module';

@Module({
  imports: [CepModule],
})
export class AppModule {}
