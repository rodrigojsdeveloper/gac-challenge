import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { name, parentId } = dto;

    if (parentId) {
      const parent = await this.nodeRepository.findOne({
        where: { id: parentId, type: NodeType.GROUP },
      });
      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
    }

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

    if (parentId) {
      const parentAncestors = await this.closureRepository.find({
        where: { descendantId: parentId },
      });

      const links = parentAncestors.map((pa) => ({
        ancestorId: pa.ancestorId,
        descendantId: group.id,
        depth: pa.depth + 1,
      }));

      await this.closureRepository.save(links);
    }

    return {
      ...group,
      parentId: parentId ?? null,
    };
  }
}
