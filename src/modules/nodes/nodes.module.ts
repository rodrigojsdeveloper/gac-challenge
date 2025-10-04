import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeEntity } from 'src/entities/node.entity';
import { ClosureEntity } from 'src/entities/closure.entity';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { RepositoriesService } from 'src/repositories';

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity, ClosureEntity])],
  providers: [NodesService, RepositoriesService],
  controllers: [NodesController],
  exports: [NodesService],
})
export class NodesModule {}
