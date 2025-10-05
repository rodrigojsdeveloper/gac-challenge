import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { NodesService } from './nodes.service';
import {
  createMockQueryBuilder,
  mockRepositoriesService,
} from 'test/mocks/repositories.mock';

describe('NodesService', () => {
  let service: NodesService;

  const UUIDS = {
    node: '11111111-1111-1111-1111-111111111111',
    a1: '22222222-2222-2222-2222-222222222222',
    a2: '33333333-3333-3333-3333-333333333333',
    a3: '44444444-4444-4444-4444-444444444444',
  };

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
    jest.resetAllMocks();
  });

  describe('getAncestors', () => {
    it('should throw NotFoundException if node not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getAncestors(UUIDS.node)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array if node has no ancestors', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: UUIDS.node,
        name: 'Root Node',
        type: NodeType.GROUP,
      });

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(UUIDS.node);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.descendant_id = :nodeId',
        { nodeId: UUIDS.node },
      );
    });

    it('should return ancestors ordered by depth', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: UUIDS.node,
        name: 'Child Node',
        type: NodeType.USER,
      });

      const ancestors = [
        { id: UUIDS.a1, name: 'Parent', type: NodeType.GROUP, depth: 1 },
        { id: UUIDS.a2, name: 'Grandparent', type: NodeType.GROUP, depth: 2 },
        { id: UUIDS.a3, name: 'Root', type: NodeType.GROUP, depth: 3 },
      ];

      const mockQueryBuilder = createMockQueryBuilder(ancestors);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAncestors(UUIDS.node);
      expect(result).toEqual(ancestors);
    });
  });

  describe('getDescendants', () => {
    it('should throw NotFoundException if node not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);
      await expect(service.getDescendants(UUIDS.node)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array if node has no descendants', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: UUIDS.node,
        name: 'Leaf Node',
        type: NodeType.USER,
      });

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(UUIDS.node);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.ancestor_id = :nodeId',
        { nodeId: UUIDS.node },
      );
    });

    it('should return descendants ordered by depth', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: UUIDS.node,
        name: 'Root',
        type: NodeType.GROUP,
      });

      const descendants = [
        { id: UUIDS.a1, name: 'Child', type: NodeType.GROUP, depth: 1 },
        { id: UUIDS.a2, name: 'Grandchild', type: NodeType.GROUP, depth: 2 },
        { id: UUIDS.a3, name: 'User', type: NodeType.USER, depth: 3 },
      ];

      const mockQueryBuilder = createMockQueryBuilder(descendants);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getDescendants(UUIDS.node);
      expect(result).toEqual(descendants);
    });
  });
});
