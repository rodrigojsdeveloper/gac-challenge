import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { UsersService } from './users.service';
import { MetricsModule } from '../metrics/metrics.module';
import {
  createMockQueryBuilder,
  mockRepositoriesService,
  UUIDS,
} from 'test/mocks/repositories.mock';

type ClosureProps = {
  ancestorId: string;
  descendantId: string;
  depth: number;
};

describe('UsersService', () => {
  let service: UsersService;

  const createMockNode = (
    id: string,
    name: string,
    type: NodeType,
    email?: string,
  ) => ({
    id,
    name,
    email,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MetricsModule],
      providers: [
        UsersService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockRepositoriesService.nodeRepository.findOneBy.mockResolvedValue({
        id: 'existing-id',
        email: 'john@example.com',
      });

      await expect(
        service.create({ name: 'John Doe', email: 'john@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user successfully', async () => {
      const user = createMockNode(
        UUIDS.userId,
        'John Doe',
        NodeType.USER,
        'john@example.com',
      );

      mockRepositoriesService.nodeRepository.findOneBy.mockResolvedValue(null);
      mockRepositoriesService.nodeRepository.create.mockReturnValue(user);
      mockRepositoriesService.nodeRepository.save.mockResolvedValue(user);
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
        ancestorId: user.id,
        descendantId: user.id,
        depth: 0,
      });
      expect(result).toEqual({ ...user, type: NodeType.USER });
    });
  });

  describe('addUserToGroup', () => {
    describe('validation', () => {
      it('should throw NotFoundException when user not found', async () => {
        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

        await expect(
          service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException when node is not a USER', async () => {
        const group = createMockNode(UUIDS.userId, 'Group', NodeType.GROUP);
        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(group);

        await expect(
          service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw NotFoundException when group not found', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(null);

        await expect(
          service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException when target is not a GROUP', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const notGroup = createMockNode(
          UUIDS.groupId,
          'Jane',
          NodeType.USER,
          'jane@example.com',
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(notGroup);

        await expect(
          service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw ConflictException if user already belongs to group', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const group = createMockNode(
          UUIDS.groupId,
          'Engineering',
          NodeType.GROUP,
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(group);
        mockRepositoriesService.closureRepository.findOne.mockResolvedValue({
          ancestorId: UUIDS.groupId,
          descendantId: UUIDS.userId,
          depth: 1,
        });

        await expect(
          service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId }),
        ).rejects.toThrow(ConflictException);
      });

      it('should throw UnprocessableEntityException on cyclic relationship', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const group = createMockNode(
          UUIDS.groupId,
          'Engineering',
          NodeType.GROUP,
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(group);
        mockRepositoriesService.closureRepository.findOne.mockResolvedValue(
          null,
        );
        mockRepositoriesService.closureRepository.find.mockResolvedValue([
          { ancestorId: UUIDS.userId, descendantId: UUIDS.groupId, depth: 1 },
        ]);

        await expect(
          service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId }),
        ).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('simple relationship', () => {
      it('should add user to group successfully', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const group = createMockNode(
          UUIDS.groupId,
          'Engineering',
          NodeType.GROUP,
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(group);
        mockRepositoriesService.closureRepository.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            ancestorId: UUIDS.userId,
            descendantId: UUIDS.userId,
            depth: 0,
          });
        mockRepositoriesService.closureRepository.find.mockResolvedValue([
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ]);
        mockRepositoriesService.closureRepository.create.mockImplementation(
          (data: ClosureProps) => data,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId });

        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledWith([
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.userId, depth: 1 },
        ]);
      });

      it('should create user self-reference if not exists', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const group = createMockNode(
          UUIDS.groupId,
          'Engineering',
          NodeType.GROUP,
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(group);
        mockRepositoriesService.closureRepository.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        mockRepositoriesService.closureRepository.find.mockResolvedValue([
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ]);
        mockRepositoriesService.closureRepository.create.mockImplementation(
          (data: ClosureProps) => data,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId });

        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledWith([
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.userId, depth: 1 },
          { ancestorId: UUIDS.userId, descendantId: UUIDS.userId, depth: 0 },
        ]);
      });
    });

    describe('hierarchical relationships', () => {
      it('should add user to group with parent hierarchy', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const group = createMockNode(
          UUIDS.groupId,
          'Engineering',
          NodeType.GROUP,
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(group);
        mockRepositoriesService.closureRepository.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            ancestorId: UUIDS.userId,
            descendantId: UUIDS.userId,
            depth: 0,
          });
        mockRepositoriesService.closureRepository.find.mockResolvedValue([
          { ancestorId: UUIDS.parentId, descendantId: UUIDS.groupId, depth: 1 },
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ]);
        mockRepositoriesService.closureRepository.create.mockImplementation(
          (data: ClosureProps) => data,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId });

        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledWith([
          { ancestorId: UUIDS.parentId, descendantId: UUIDS.userId, depth: 2 },
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.userId, depth: 1 },
        ]);
      });

      it('should preserve closure depth calculation correctly', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const group = createMockNode(
          UUIDS.groupId,
          'Engineering',
          NodeType.GROUP,
        );

        mockRepositoriesService.nodeRepository.findOne
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(group);
        mockRepositoriesService.closureRepository.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            ancestorId: UUIDS.userId,
            descendantId: UUIDS.userId,
            depth: 0,
          });
        mockRepositoriesService.closureRepository.find.mockResolvedValue([
          { ancestorId: UUIDS.rootId, descendantId: UUIDS.groupId, depth: 2 },
          { ancestorId: UUIDS.parentId, descendantId: UUIDS.groupId, depth: 1 },
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ]);
        mockRepositoriesService.closureRepository.create.mockImplementation(
          (data: ClosureProps) => data,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.addUserToGroup(UUIDS.userId, { groupId: UUIDS.groupId });

        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledWith([
          { ancestorId: UUIDS.rootId, descendantId: UUIDS.userId, depth: 3 },
          { ancestorId: UUIDS.parentId, descendantId: UUIDS.userId, depth: 2 },
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.userId, depth: 1 },
        ]);
      });
    });
  });

  describe('getUserOrganizations', () => {
    describe('validation', () => {
      it('should throw NotFoundException when user not found', async () => {
        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

        await expect(
          service.getUserOrganizations(UUIDS.userId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException when node is not a USER', async () => {
        const group = createMockNode(
          UUIDS.userId,
          'Engineering',
          NodeType.GROUP,
        );
        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(group);

        await expect(
          service.getUserOrganizations(UUIDS.userId),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('query results', () => {
      it('should return empty array when user has no organizations', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );

        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(user);
        const mockQueryBuilder = createMockQueryBuilder([]);
        mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder,
        );

        const result = await service.getUserOrganizations(UUIDS.userId);

        expect(result).toEqual([]);
      });

      it('should return user organizations ordered by depth', async () => {
        const user = createMockNode(
          UUIDS.userId,
          'John',
          NodeType.USER,
          'john@example.com',
        );
        const organizations = [
          { id: UUIDS.groupId, name: 'Engineering', depth: 1 },
          { id: UUIDS.parentId, name: 'Tech Department', depth: 2 },
          { id: UUIDS.rootId, name: 'Company', depth: 3 },
        ];

        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(user);
        const mockQueryBuilder = createMockQueryBuilder(organizations);
        mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder,
        );

        const result = await service.getUserOrganizations(UUIDS.userId);

        expect(result).toEqual(organizations);
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'closure.descendant_id = :userId',
          { userId: UUIDS.userId },
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
    });
  });
});
