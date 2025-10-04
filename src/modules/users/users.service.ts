import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClosureEntity } from 'src/entities/closure.entity';
import { NodeEntity, NodeType } from 'src/entities/node.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepository: Repository<NodeEntity>,

    @InjectRepository(ClosureEntity)
    private readonly closureRepository: Repository<ClosureEntity>,
  ) {}

  async create(dto: CreateUserDto) {
    const { name, email } = dto;

    const existingUser = await this.nodeRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email já está em uso.');
    }

    const user = this.nodeRepository.create({
      type: NodeType.USER,
      name,
      email,
    });
    await this.nodeRepository.save(user);

    await this.closureRepository.save({
      ancestorId: user.id,
      descendantId: user.id,
      depth: 0,
    });

    return user;
  }
}
