import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { NodesService } from './nodes.service';
import {
  createMockQueryBuilder,
  mockRepositoriesService,
  UUIDS,
} from 'test/mocks/repositories.mock';

describe('NodesService', () => {
  let service: NodesService;

  const createMockNode = (id: string, name: string, type = NodeType.GROUP) => ({
    id,
    name,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodesService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<NodesService>(NodesService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAncestors', () => {
    it('should throw NotFoundException when node does not exist', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getAncestors(UUIDS.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array when node has no ancestors', async () => {
      const node = createMockNode(UUIDS.userId, 'Root Node');
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(node);

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(UUIDS.userId);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.descendant_id = :nodeId',
        { nodeId: UUIDS.userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
    });

    it('should return ancestors ordered by depth ascending', async () => {
      const node = createMockNode(UUIDS.userId, 'Child Node', NodeType.USER);
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(node);

      const ancestors = [
        { id: UUIDS.groupId, name: 'Parent', type: NodeType.GROUP, depth: 1 },
        {
          id: UUIDS.parentId,
          name: 'Grandparent',
          type: NodeType.GROUP,
          depth: 2,
        },
        { id: UUIDS.rootId, name: 'Root', type: NodeType.GROUP, depth: 3 },
      ];

      const mockQueryBuilder = createMockQueryBuilder(ancestors);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(UUIDS.userId);

      expect(result).toEqual(ancestors);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'closure.depth',
        'ASC',
      );
    });

    it('should correctly build query with innerJoin and select', async () => {
      const node = createMockNode(UUIDS.userId, 'Node');
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(node);

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.getAncestors(UUIDS.userId);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        expect.anything(),
        'node',
        'node.id = closure.ancestor_id',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'node.id AS id',
        'node.name AS name',
        'node.type AS type',
        'closure.depth AS depth',
      ]);
    });
  });

  describe('getDescendants', () => {
    it('should throw NotFoundException when node does not exist', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getDescendants(UUIDS.userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array when node has no descendants', async () => {
      const node = createMockNode(UUIDS.userId, 'Leaf Node', NodeType.USER);
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(node);

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(UUIDS.userId);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.ancestor_id = :nodeId',
        { nodeId: UUIDS.userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
    });

    it('should return descendants ordered by depth ascending', async () => {
      const node = createMockNode(UUIDS.userId, 'Root');
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(node);

      const descendants = [
        { id: UUIDS.groupId, name: 'Child', type: NodeType.GROUP, depth: 1 },
        {
          id: UUIDS.parentId,
          name: 'Grandchild',
          type: NodeType.GROUP,
          depth: 2,
        },
        { id: UUIDS.rootId, name: 'User', type: NodeType.USER, depth: 3 },
      ];

      const mockQueryBuilder = createMockQueryBuilder(descendants);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(UUIDS.userId);

      expect(result).toEqual(descendants);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'closure.depth',
        'ASC',
      );
    });

    it('should correctly build query with innerJoin and select', async () => {
      const node = createMockNode(UUIDS.userId, 'Node');
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(node);

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.getDescendants(UUIDS.userId);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        expect.anything(),
        'node',
        'node.id = closure.descendant_id',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'node.id AS id',
        'node.name AS name',
        'node.type AS type',
        'closure.depth AS depth',
      ]);
    });
  });
});
