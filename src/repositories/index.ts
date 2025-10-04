import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NodeEntity } from 'src/entities/node.entity';
import { ClosureEntity } from 'src/entities/closure.entity';

@Injectable()
export class RepositoriesService {
  constructor(
    @InjectRepository(NodeEntity)
    public readonly nodeRepository: Repository<NodeEntity>,

    @InjectRepository(ClosureEntity)
    public readonly closureRepository: Repository<ClosureEntity>,
  ) {}
}
