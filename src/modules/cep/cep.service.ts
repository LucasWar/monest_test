import { Injectable } from '@nestjs/common';
import { CreateCepDto } from './dto/create-cep.dto';
import { UpdateCepDto } from './dto/update-cep.dto';

@Injectable()
export class CepService {
  create(createCepDto: CreateCepDto) {
    return 'This action adds a new cep';
  }

  findAll() {
    return `This action returns all cep`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cep`;
  }

  update(id: number, updateCepDto: UpdateCepDto) {
    return `This action updates a #${id} cep`;
  }

  remove(id: number) {
    return `This action removes a #${id} cep`;
  }
}
