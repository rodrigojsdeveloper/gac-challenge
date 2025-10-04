import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NodeEntity } from 'src/entities/node.entity';
import { ClosureEntity } from 'src/entities/closure.entity';
import { RepositoriesService } from 'src/repositories';

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity, ClosureEntity])],
  providers: [UsersService, RepositoriesService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
