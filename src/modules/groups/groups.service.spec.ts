import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { GroupsService } from './groups.service';
import { mockRepositoriesService } from 'test/mocks/repositories.mock';

describe('GroupsService', () => {
  let service: GroupsService;

  const UUIDS = {
    group: '11111111-1111-1111-1111-111111111111',
    parent: '22222222-2222-2222-2222-222222222222',
    child: '33333333-3333-3333-3333-333333333333',
  };

  const createMockNode = (id: string, name: string) => ({
    id,
    name,
    type: NodeType.GROUP,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
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
      const group = createMockNode(UUIDS.group, 'My Group');

      mockRepositoriesService.nodeRepository.create.mockReturnValue(group);
      mockRepositoriesService.nodeRepository.save.mockResolvedValue(group);
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      const result = await service.create({ name: group.name });

      expect(
        mockRepositoriesService.nodeRepository.create,
      ).toHaveBeenCalledWith({
        name: group.name,
        type: NodeType.GROUP,
      });
      expect(result).toEqual({ ...group, parentId: null });
    });

    it('should create group with parent', async () => {
      const parent = createMockNode(UUIDS.parent, 'Parent Group');
      const child = createMockNode(UUIDS.child, 'Child Group');

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(parent);
      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: parent.id, descendantId: parent.id, depth: 0 },
      ]);
      mockRepositoriesService.nodeRepository.create.mockReturnValue(child);
      mockRepositoriesService.nodeRepository.save.mockResolvedValue(child);
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      const result = await service.create({
        name: child.name,
        parentId: parent.id,
      });

      expect(
        mockRepositoriesService.closureRepository.find,
      ).toHaveBeenCalledWith({
        where: { descendantId: parent.id },
      });
      expect(result).toEqual({ ...child, parentId: parent.id });
    });
  });
});
