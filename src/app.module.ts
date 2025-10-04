import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { NodeEntity } from './entities/node.entity';
import { ClosureEntity } from './entities/closure.entity';
import { GroupsModule } from './modules/groups/groups.module';
import { NodesModule } from './modules/nodes/nodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [NodeEntity, ClosureEntity],
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsersModule,
    GroupsModule,
    NodesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
