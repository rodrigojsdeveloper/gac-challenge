import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { UUIDS } from 'test/mocks/repositories.mock';

describe('NodesController', () => {
  let controller: NodesController;

  const mockNodesService = {
    getAncestors: jest.fn(),
    getDescendants: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodesController],
      providers: [{ provide: NodesService, useValue: mockNodesService }],
    }).compile();

    controller = module.get<NodesController>(NodesController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAncestors', () => {
    it('should return ancestors from service', async () => {
      const ancestors = [
        { id: UUIDS.groupId, name: 'Parent', type: NodeType.GROUP, depth: 1 },
        {
          id: UUIDS.parentId,
          name: 'Grandparent',
          type: NodeType.GROUP,
          depth: 2,
        },
      ];

      mockNodesService.getAncestors.mockResolvedValue(ancestors);

      const result = await controller.getAncestors(UUIDS.userId);

      expect(mockNodesService.getAncestors).toHaveBeenCalledWith(UUIDS.userId);
      expect(result).toEqual(ancestors);
    });

    it('should return empty array when no ancestors', async () => {
      mockNodesService.getAncestors.mockResolvedValue([]);

      const result = await controller.getAncestors(UUIDS.userId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when node not found', async () => {
      mockNodesService.getAncestors.mockRejectedValue(
        new NotFoundException('Node not found'),
      );

      await expect(controller.getAncestors(UUIDS.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDescendants', () => {
    it('should return descendants from service', async () => {
      const descendants = [
        { id: UUIDS.groupId, name: 'Child', type: NodeType.GROUP, depth: 1 },
        {
          id: UUIDS.parentId,
          name: 'Grandchild',
          type: NodeType.USER,
          depth: 2,
        },
      ];

      mockNodesService.getDescendants.mockResolvedValue(descendants);

      const result = await controller.getDescendants(UUIDS.userId);

      expect(mockNodesService.getDescendants).toHaveBeenCalledWith(
        UUIDS.userId,
      );
      expect(result).toEqual(descendants);
    });

    it('should return empty array when no descendants', async () => {
      mockNodesService.getDescendants.mockResolvedValue([]);

      const result = await controller.getDescendants(UUIDS.userId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when node not found', async () => {
      mockNodesService.getDescendants.mockRejectedValue(
        new NotFoundException('Node not found'),
      );

      await expect(controller.getDescendants(UUIDS.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
