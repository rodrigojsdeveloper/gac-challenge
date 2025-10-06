import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { GroupsService } from './groups.service';
import { MetricsModule } from '../metrics/metrics.module';
import { mockRepositoriesService, UUIDS } from 'test/mocks/repositories.mock';

describe('GroupsService', () => {
  let service: GroupsService;

  const createMockNode = (id: string, name: string, type = NodeType.GROUP) => ({
    id,
    name,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MetricsModule],
      providers: [
        GroupsService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('validation', () => {
      it('should throw NotFoundException when parent does not exist', async () => {
        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

        await expect(
          service.create({
            name: 'New Group',
            parentId: 'non-existing-uuid',
          }),
        ).rejects.toThrow(NotFoundException);
        expect(
          mockRepositoriesService.nodeRepository.findOne,
        ).toHaveBeenCalledWith({
          where: { id: 'non-existing-uuid', type: NodeType.GROUP },
        });
      });

      it('should throw NotFoundException when parent exists but is not a GROUP', async () => {
        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

        await expect(
          service.create({
            name: 'New Group',
            parentId: UUIDS.groupId,
          }),
        ).rejects.toThrow(NotFoundException);

        expect(
          mockRepositoriesService.nodeRepository.findOne,
        ).toHaveBeenCalledWith({
          where: { id: UUIDS.groupId, type: NodeType.GROUP },
        });
      });
    });

    describe('group without parent (root group)', () => {
      it('should create root group successfully', async () => {
        const group = createMockNode(UUIDS.userId, 'Root Group');

        mockRepositoriesService.nodeRepository.create.mockReturnValue(group);
        mockRepositoriesService.nodeRepository.save.mockResolvedValue(group);
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        const result = await service.create({ name: 'Root Group' });

        expect(
          mockRepositoriesService.nodeRepository.create,
        ).toHaveBeenCalledWith({
          type: NodeType.GROUP,
          name: 'Root Group',
        });
        expect(
          mockRepositoriesService.nodeRepository.save,
        ).toHaveBeenCalledWith(group);
        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledWith({
          ancestorId: group.id,
          descendantId: group.id,
          depth: 0,
        });
        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          ...group,
          type: NodeType.GROUP,
          parentId: null,
        });
      });

      it('should not call findOne when parentId is undefined', async () => {
        const group = createMockNode(UUIDS.userId, 'Root Group');

        mockRepositoriesService.nodeRepository.create.mockReturnValue(group);
        mockRepositoriesService.nodeRepository.save.mockResolvedValue(group);
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.create({ name: 'Root Group' });

        expect(
          mockRepositoriesService.nodeRepository.findOne,
        ).not.toHaveBeenCalled();
      });
    });

    describe('group with parent', () => {
      it('should create child group with direct parent successfully', async () => {
        const parent = createMockNode(UUIDS.groupId, 'Parent Group');
        const child = createMockNode(UUIDS.rootId, 'Child Group');

        const parentClosures = [
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ];

        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
          parent,
        );
        mockRepositoriesService.nodeRepository.create.mockReturnValue(child);
        mockRepositoriesService.nodeRepository.save.mockResolvedValue(child);
        mockRepositoriesService.closureRepository.find.mockResolvedValue(
          parentClosures,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        const result = await service.create({
          name: 'Child Group',
          parentId: UUIDS.groupId,
        });

        expect(
          mockRepositoriesService.nodeRepository.findOne,
        ).toHaveBeenCalledWith({
          where: { id: UUIDS.groupId, type: NodeType.GROUP },
        });
        expect(
          mockRepositoriesService.nodeRepository.create,
        ).toHaveBeenCalledWith({
          type: NodeType.GROUP,
          name: 'Child Group',
        });
        expect(
          mockRepositoriesService.closureRepository.find,
        ).toHaveBeenCalledWith({
          where: { descendantId: UUIDS.groupId },
        });
        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenCalledTimes(2);
        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenNthCalledWith(1, {
          ancestorId: child.id,
          descendantId: child.id,
          depth: 0,
        });
        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenNthCalledWith(2, [
          {
            ancestorId: UUIDS.groupId,
            descendantId: child.id,
            depth: 1,
          },
        ]);
        expect(result).toEqual({
          ...child,
          type: NodeType.GROUP,
          parentId: UUIDS.groupId,
        });
      });

      it('should create child group inheriting all ancestor relationships', async () => {
        const parent = createMockNode(UUIDS.groupId, 'Parent');
        const child = createMockNode(UUIDS.rootId, 'Child');

        const parentClosures = [
          {
            ancestorId: UUIDS.parentId,
            descendantId: UUIDS.groupId,
            depth: 1,
          },
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ];

        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
          parent,
        );
        mockRepositoriesService.nodeRepository.create.mockReturnValue(child);
        mockRepositoriesService.nodeRepository.save.mockResolvedValue(child);
        mockRepositoriesService.closureRepository.find.mockResolvedValue(
          parentClosures,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.create({
          name: 'Child',
          parentId: UUIDS.groupId,
        });

        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenNthCalledWith(2, [
          {
            ancestorId: UUIDS.parentId,
            descendantId: child.id,
            depth: 2,
          },
          {
            ancestorId: UUIDS.groupId,
            descendantId: child.id,
            depth: 1,
          },
        ]);
      });

      it('should preserve closure depth calculation correctly', async () => {
        const parent = createMockNode(UUIDS.groupId, 'Parent');
        const child = createMockNode(UUIDS.rootId, 'Child');

        const parentClosures = [
          { ancestorId: 'root-id', descendantId: UUIDS.groupId, depth: 5 },
          { ancestorId: UUIDS.groupId, descendantId: UUIDS.groupId, depth: 0 },
        ];

        mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
          parent,
        );
        mockRepositoriesService.nodeRepository.create.mockReturnValue(child);
        mockRepositoriesService.nodeRepository.save.mockResolvedValue(child);
        mockRepositoriesService.closureRepository.find.mockResolvedValue(
          parentClosures,
        );
        mockRepositoriesService.closureRepository.save.mockResolvedValue({});

        await service.create({
          name: 'Child',
          parentId: UUIDS.groupId,
        });

        expect(
          mockRepositoriesService.closureRepository.save,
        ).toHaveBeenNthCalledWith(2, [
          {
            ancestorId: 'root-id',
            descendantId: child.id,
            depth: 6,
          },
          {
            ancestorId: UUIDS.groupId,
            descendantId: child.id,
            depth: 1,
          },
        ]);
      });
    });

    describe('error handling', () => {
      it('should propagate database errors on node save', async () => {
        const group = createMockNode(UUIDS.userId, 'Group');
        const dbError = new Error('Database connection failed');

        mockRepositoriesService.nodeRepository.create.mockReturnValue(group);
        mockRepositoriesService.nodeRepository.save.mockRejectedValue(dbError);

        await expect(service.create({ name: 'Group' })).rejects.toThrow(
          dbError,
        );
      });

      it('should propagate database errors on closure save', async () => {
        const group = createMockNode(UUIDS.userId, 'Group');
        const dbError = new Error('Closure table error');

        mockRepositoriesService.nodeRepository.create.mockReturnValue(group);
        mockRepositoriesService.nodeRepository.save.mockResolvedValue(group);
        mockRepositoriesService.closureRepository.save.mockRejectedValue(
          dbError,
        );

        await expect(service.create({ name: 'Group' })).rejects.toThrow(
          dbError,
        );
      });
    });
  });
});
