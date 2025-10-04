import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { NodeEntity } from 'src/entities/node.entity';
import { ClosureEntity } from 'src/entities/closure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity, ClosureEntity])],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
