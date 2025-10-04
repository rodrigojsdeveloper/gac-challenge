import { Injectable, NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { RepositoriesService } from 'src/repositories';

@Injectable()
export class GroupsService {
  constructor(private readonly repos: RepositoriesService) {}

  async create(dto: CreateGroupDto) {
    const { name, parentId } = dto;

    if (parentId) {
      const parent = await this.repos.nodeRepository.findOne({
        where: { id: parentId, type: NodeType.GROUP },
      });
      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
    }

    const group = this.repos.nodeRepository.create({
      type: NodeType.GROUP,
      name,
    });
    await this.repos.nodeRepository.save(group);

    await this.repos.closureRepository.save({
      ancestorId: group.id,
      descendantId: group.id,
      depth: 0,
    });

    if (parentId) {
      const parentAncestors = await this.repos.closureRepository.find({
        where: { descendantId: parentId },
      });

      const links = parentAncestors.map((pa) => ({
        ancestorId: pa.ancestorId,
        descendantId: group.id,
        depth: pa.depth + 1,
      }));

      await this.repos.closureRepository.save(links);
    }

    return {
      ...group,
      parentId: parentId ?? null,
    };
  }
}
