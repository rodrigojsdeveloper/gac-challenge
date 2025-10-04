import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { NodesService } from './nodes.service';
import { mockRepositoriesService } from 'test/mocks/repositories.mock';

describe('NodesService', () => {
  let service: NodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodesService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<NodesService>(NodesService);
    jest.clearAllMocks();
  });

  describe('getAncestors', () => {
    const nodeId = '11111111-1111-1111-1111-111111111111';

    it('should throw NotFoundException if node not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getAncestors(nodeId)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: nodeId },
      });
    });

    it('should return empty array if node has no ancestors', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Root Node',
        type: NodeType.GROUP,
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

      const result = await service.getAncestors(nodeId);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.descendant_id = :nodeId',
        { nodeId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'closure.depth',
        'ASC',
      );
    });

    it('should return ancestors ordered by depth', async () => {
      const ancestor1Id = '22222222-2222-2222-2222-222222222222';
      const ancestor2Id = '33333333-3333-3333-3333-333333333333';
      const ancestor3Id = '44444444-4444-4444-4444-444444444444';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Child Node',
        type: NodeType.USER,
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: ancestor1Id,
            name: 'Parent Group',
            type: NodeType.GROUP,
            depth: 1,
          },
          {
            id: ancestor2Id,
            name: 'Grandparent Group',
            type: NodeType.GROUP,
            depth: 2,
          },
          {
            id: ancestor3Id,
            name: 'Root Group',
            type: NodeType.GROUP,
            depth: 3,
          },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(nodeId);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        {
          id: ancestor1Id,
          name: 'Parent Group',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: ancestor2Id,
          name: 'Grandparent Group',
          type: NodeType.GROUP,
          depth: 2,
        },
        {
          id: ancestor3Id,
          name: 'Root Group',
          type: NodeType.GROUP,
          depth: 3,
        },
      ]);

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

    it('should return single ancestor', async () => {
      const ancestorId = '22222222-2222-2222-2222-222222222222';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Child Node',
        type: NodeType.USER,
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: ancestorId,
            name: 'Direct Parent',
            type: NodeType.GROUP,
            depth: 1,
          },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(nodeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: ancestorId,
        name: 'Direct Parent',
        type: NodeType.GROUP,
        depth: 1,
      });
    });

    it('should filter ancestors with depth >= 1', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Node',
        type: NodeType.USER,
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

      await service.getAncestors(nodeId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
    });

    it('should handle different node types', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Group Node',
        type: NodeType.GROUP,
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Parent',
            type: NodeType.GROUP,
            depth: 1,
          },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(nodeId);

      expect(result).toHaveLength(1);
      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: nodeId },
      });
    });
  });

  describe('getDescendants', () => {
    const nodeId = '11111111-1111-1111-1111-111111111111';

    it('should throw NotFoundException if node not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getDescendants(nodeId)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: nodeId },
      });
    });

    it('should return empty array if node has no descendants', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Leaf Node',
        type: NodeType.USER,
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

      const result = await service.getDescendants(nodeId);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.ancestor_id = :nodeId',
        { nodeId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'closure.depth',
        'ASC',
      );
    });

    it('should return descendants ordered by depth', async () => {
      const descendant1Id = '22222222-2222-2222-2222-222222222222';
      const descendant2Id = '33333333-3333-3333-3333-333333333333';
      const descendant3Id = '44444444-4444-4444-4444-444444444444';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Root Group',
        type: NodeType.GROUP,
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: descendant1Id,
            name: 'Child Group',
            type: NodeType.GROUP,
            depth: 1,
          },
          {
            id: descendant2Id,
            name: 'Grandchild Group',
            type: NodeType.GROUP,
            depth: 2,
          },
          {
            id: descendant3Id,
            name: 'User',
            type: NodeType.USER,
            depth: 3,
          },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(nodeId);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        {
          id: descendant1Id,
          name: 'Child Group',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: descendant2Id,
          name: 'Grandchild Group',
          type: NodeType.GROUP,
          depth: 2,
        },
        {
          id: descendant3Id,
          name: 'User',
          type: NodeType.USER,
          depth: 3,
        },
      ]);

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

    it('should return single descendant', async () => {
      const descendantId = '22222222-2222-2222-2222-222222222222';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Parent Group',
        type: NodeType.GROUP,
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: descendantId,
            name: 'Direct Child',
            type: NodeType.USER,
            depth: 1,
          },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(nodeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: descendantId,
        name: 'Direct Child',
        type: NodeType.USER,
        depth: 1,
      });
    });

    it('should filter descendants with depth >= 1', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Node',
        type: NodeType.GROUP,
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

      await service.getDescendants(nodeId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
    });

    it('should handle mixed descendant types', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: nodeId,
        name: 'Root Group',
        type: NodeType.GROUP,
      });

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Child Group',
            type: NodeType.GROUP,
            depth: 1,
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'User 1',
            type: NodeType.USER,
            depth: 2,
          },
          {
            id: '44444444-4444-4444-4444-444444444444',
            name: 'User 2',
            type: NodeType.USER,
            depth: 2,
          },
        ]),
      };

      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(nodeId);

      expect(result).toHaveLength(3);
      expect(
        result.filter((d) => String(d.type) === String(NodeType.GROUP)),
      ).toHaveLength(1);
      expect(
        result.filter((d) => String(d.type) === String(NodeType.USER)),
      ).toHaveLength(2);
    });

    it('should use correct query parameters', async () => {
      const differentNodeId = '55555555-5555-5555-5555-555555555555';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: differentNodeId,
        name: 'Different Node',
        type: NodeType.GROUP,
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

      await service.getDescendants(differentNodeId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.ancestor_id = :nodeId',
        { nodeId: differentNodeId },
      );
    });
  });
});
