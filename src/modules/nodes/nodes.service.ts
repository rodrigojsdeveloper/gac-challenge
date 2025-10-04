import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClosureEntity } from 'src/entities/closure.entity';
import { NodeEntity } from 'src/entities/node.entity';
import { Repository } from 'typeorm';
import { NodesDto } from './dto/node.dto';

@Injectable()
export class NodesService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepository: Repository<NodeEntity>,

    @InjectRepository(ClosureEntity)
    private readonly closureRepository: Repository<ClosureEntity>,
  ) {}

  async getAncestors(nodeId: string): Promise<NodesDto[]> {
    const node = await this.nodeRepository.findOne({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Node not found.');
    }

    const ancestors = await this.closureRepository
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
    const node = await this.nodeRepository.findOne({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Node not found.');
    }

    const descendants = await this.closureRepository
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
