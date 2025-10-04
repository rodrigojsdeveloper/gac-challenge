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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: mockGroupsService }],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a root group successfully', async () => {
      const createDto = { name: 'Root Group' };
      const expectedGroup = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Root Group',
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(mockGroupsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedGroup);
    });

    it('should create a child group successfully', async () => {
      const parentId = '22222222-2222-2222-2222-222222222222';
      const createDto = {
        name: 'Child Group',
        parentId,
      };
      const expectedGroup = {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Child Group',
        type: NodeType.GROUP,
        parentId,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(mockGroupsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedGroup);
    });

    it('should throw NotFoundException when parent not found', async () => {
      const createDto = {
        name: 'Orphan Group',
        parentId: '99999999-9999-9999-9999-999999999999',
      };

      mockGroupsService.create.mockRejectedValue(
        new NotFoundException('Parent group not found'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockGroupsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should pass correct DTO to service', async () => {
      const createDto = {
        name: 'Test Group',
        parentId: '11111111-1111-1111-1111-111111111111',
      };

      mockGroupsService.create.mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Test Group',
        type: NodeType.GROUP,
        parentId: '11111111-1111-1111-1111-111111111111',
      });

      await controller.create(createDto);

      expect(mockGroupsService.create).toHaveBeenCalledWith(createDto);
      expect(mockGroupsService.create).toHaveBeenCalledTimes(1);
    });

    it('should call service only once', async () => {
      const createDto = { name: 'Single Call Group' };

      mockGroupsService.create.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Single Call Group',
        type: NodeType.GROUP,
        parentId: null,
      });

      await controller.create(createDto);

      expect(mockGroupsService.create).toHaveBeenCalledTimes(1);
    });

    it('should return group with correct type', async () => {
      const createDto = { name: 'Type Test Group' };
      const expectedGroup = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Type Test Group',
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(result.type).toBe(NodeType.GROUP);
      expect(String(result.type)).toBe(String(NodeType.GROUP));
    });

    it('should create group with null parentId when not provided', async () => {
      const createDto = { name: 'No Parent Group' };
      const expectedGroup = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'No Parent Group',
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(result.parentId).toBeNull();
    });

    it('should create group with parentId when provided', async () => {
      const parentId = '22222222-2222-2222-2222-222222222222';
      const createDto = {
        name: 'Child With Parent',
        parentId,
      };
      const expectedGroup = {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Child With Parent',
        type: NodeType.GROUP,
        parentId,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(result.parentId).toBe(parentId);
    });

    it('should handle group names with special characters', async () => {
      const createDto = { name: 'Group with @#$% special chars!' };
      const expectedGroup = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Group with @#$% special chars!',
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(result.name).toBe('Group with @#$% special chars!');
    });

    it('should handle long group names', async () => {
      const longName = 'A'.repeat(255);
      const createDto = { name: longName };
      const expectedGroup = {
        id: '11111111-1111-1111-1111-111111111111',
        name: longName,
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(result.name).toBe(longName);
      expect(result.name.length).toBe(255);
    });

    it('should create multiple groups sequentially', async () => {
      const groups = [
        { name: 'Group 1' },
        { name: 'Group 2' },
        { name: 'Group 3' },
      ];

      for (let i = 0; i < groups.length; i++) {
        const expectedGroup = {
          id: `${i}${i}${i}${i}${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}`,
          name: groups[i].name,
          type: NodeType.GROUP,
          parentId: null,
        };

        mockGroupsService.create.mockResolvedValueOnce(expectedGroup);

        const result = await controller.create(groups[i]);

        expect(result.name).toBe(groups[i].name);
      }

      expect(mockGroupsService.create).toHaveBeenCalledTimes(3);
    });

    it('should handle creating nested hierarchy', async () => {
      const parentId = '11111111-1111-1111-1111-111111111111';
      const createDto = {
        name: 'Deep Child',
        parentId,
      };
      const expectedGroup = {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Deep Child',
        type: NodeType.GROUP,
        parentId,
      };

      mockGroupsService.create.mockResolvedValue(expectedGroup);

      const result = await controller.create(createDto);

      expect(result.parentId).toBe(parentId);
      expect(mockGroupsService.create).toHaveBeenCalledWith({
        name: 'Deep Child',
        parentId,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle service throwing unexpected errors', async () => {
      const createDto = { name: 'Error Group' };
      const unexpectedError = new Error('Database connection failed');

      mockGroupsService.create.mockRejectedValue(unexpectedError);

      await expect(controller.create(createDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should not modify service response', async () => {
      const createDto = { name: 'Immutable Group' };
      const serviceResponse = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Immutable Group',
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(serviceResponse);

      const result = await controller.create(createDto);

      expect(result).toBe(serviceResponse);
    });

    it('should handle service returning null parentId', async () => {
      const createDto = { name: 'Undefined Parent Group' };
      const serviceResponse = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Undefined Parent Group',
        type: NodeType.GROUP,
        parentId: null,
      };

      mockGroupsService.create.mockResolvedValue(serviceResponse);

      const result = await controller.create(createDto);

      expect(result.parentId).toBeNull();
    });

    it('should handle concurrent create requests', async () => {
      const createDto1 = { name: 'Concurrent 1' };
      const createDto2 = { name: 'Concurrent 2' };

      mockGroupsService.create
        .mockResolvedValueOnce({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Concurrent 1',
          type: NodeType.GROUP,
          parentId: null,
        })
        .mockResolvedValueOnce({
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Concurrent 2',
          type: NodeType.GROUP,
          parentId: null,
        });

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
