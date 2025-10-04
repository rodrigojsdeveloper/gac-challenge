import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClosureEntity } from 'src/entities/closure.entity';
import { NodeEntity, NodeType } from 'src/entities/node.entity';
import { Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepository: Repository<NodeEntity>,

    @InjectRepository(ClosureEntity)
    private readonly closureRepository: Repository<ClosureEntity>,
  ) {}

  async create(dto: CreateGroupDto) {
    const { name } = dto;

    const group = this.nodeRepository.create({
      type: NodeType.GROUP,
      name,
    });
    await this.nodeRepository.save(group);

    await this.closureRepository.save({
      ancestorId: group.id,
      descendantId: group.id,
      depth: 0,
    });

    return group;
  }
}
