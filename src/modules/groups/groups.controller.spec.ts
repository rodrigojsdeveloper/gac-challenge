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
    parent: '22222222-2222-2222-2222-222222222222',
    child: '33333333-3333-3333-3333-333333333333',
  };

  const groupMock = {
    id: UUIDS.child,
    name: 'Test Group',
    type: NodeType.GROUP,
    parentId: null,
  };

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
    it('should call service.create and return the created group', async () => {
      mockGroupsService.create.mockResolvedValue(groupMock);

      const dto = { name: 'Test Group' };
      const result = await controller.create(dto);

      expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(groupMock);
    });

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

    it('should propagate unexpected errors', async () => {
      const dto = { name: 'Error Group' };
      const error = new Error('Database failure');
      mockGroupsService.create.mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow('Database failure');
    });
  });
});
