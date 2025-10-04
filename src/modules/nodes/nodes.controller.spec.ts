import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';

describe('NodesController', () => {
  let controller: NodesController;

  const mockNodesService = {
    getAncestors: jest.fn(),
    getDescendants: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodesController],
      providers: [{ provide: NodesService, useValue: mockNodesService }],
    }).compile();

    controller = module.get<NodesController>(NodesController);
    jest.clearAllMocks();
  });

  describe('getAncestors', () => {
    const nodeId = '11111111-1111-1111-1111-111111111111';

    it('should return ancestors successfully', async () => {
      const expectedAncestors = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Parent Group',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Grandparent Group',
          type: NodeType.GROUP,
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Root Group',
          type: NodeType.GROUP,
          depth: 3,
        },
      ];

      mockNodesService.getAncestors.mockResolvedValue(expectedAncestors);

      const result = await controller.getAncestors(nodeId);

      expect(mockNodesService.getAncestors).toHaveBeenCalledWith(nodeId);
      expect(result).toEqual(expectedAncestors);
    });

    it('should return empty array when node has no ancestors', async () => {
      mockNodesService.getAncestors.mockResolvedValue([]);

      const result = await controller.getAncestors(nodeId);

      expect(mockNodesService.getAncestors).toHaveBeenCalledWith(nodeId);
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when node not found', async () => {
      mockNodesService.getAncestors.mockRejectedValue(
        new NotFoundException('Node not found'),
      );

      await expect(controller.getAncestors(nodeId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockNodesService.getAncestors).toHaveBeenCalledWith(nodeId);
    });

    it('should return ancestors ordered by depth', async () => {
      const ancestors = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Direct Parent',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Second Level',
          type: NodeType.GROUP,
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Third Level',
          type: NodeType.GROUP,
          depth: 3,
        },
      ];

      mockNodesService.getAncestors.mockResolvedValue(ancestors);

      const result = await controller.getAncestors(nodeId);

      expect(result).toHaveLength(3);
      expect(result[0].depth).toBe(1);
      expect(result[1].depth).toBe(2);
      expect(result[2].depth).toBe(3);
    });

    it('should pass correct nodeId to service', async () => {
      const differentNodeId = '55555555-5555-5555-5555-555555555555';

      mockNodesService.getAncestors.mockResolvedValue([]);

      await controller.getAncestors(differentNodeId);

      expect(mockNodesService.getAncestors).toHaveBeenCalledWith(
        differentNodeId,
      );
      expect(mockNodesService.getAncestors).toHaveBeenCalledTimes(1);
    });

    it('should return single ancestor', async () => {
      const singleAncestor = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Only Parent',
          type: NodeType.GROUP,
          depth: 1,
        },
      ];

      mockNodesService.getAncestors.mockResolvedValue(singleAncestor);

      const result = await controller.getAncestors(nodeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Only Parent',
        type: NodeType.GROUP,
        depth: 1,
      });
    });

    it('should handle ancestors with different types', async () => {
      const mixedAncestors = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Group Ancestor',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Another Group',
          type: NodeType.GROUP,
          depth: 2,
        },
      ];

      mockNodesService.getAncestors.mockResolvedValue(mixedAncestors);

      const result = await controller.getAncestors(nodeId);

      expect(result).toHaveLength(2);
      expect(
        result.every(
          (ancestor) => String(ancestor.type) === String(NodeType.GROUP),
        ),
      ).toBe(true);
    });

    it('should call service only once', async () => {
      mockNodesService.getAncestors.mockResolvedValue([]);

      await controller.getAncestors(nodeId);

      expect(mockNodesService.getAncestors).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDescendants', () => {
    const nodeId = '11111111-1111-1111-1111-111111111111';

    it('should return descendants successfully', async () => {
      const expectedDescendants = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Child Group',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Grandchild Group',
          type: NodeType.GROUP,
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'User',
          type: NodeType.USER,
          depth: 3,
        },
      ];

      mockNodesService.getDescendants.mockResolvedValue(expectedDescendants);

      const result = await controller.getDescendants(nodeId);

      expect(mockNodesService.getDescendants).toHaveBeenCalledWith(nodeId);
      expect(result).toEqual(expectedDescendants);
    });

    it('should return empty array when node has no descendants', async () => {
      mockNodesService.getDescendants.mockResolvedValue([]);

      const result = await controller.getDescendants(nodeId);

      expect(mockNodesService.getDescendants).toHaveBeenCalledWith(nodeId);
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when node not found', async () => {
      mockNodesService.getDescendants.mockRejectedValue(
        new NotFoundException('Node not found'),
      );

      await expect(controller.getDescendants(nodeId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockNodesService.getDescendants).toHaveBeenCalledWith(nodeId);
    });

    it('should return descendants ordered by depth', async () => {
      const descendants = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Direct Child',
          type: NodeType.GROUP,
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Second Level',
          type: NodeType.USER,
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Third Level',
          type: NodeType.USER,
          depth: 3,
        },
      ];

      mockNodesService.getDescendants.mockResolvedValue(descendants);

      const result = await controller.getDescendants(nodeId);

      expect(result).toHaveLength(3);
      expect(result[0].depth).toBe(1);
      expect(result[1].depth).toBe(2);
      expect(result[2].depth).toBe(3);
    });

    it('should pass correct nodeId to service', async () => {
      const differentNodeId = '55555555-5555-5555-5555-555555555555';

      mockNodesService.getDescendants.mockResolvedValue([]);

      await controller.getDescendants(differentNodeId);

      expect(mockNodesService.getDescendants).toHaveBeenCalledWith(
        differentNodeId,
      );
      expect(mockNodesService.getDescendants).toHaveBeenCalledTimes(1);
    });

    it('should return single descendant', async () => {
      const singleDescendant = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Only Child',
          type: NodeType.USER,
          depth: 1,
        },
      ];

      mockNodesService.getDescendants.mockResolvedValue(singleDescendant);

      const result = await controller.getDescendants(nodeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Only Child',
        type: NodeType.USER,
        depth: 1,
      });
    });

    it('should handle descendants with mixed types', async () => {
      const mixedDescendants = [
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
      ];

      mockNodesService.getDescendants.mockResolvedValue(mixedDescendants);

      const result = await controller.getDescendants(nodeId);

      expect(result).toHaveLength(3);
      expect(
        result.filter((d) => String(d.type) === String(NodeType.GROUP)),
      ).toHaveLength(1);
      expect(
        result.filter((d) => String(d.type) === String(NodeType.USER)),
      ).toHaveLength(2);
    });

    it('should call service only once', async () => {
      mockNodesService.getDescendants.mockResolvedValue([]);

      await controller.getDescendants(nodeId);

      expect(mockNodesService.getDescendants).toHaveBeenCalledTimes(1);
    });

    it('should handle large descendant hierarchies', async () => {
      const largeHierarchy = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}${i}${i}${i}${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}`,
        name: `Level ${i + 1}`,
        type: i % 2 === 0 ? NodeType.GROUP : NodeType.USER,
        depth: i + 1,
      }));

      mockNodesService.getDescendants.mockResolvedValue(largeHierarchy);

      const result = await controller.getDescendants(nodeId);

      expect(result).toHaveLength(10);
      expect(result[0].depth).toBe(1);
      expect(result[9].depth).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle service throwing unexpected errors for getAncestors', async () => {
      const nodeId = '11111111-1111-1111-1111-111111111111';
      const unexpectedError = new Error('Database connection failed');

      mockNodesService.getAncestors.mockRejectedValue(unexpectedError);

      await expect(controller.getAncestors(nodeId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle service throwing unexpected errors for getDescendants', async () => {
      const nodeId = '11111111-1111-1111-1111-111111111111';
      const unexpectedError = new Error('Query timeout');

      mockNodesService.getDescendants.mockRejectedValue(unexpectedError);

      await expect(controller.getDescendants(nodeId)).rejects.toThrow(
        'Query timeout',
      );
    });

    it('should not modify service response for getAncestors', async () => {
      const nodeId = '11111111-1111-1111-1111-111111111111';
      const serviceResponse = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Test',
          type: NodeType.GROUP,
          depth: 1,
        },
      ];

      mockNodesService.getAncestors.mockResolvedValue(serviceResponse);

      const result = await controller.getAncestors(nodeId);

      expect(result).toBe(serviceResponse);
    });

    it('should not modify service response for getDescendants', async () => {
      const nodeId = '11111111-1111-1111-1111-111111111111';
      const serviceResponse = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Test',
          type: NodeType.USER,
          depth: 1,
        },
      ];

      mockNodesService.getDescendants.mockResolvedValue(serviceResponse);

      const result = await controller.getDescendants(nodeId);

      expect(result).toBe(serviceResponse);
    });
  });
});
