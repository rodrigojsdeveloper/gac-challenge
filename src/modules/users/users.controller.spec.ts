import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UUIDS } from 'test/mocks/repositories.mock';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    addUserToGroup: jest.fn(),
    getUserOrganizations: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const dto = { name: 'John Doe', email: 'john@example.com' };
      const expectedUser = { id: UUIDS.userId, ...dto, type: NodeType.USER };

      mockUsersService.create.mockResolvedValue(expectedUser);

      const result = await controller.create(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      const dto = { name: 'John Doe', email: 'existing@example.com' };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('addUserToGroup', () => {
    const dto = { groupId: UUIDS.groupId };

    it('should add user to group successfully', async () => {
      mockUsersService.addUserToGroup.mockResolvedValue(undefined);

      const result = await controller.addUserToGroup(UUIDS.userId, dto);

      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(
        UUIDS.userId,
        dto,
      );
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addUserToGroup(UUIDS.userId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when group not found', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(
        controller.addUserToGroup(UUIDS.userId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when node is not a USER', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new BadRequestException('Node is not a USER'),
      );

      await expect(
        controller.addUserToGroup(UUIDS.userId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when target is not a GROUP', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new BadRequestException('Node is not a GROUP'),
      );

      await expect(
        controller.addUserToGroup(UUIDS.userId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already belongs to group', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new ConflictException('User already belongs to group'),
      );

      await expect(
        controller.addUserToGroup(UUIDS.userId, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnprocessableEntityException on cyclic relationship', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new UnprocessableEntityException('Cyclic relationship detected'),
      );

      await expect(
        controller.addUserToGroup(UUIDS.userId, dto),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('getUserOrganizations', () => {
    it('should return user organizations successfully', async () => {
      const organizations = [
        { id: UUIDS.groupId, name: 'Engineering', depth: 1 },
        { id: UUIDS.parentId, name: 'Tech Department', depth: 2 },
      ];

      mockUsersService.getUserOrganizations.mockResolvedValue(organizations);

      const result = await controller.getUserOrganizations(UUIDS.userId);

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        UUIDS.userId,
      );
      expect(result).toEqual(organizations);
    });

    it('should return empty array when user has no organizations', async () => {
      mockUsersService.getUserOrganizations.mockResolvedValue([]);

      const result = await controller.getUserOrganizations(UUIDS.userId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.getUserOrganizations.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.getUserOrganizations(UUIDS.userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when node is not a USER', async () => {
      mockUsersService.getUserOrganizations.mockRejectedValue(
        new BadRequestException('Node is not a USER'),
      );

      await expect(
        controller.getUserOrganizations(UUIDS.userId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
