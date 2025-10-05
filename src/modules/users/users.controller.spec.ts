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

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    addUserToGroup: jest.fn(),
    getUserOrganizations: jest.fn(),
  };

  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockGroupId = '22222222-2222-2222-2222-222222222222';
  const createUserDto = { name: 'John Doe', email: 'john@example.com' };
  const addUserToGroupDto = { groupId: mockGroupId };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const expectedUser = {
        id: mockUserId,
        ...createUserDto,
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
      const dto = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      mockUsersService.create.mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        ...dto,
        type: NodeType.USER,
      });

      await controller.create(dto);

      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('addUserToGroup', () => {
    beforeEach(() => {
      mockUsersService.addUserToGroup.mockResolvedValue(undefined);
    });

    it('should add user to group successfully', async () => {
      const result = await controller.addUserToGroup(
        mockUserId,
        addUserToGroupDto,
      );

      expect(result).toBeUndefined();
      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(
        mockUserId,
        addUserToGroupDto,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addUserToGroup(mockUserId, addUserToGroupDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(
        mockUserId,
        addUserToGroupDto,
      );
    });

    it('should throw NotFoundException when group not found', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(
        controller.addUserToGroup(mockUserId, addUserToGroupDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when node is not a USER', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new BadRequestException('Node is not a USER'),
      );

      await expect(
        controller.addUserToGroup(mockUserId, addUserToGroupDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when target is not a GROUP', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new BadRequestException('Node is not a GROUP'),
      );

      await expect(
        controller.addUserToGroup(mockUserId, addUserToGroupDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already belongs to group', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new ConflictException('User already belongs to group'),
      );

      await expect(
        controller.addUserToGroup(mockUserId, addUserToGroupDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnprocessableEntityException when cyclic relationship detected', async () => {
      mockUsersService.addUserToGroup.mockRejectedValue(
        new UnprocessableEntityException('Cyclic relationship detected'),
      );

      await expect(
        controller.addUserToGroup(mockUserId, addUserToGroupDto),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should pass correct parameters to service', async () => {
      const diffUserId = '33333333-3333-3333-3333-333333333333';
      const diffGroupId = '44444444-4444-4444-4444-444444444444';

      await controller.addUserToGroup(diffUserId, { groupId: diffGroupId });

      expect(mockUsersService.addUserToGroup).toHaveBeenCalledWith(diffUserId, {
        groupId: diffGroupId,
      });
    });
  });

  describe('getUserOrganizations', () => {
    it('should return user organizations successfully', async () => {
      const organizations = [
        { id: mockGroupId, name: 'Engineering', depth: 1 },
        { id: '33333333-3333-3333-3333-333333333333', name: 'Tech', depth: 2 },
      ];

      mockUsersService.getUserOrganizations.mockResolvedValue(organizations);

      const result = await controller.getUserOrganizations(mockUserId);

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual(organizations);
    });

    it('should return empty array when user has no organizations', async () => {
      mockUsersService.getUserOrganizations.mockResolvedValue([]);

      const result = await controller.getUserOrganizations(mockUserId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.getUserOrganizations.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserOrganizations(mockUserId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should throw BadRequestException when node is not a USER', async () => {
      mockUsersService.getUserOrganizations.mockRejectedValue(
        new BadRequestException('Node is not a USER'),
      );

      await expect(controller.getUserOrganizations(mockUserId)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(
        mockUserId,
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

      const result = await controller.getUserOrganizations(mockUserId);

      expect(result.map((o) => o.depth)).toEqual([1, 2, 3]);
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

      const result = await controller.getUserOrganizations(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Only Group',
        depth: 1,
      });
    });
  });
});
