import { Injectable, NotFoundException } from '@nestjs/common';
import { NodeEntity } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { NodesDto } from './dto/nodes.dto';

@Injectable()
export class NodesService {
  constructor(private readonly repos: RepositoriesService) {}

  async getAncestors(nodeId: string): Promise<NodesDto[]> {
    const node = await this.repos.nodeRepository.findOne({
      where: { id: nodeId },
    });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const ancestors = await this.repos.closureRepository
      .createQueryBuilder('closure')
      .innerJoin(NodeEntity, 'node', 'node.id = closure.ancestor_id')
      .where('closure.descendant_id = :nodeId', { nodeId })
      .andWhere('closure.depth >= 1')
      .select([
        'node.id AS id',
        'node.name AS name',
        'node.type AS type',
        'closure.depth AS depth',
      ])
      .orderBy('closure.depth', 'ASC')
      .getRawMany<NodesDto>();

    return ancestors;
  }

  async getDescendants(nodeId: string): Promise<NodesDto[]> {
    const node = await this.repos.nodeRepository.findOne({
      where: { id: nodeId },
    });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const descendants = await this.repos.closureRepository
      .createQueryBuilder('closure')
      .innerJoin(NodeEntity, 'node', 'node.id = closure.descendant_id')
      .where('closure.ancestor_id = :nodeId', { nodeId })
      .andWhere('closure.depth >= 1')
      .select([
        'node.id AS id',
        'node.name AS name',
        'node.type AS type',
        'closure.depth AS depth',
      ])
      .orderBy('closure.depth', 'ASC')
      .getRawMany<NodesDto>();

    return descendants;
  }
}
