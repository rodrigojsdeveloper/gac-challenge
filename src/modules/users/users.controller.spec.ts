import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NodeType } from 'src/entities/node.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    addUserToGroup: jest.fn(),
    getUserOrganizations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const expectedUser = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'John Doe',
        email: 'john@example.com',
        type: NodeType.USER,
      };

      mockUsersService.create.mockResolvedValue(expectedUser);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'existing@example.com',
      };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should pass DTO to service correctly', async () => {
      const createUserDto = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      mockUsersService.create.mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        ...createUserDto,
        type: NodeType.USER,
      });

      await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
    });
  });

  describe('addUserToGroup', () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const groupId = '22222222-2222-2222-2222-222222222222';

    it('should add user to group successfully', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockResolvedValue(undefined);

      const result = await controller.addUserToGroup(userId, addUserToGroupDto);

      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(
        userId,
        addUserToGroupDto,
      );
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addUserToGroup(userId, addUserToGroupDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(
        userId,
        addUserToGroupDto,
      );
    });

    it('should throw NotFoundException when group not found', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(
        controller.addUserToGroup(userId, addUserToGroupDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when node is not a USER', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockRejectedValue(
        new BadRequestException('Node is not a USER'),
      );

      await expect(
        controller.addUserToGroup(userId, addUserToGroupDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when target is not a GROUP', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockRejectedValue(
        new BadRequestException('Node is not a GROUP'),
      );

      await expect(
        controller.addUserToGroup(userId, addUserToGroupDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already belongs to group', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockRejectedValue(
        new ConflictException('User already belongs to group'),
      );

      await expect(
        controller.addUserToGroup(userId, addUserToGroupDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnprocessableEntityException when cyclic relationship detected', async () => {
      const addUserToGroupDto = { groupId };

      mockUsersService.addUserToGroup.mockRejectedValue(
        new UnprocessableEntityException('Cyclic relationship detected'),
      );

      await expect(
        controller.addUserToGroup(userId, addUserToGroupDto),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should pass correct parameters to service', async () => {
      const differentUserId = '33333333-3333-3333-3333-333333333333';
      const differentGroupId = '44444444-4444-4444-4444-444444444444';
      const addUserToGroupDto = { groupId: differentGroupId };

      mockUsersService.addUserToGroup.mockResolvedValue(undefined);

      await controller.addUserToGroup(differentUserId, addUserToGroupDto);

      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(
        differentUserId,
        addUserToGroupDto,
      );
      expect(mockUsersService.addUserToGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserOrganizations', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    it('should return user organizations successfully', async () => {
      const expectedOrganizations = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Engineering',
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Tech Department',
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Company',
          depth: 3,
        },
      ];

      mockUsersService.getUserOrganizations.mockResolvedValue(
        expectedOrganizations,
      );

      const result = await controller.getUserOrganizations(userId);

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(expectedOrganizations);
    });

    it('should return empty array when user has no organizations', async () => {
      mockUsersService.getUserOrganizations.mockResolvedValue([]);

      const result = await controller.getUserOrganizations(userId);

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.getUserOrganizations.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserOrganizations(userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should throw BadRequestException when node is not a USER', async () => {
      mockUsersService.getUserOrganizations.mockRejectedValue(
        new BadRequestException('Node is not a USER'),
      );

      await expect(controller.getUserOrganizations(userId)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should return organizations ordered by depth', async () => {
      const organizations = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Direct Group',
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Parent Group',
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Grandparent Group',
          depth: 3,
        },
      ];

      mockUsersService.getUserOrganizations.mockResolvedValue(organizations);

      const result = await controller.getUserOrganizations(userId);

      expect(result).toHaveLength(3);
      expect(result[0].depth).toBe(1);
      expect(result[1].depth).toBe(2);
      expect(result[2].depth).toBe(3);
    });

    it('should pass correct userId to service', async () => {
      const differentUserId = '55555555-5555-5555-5555-555555555555';

      mockUsersService.getUserOrganizations.mockResolvedValue([]);

      await controller.getUserOrganizations(differentUserId);

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        differentUserId,
      );
      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledTimes(1);
    });

    it('should handle single organization', async () => {
      const singleOrganization = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Only Group',
          depth: 1,
        },
      ];

      mockUsersService.getUserOrganizations.mockResolvedValue(
        singleOrganization,
      );

      const result = await controller.getUserOrganizations(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Only Group',
        depth: 1,
      });
    });
  });
});
