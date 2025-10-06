import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeEntity } from 'src/entities/node.entity';
import { ClosureEntity } from 'src/entities/closure.entity';
import { MetricsModule } from '../metrics/metrics.module';
import { RepositoriesService } from 'src/repositories';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NodeEntity, ClosureEntity]),
    MetricsModule,
  ],
  providers: [GroupsService, RepositoriesService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
