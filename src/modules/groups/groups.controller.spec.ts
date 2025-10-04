import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { NotFoundException } from '@nestjs/common';

describe('GroupsService', () => {
  let service: GroupsService;

  const mockRepositoriesService = {
    nodeRepository: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
    closureRepository: {
      save: jest.fn(),
      find: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if parent not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'New Group',
          parentId: 'non-existing-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create group without parent', async () => {
      const fakeUuid = '11111111-1111-1111-1111-111111111111';

      mockRepositoriesService.nodeRepository.create.mockReturnValue({
        id: fakeUuid,
        name: 'My Group',
        type: NodeType.GROUP,
      });
      mockRepositoriesService.nodeRepository.save.mockResolvedValue({
        id: fakeUuid,
        name: 'My Group',
        type: NodeType.GROUP,
      });
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      const result = await service.create({ name: 'My Group' });

      expect(
        mockRepositoriesService.nodeRepository.create,
      ).toHaveBeenCalledWith({
        name: 'My Group',
        type: NodeType.GROUP,
      });
      expect(result).toEqual({
        id: fakeUuid,
        name: 'My Group',
        type: NodeType.GROUP,
        parentId: null,
      });
    });

    it('should create group with parent', async () => {
      const parentUuid = '22222222-2222-2222-2222-222222222222';
      const childUuid = '33333333-3333-3333-3333-333333333333';

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue({
        id: parentUuid,
        name: 'Parent Group',
        type: NodeType.GROUP,
      });

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: parentUuid, descendantId: parentUuid, depth: 0 },
      ]);

      mockRepositoriesService.nodeRepository.create.mockReturnValue({
        id: childUuid,
        name: 'Child Group',
        type: NodeType.GROUP,
      });
      mockRepositoriesService.nodeRepository.save.mockResolvedValue({
        id: childUuid,
        name: 'Child Group',
        type: NodeType.GROUP,
      });
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      const result = await service.create({
        name: 'Child Group',
        parentId: parentUuid,
      });

      expect(
        mockRepositoriesService.closureRepository.find,
      ).toHaveBeenCalledWith({ where: { descendantId: parentUuid } });

      expect(result).toEqual({
        id: childUuid,
        name: 'Child Group',
        type: NodeType.GROUP,
        parentId: parentUuid,
      });
    });
  });
});
