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

  const nodeId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodesController],
      providers: [{ provide: NodesService, useValue: mockNodesService }],
    }).compile();

    controller = module.get<NodesController>(NodesController);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('getAncestors', () => {
    const nodeId = '11111111-1111-1111-1111-111111111111';

    it('should return ancestors successfully', async () => {
      const expectedAncestors = [
        { id: '222', name: 'Parent', type: NodeType.GROUP, depth: 1 },
        { id: '333', name: 'Grandparent', type: NodeType.GROUP, depth: 2 },
      ];

      mockNodesService.getAncestors.mockResolvedValue(expectedAncestors);

      const result = await controller.getAncestors(nodeId);

      expect(mockNodesService.getAncestors).toHaveBeenCalledWith(nodeId);
      expect(result).toEqual(expectedAncestors);
    });

    it('should return empty array if node has no ancestors', async () => {
      mockNodesService.getAncestors.mockResolvedValue([]);

      const result = await controller.getAncestors(nodeId);

      expect(result).toEqual([]);
      expect(mockNodesService.getAncestors).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if node not found', async () => {
      mockNodesService.getAncestors.mockRejectedValue(
        new NotFoundException('Node not found'),
      );

      await expect(controller.getAncestors(nodeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should preserve the service response reference', async () => {
      const serviceResponse = [
        { id: 'xyz', name: 'Test', type: NodeType.GROUP, depth: 1 },
      ];
      mockNodesService.getAncestors.mockResolvedValue(serviceResponse);

      const result = await controller.getAncestors(nodeId);
      expect(result).toBe(serviceResponse);
    });

    it('should handle unexpected service errors', async () => {
      mockNodesService.getAncestors.mockRejectedValue(
        new Error('DB connection failed'),
      );

      await expect(controller.getAncestors(nodeId)).rejects.toThrow(
        'DB connection failed',
      );
    });
  });

  describe('getDescendants', () => {
    it('should return descendants successfully', async () => {
      const expectedDescendants = [
        { id: '222', name: 'Child', type: NodeType.GROUP, depth: 1 },
        { id: '333', name: 'Grandchild', type: NodeType.USER, depth: 2 },
      ];

      mockNodesService.getDescendants.mockResolvedValue(expectedDescendants);

      const result = await controller.getDescendants(nodeId);

      expect(mockNodesService.getDescendants).toHaveBeenCalledWith(nodeId);
      expect(result).toEqual(expectedDescendants);
    });

    it('should return empty array if node has no descendants', async () => {
      mockNodesService.getDescendants.mockResolvedValue([]);

      const result = await controller.getDescendants(nodeId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if node not found', async () => {
      mockNodesService.getDescendants.mockRejectedValue(
        new NotFoundException('Node not found'),
      );

      await expect(controller.getDescendants(nodeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle mixed descendant types', async () => {
      const mixed = [
        { id: 'a', name: 'Group', type: NodeType.GROUP, depth: 1 },
        { id: 'b', name: 'User', type: NodeType.USER, depth: 2 },
      ];

      mockNodesService.getDescendants.mockResolvedValue(mixed);

      const result = await controller.getDescendants(nodeId);

      expect(result).toHaveLength(2);
      expect(
        result.find((x) => String(x.type) === String(NodeType.GROUP)),
      ).toBeDefined();
      expect(
        result.find((x) => String(x.type) === String(NodeType.USER)),
      ).toBeDefined();
    });

    it('should handle unexpected errors', async () => {
      mockNodesService.getDescendants.mockRejectedValue(
        new Error('Timeout error'),
      );

      await expect(controller.getDescendants(nodeId)).rejects.toThrow(
        'Timeout error',
      );
    });
  });
});
