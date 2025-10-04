import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClosureEntity } from 'src/entities/closure.entity';
import { NodeEntity, NodeType } from 'src/entities/node.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepository: Repository<NodeEntity>,

    @InjectRepository(ClosureEntity)
    private readonly closureRepository: Repository<ClosureEntity>,
  ) {}

  async create(dto: CreateUserDto) {
    const { name, email } = dto;

    const existingUser = await this.nodeRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.nodeRepository.create({
      type: NodeType.USER,
      name,
      email,
    });
    await this.nodeRepository.save(user);

    await this.closureRepository.save({
      ancestorId: user.id,
      descendantId: user.id,
      depth: 0,
    });

    return user;
  }

  async addUserToGroup(userId: string, dto: AddUserToGroupDto) {
    const { groupId } = dto;

    const user = await this.nodeRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (user.type !== NodeType.USER) {
      throw new BadRequestException(`Node ${userId} is not a USER`);
    }

    const group = await this.nodeRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }
    if (group.type !== NodeType.GROUP) {
      throw new BadRequestException(`Node ${groupId} is not a GROUP`);
    }

    const existing = await this.closureRepository.findOne({
      where: { ancestorId: groupId, descendantId: userId },
    });
    if (existing) {
      throw new ConflictException(
        `User ${userId} already belongs to group ${groupId}`,
      );
    }

    const groupAncestors = await this.closureRepository.find({
      where: { descendantId: groupId },
    });
    if (groupAncestors.some((a) => a.ancestorId === userId)) {
      throw new UnprocessableEntityException(`Cyclic relationship detected`);
    }

    const newLinks: ClosureEntity[] = [];

    for (const ancestor of groupAncestors) {
      newLinks.push(
        this.closureRepository.create({
          ancestorId: ancestor.ancestorId,
          descendantId: userId,
          depth: ancestor.depth + 1,
        }),
      );
    }

    const userSelf = await this.closureRepository.findOne({
      where: { ancestorId: userId, descendantId: userId },
    });
    if (!userSelf) {
      newLinks.push(
        this.closureRepository.create({
          ancestorId: userId,
          descendantId: userId,
          depth: 0,
        }),
      );
    }

    await this.closureRepository.save(newLinks);
  }
}
