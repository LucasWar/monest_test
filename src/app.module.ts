import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CepModule } from './modules/cep/cep.module';
import { AppExceptionFilter } from './common/filters/app-exeption.filter';

@Module({
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }],
  imports: [CepModule],
})
export class AppModule {}
