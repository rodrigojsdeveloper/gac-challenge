import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

describe('GroupsController', () => {
  let controller: GroupsController;

  const mockGroupsService = {
    create: jest.fn(),
  };

  const UUIDS = {
    root: '11111111-1111-1111-1111-111111111111',
    parent: '22222222-2222-2222-2222-222222222222',
    child: '33333333-3333-3333-3333-333333333333',
  };

  const createExpectedGroup = (
    id: string,
    name: string,
    parentId?: string,
  ) => ({
    id,
    name,
    type: NodeType.GROUP,
    parentId,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: mockGroupsService }],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const testCases = [
      { name: 'Root Group', id: UUIDS.root },
      { name: 'Child Group', id: UUIDS.child, parentId: UUIDS.parent },
      { name: 'No Parent Group', id: UUIDS.root },
      { name: 'Child With Parent', id: UUIDS.child, parentId: UUIDS.parent },
      { name: 'Group with @#$% special chars!', id: UUIDS.root },
      { name: 'Long Group Name', id: UUIDS.root, longName: true },
    ];

    for (const testCase of testCases) {
      it(`should create group: "${testCase.name}"`, async () => {
        const groupName = testCase.longName ? 'A'.repeat(255) : testCase.name;
        const createDto = { name: groupName, parentId: testCase.parentId };
        const expectedGroup = createExpectedGroup(
          testCase.id,
          groupName,
          testCase.parentId,
        );

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(createDto);

        expect(mockGroupsService.create).toHaveBeenCalledWith(createDto);
        expect(result).toEqual(expectedGroup);
      });
    }

    it('should throw NotFoundException when parent not found', async () => {
      const createDto = { name: 'Orphan Group', parentId: 'non-existing-id' };

      mockGroupsService.create.mockRejectedValue(
        new NotFoundException('Parent group not found'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockGroupsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle unexpected service errors', async () => {
      const createDto = { name: 'Error Group' };
      const unexpectedError = new Error('Database failure');

      mockGroupsService.create.mockRejectedValue(unexpectedError);

      await expect(controller.create(createDto)).rejects.toThrow(
        'Database failure',
      );
    });

    it('should handle concurrent create requests', async () => {
      const createDto1 = { name: 'Concurrent 1' };
      const createDto2 = { name: 'Concurrent 2' };

      mockGroupsService.create
        .mockResolvedValueOnce(createExpectedGroup(UUIDS.root, 'Concurrent 1'))
        .mockResolvedValueOnce(
          createExpectedGroup(UUIDS.child, 'Concurrent 2'),
        );

      const [result1, result2] = await Promise.all([
        controller.create(createDto1),
        controller.create(createDto2),
      ]);

      expect(result1.name).toBe('Concurrent 1');
      expect(result2.name).toBe('Concurrent 2');
      expect(mockGroupsService.create).toHaveBeenCalledTimes(2);
    });
  });
});
