import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ClosureEntity } from 'src/entities/closure.entity';
import { NodeEntity, NodeType } from 'src/entities/node.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { UserOrganizationDto } from './dto/user-organization.dto';
import { RepositoriesService } from 'src/repositories';

@Injectable()
export class UsersService {
  constructor(private readonly repos: RepositoriesService) {}

  async create(dto: CreateUserDto) {
    const { name, email } = dto;

    const existingUser = await this.repos.nodeRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.repos.nodeRepository.create({
      type: NodeType.USER,
      name,
      email,
    });
    await this.repos.nodeRepository.save(user);

    await this.repos.closureRepository.save({
      ancestorId: user.id,
      descendantId: user.id,
      depth: 0,
    });

    return user;
  }

  async addUserToGroup(userId: string, dto: AddUserToGroupDto) {
    const { groupId } = dto;

    const user = await this.repos.nodeRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.type !== NodeType.USER) {
      throw new BadRequestException('Node is not a USER');
    }

    const group = await this.repos.nodeRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (group.type !== NodeType.GROUP) {
      throw new BadRequestException('Node is not a GROUP');
    }

    const existing = await this.repos.closureRepository.findOne({
      where: { ancestorId: groupId, descendantId: userId },
    });
    if (existing) {
      throw new ConflictException('User already belongs to group');
    }

    const groupAncestors = await this.repos.closureRepository.find({
      where: { descendantId: groupId },
    });
    if (groupAncestors.some((a) => a.ancestorId === userId)) {
      throw new UnprocessableEntityException('Cyclic relationship detected');
    }

    const newLinks: ClosureEntity[] = [];

    for (const ancestor of groupAncestors) {
      newLinks.push(
        this.repos.closureRepository.create({
          ancestorId: ancestor.ancestorId,
          descendantId: userId,
          depth: ancestor.depth + 1,
        }),
      );
    }

    const userSelf = await this.repos.closureRepository.findOne({
      where: { ancestorId: userId, descendantId: userId },
    });
    if (!userSelf) {
      newLinks.push(
        this.repos.closureRepository.create({
          ancestorId: userId,
          descendantId: userId,
          depth: 0,
        }),
      );
    }

    await this.repos.closureRepository.save(newLinks);
  }

  async getUserOrganizations(userId: string): Promise<UserOrganizationDto[]> {
    const user = await this.repos.nodeRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.type !== NodeType.USER) {
      throw new BadRequestException('Node is not a USER');
    }

    const ancestors = await this.repos.closureRepository
      .createQueryBuilder('closure')
      .innerJoin(NodeEntity, 'node', 'node.id = closure.ancestor_id')
      .where('closure.descendant_id = :userId', { userId })
      .andWhere('closure.depth >= 1')
      .andWhere('node.type = :type', { type: NodeType.GROUP })
      .select(['node.id AS id', 'node.name AS name', 'closure.depth AS depth'])
      .orderBy('closure.depth', 'ASC')
      .getRawMany<UserOrganizationDto>();

    return ancestors;
  }
}
