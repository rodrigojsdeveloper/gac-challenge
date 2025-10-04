import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RepositoriesService } from 'src/repositories';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';

interface ClosureProps {
  ancestorId: string;
  descendantId: string;
  depth: number;
}

describe('UsersService', () => {
  let service: UsersService;

  const mockRepositoriesService = {
    nodeRepository: {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
    closureRepository: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockRepositoriesService.nodeRepository.findOneBy.mockResolvedValue({
        id: 'existing-uuid',
        email: 'existing@example.com',
      });

      await expect(
        service.create({
          name: 'John Doe',
          email: 'existing@example.com',
        }),
      ).rejects.toThrow(ConflictException);

      expect(
        mockRepositoriesService.nodeRepository.findOneBy,
      ).toHaveBeenCalledWith({ email: 'existing@example.com' });
    });

    it('should create user successfully', async () => {
      const userUuid = '11111111-1111-1111-1111-111111111111';

      mockRepositoriesService.nodeRepository.findOneBy.mockResolvedValue(null);
      mockRepositoriesService.nodeRepository.create.mockReturnValue({
        id: userUuid,
        name: 'John Doe',
        email: 'john@example.com',
        type: NodeType.USER,
      });
      mockRepositoriesService.nodeRepository.save.mockResolvedValue({
        id: userUuid,
        name: 'John Doe',
        email: 'john@example.com',
        type: NodeType.USER,
      });
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      const result = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(
        mockRepositoriesService.nodeRepository.create,
      ).toHaveBeenCalledWith({
        type: NodeType.USER,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith({
        ancestorId: userUuid,
        descendantId: userUuid,
        depth: 0,
      });

      expect(result).toEqual({
        id: userUuid,
        name: 'John Doe',
        email: 'john@example.com',
        type: NodeType.USER,
      });
    });
  });

  describe('addUserToGroup', () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const groupId = '22222222-2222-2222-2222-222222222222';

    it('should throw NotFoundException if user not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.addUserToGroup(userId, { groupId })).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw BadRequestException if node is not a USER', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValueOnce({
        id: userId,
        type: NodeType.GROUP,
        name: 'Not a user',
      });

      await expect(service.addUserToGroup(userId, { groupId })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if group not found', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce(null);

      await expect(service.addUserToGroup(userId, { groupId })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if target is not a GROUP', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce({
          id: groupId,
          type: NodeType.USER,
          name: 'Not a group',
        });

      await expect(service.addUserToGroup(userId, { groupId })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if user already belongs to group', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce({
          id: groupId,
          type: NodeType.GROUP,
          name: 'Engineering',
        });

      mockRepositoriesService.closureRepository.findOne.mockResolvedValue({
        ancestorId: groupId,
        descendantId: userId,
        depth: 1,
      });

      await expect(service.addUserToGroup(userId, { groupId })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw UnprocessableEntityException if cyclic relationship detected', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce({
          id: groupId,
          type: NodeType.GROUP,
          name: 'Engineering',
        });

      mockRepositoriesService.closureRepository.findOne.mockResolvedValue(null);

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: userId, descendantId: groupId, depth: 1 },
        { ancestorId: groupId, descendantId: groupId, depth: 0 },
      ]);

      await expect(service.addUserToGroup(userId, { groupId })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should add user to group successfully', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce({
          id: groupId,
          type: NodeType.GROUP,
          name: 'Engineering',
        });

      mockRepositoriesService.closureRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ancestorId: userId,
          descendantId: userId,
          depth: 0,
        });

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: groupId, descendantId: groupId, depth: 0 },
      ]);

      mockRepositoriesService.closureRepository.create.mockImplementation(
        (data: ClosureProps) => data,
      );
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      await service.addUserToGroup(userId, { groupId });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith([
        {
          ancestorId: groupId,
          descendantId: userId,
          depth: 1,
        },
      ]);
    });

    it('should add user to group with hierarchy', async () => {
      const parentGroupId = '33333333-3333-3333-3333-333333333333';

      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce({
          id: groupId,
          type: NodeType.GROUP,
          name: 'Engineering',
        });

      mockRepositoriesService.closureRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ancestorId: userId,
          descendantId: userId,
          depth: 0,
        });

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: parentGroupId, descendantId: groupId, depth: 1 },
        { ancestorId: groupId, descendantId: groupId, depth: 0 },
      ]);

      mockRepositoriesService.closureRepository.create.mockImplementation(
        (data: ClosureProps) => data,
      );
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      await service.addUserToGroup(userId, { groupId });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith([
        {
          ancestorId: parentGroupId,
          descendantId: userId,
          depth: 2,
        },
        {
          ancestorId: groupId,
          descendantId: userId,
          depth: 1,
        },
      ]);
    });

    it('should create user self-reference if not exists', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce({
          id: userId,
          type: NodeType.USER,
          name: 'John Doe',
        })
        .mockResolvedValueOnce({
          id: groupId,
          type: NodeType.GROUP,
          name: 'Engineering',
        });

      mockRepositoriesService.closureRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: groupId, descendantId: groupId, depth: 0 },
      ]);

      mockRepositoriesService.closureRepository.create.mockImplementation(
        (data: ClosureProps) => data,
      );
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      await service.addUserToGroup(userId, { groupId });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith([
        {
          ancestorId: groupId,
          descendantId: userId,
          depth: 1,
        },
        {
          ancestorId: userId,
          descendantId: userId,
          depth: 0,
        },
      ]);
    });
  });

  describe('getUserOrganizations', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    it('should throw NotFoundException if user not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserOrganizations(userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw BadRequestException if node is not a USER', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: userId,
        type: NodeType.GROUP,
        name: 'Not a user',
      });

      await expect(service.getUserOrganizations(userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty array if user has no organizations', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: userId,
        type: NodeType.USER,
        name: 'John Doe',
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getUserOrganizations(userId);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    });

    it('should return user organizations ordered by depth', async () => {
      const group1Id = '22222222-2222-2222-2222-222222222222';
      const group2Id = '33333333-3333-3333-3333-333333333333';
      const group3Id = '44444444-4444-4444-4444-444444444444';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: userId,
        type: NodeType.USER,
        name: 'John Doe',
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { id: group1Id, name: 'Engineering', depth: 1 },
          { id: group2Id, name: 'Tech Department', depth: 2 },
          { id: group3Id, name: 'Company', depth: 3 },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getUserOrganizations(userId);

      expect(result).toEqual([
        { id: group1Id, name: 'Engineering', depth: 1 },
        { id: group2Id, name: 'Tech Department', depth: 2 },
        { id: group3Id, name: 'Company', depth: 3 },
      ]);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.descendant_id = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'node.type = :type',
        {
          type: NodeType.GROUP,
        },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'closure.depth',
        'ASC',
      );
    });

    it('should filter only GROUP type nodes', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: userId,
        type: NodeType.USER,
        name: 'John Doe',
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.getUserOrganizations(userId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'node.type = :type',
        {
          type: NodeType.GROUP,
        },
      );
    });

    it('should only return ancestors with depth >= 1', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: userId,
        type: NodeType.USER,
        name: 'John Doe',
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.getUserOrganizations(userId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
    });
  });
});
