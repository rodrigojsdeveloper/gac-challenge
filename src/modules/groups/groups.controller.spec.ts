import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupNodeDto } from './dto/group-node.dto';
import { UUIDS } from 'test/mocks/repositories.mock';

describe('GroupsController', () => {
  let controller: GroupsController;

  const mockGroupsService = {
    create: jest.fn(),
  };

  const createMockGroup = (
    id: string,
    name: string,
    parentId: string | null = null,
  ): GroupNodeDto => ({
    id,
    name,
    type: NodeType.GROUP,
    parentId,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: mockGroupsService }],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('successful creation', () => {
      it('should create a root group without parentId', async () => {
        const dto: CreateGroupDto = { name: 'Root Group' };
        const expectedGroup = createMockGroup(UUIDS.userId, 'Root Group', null);

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(mockGroupsService.create).toHaveBeenCalledTimes(1);
        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(expectedGroup);
        expect(result.parentId).toBeNull();
      });

      it('should create a child group with parentId', async () => {
        const dto: CreateGroupDto = {
          name: 'Child Group',
          parentId: UUIDS.groupId,
        };
        const expectedGroup = createMockGroup(
          UUIDS.parentId,
          'Child Group',
          UUIDS.groupId,
        );

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(mockGroupsService.create).toHaveBeenCalledTimes(1);
        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(expectedGroup);
        expect(result.parentId).toBe(UUIDS.groupId);
      });

      it('should return group with correct structure', async () => {
        const dto: CreateGroupDto = { name: 'Test Group' };
        const expectedGroup = createMockGroup(UUIDS.userId, 'Test Group');

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('parentId');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
        expect(result.type).toBe(NodeType.GROUP);
      });

      it('should handle groups with special characters in name', async () => {
        const dto: CreateGroupDto = {
          name: 'Group with "quotes" & special chars: @#$%',
        };
        const expectedGroup = createMockGroup(UUIDS.userId, dto.name);

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
        expect(result.name).toBe(dto.name);
      });

      it('should handle very long group names', async () => {
        const longName = 'A'.repeat(255);
        const dto: CreateGroupDto = { name: longName };
        const expectedGroup = createMockGroup(UUIDS.userId, longName);

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
        expect(result.name).toBe(longName);
      });
    });

    describe('error handling', () => {
      it('should throw NotFoundException when parent does not exist', async () => {
        const dto: CreateGroupDto = {
          name: 'Orphan Group',
          parentId: 'non-existing-uuid',
        };

        mockGroupsService.create.mockRejectedValue(
          new NotFoundException('Parent group not found'),
        );

        await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
        await expect(controller.create(dto)).rejects.toThrow(
          'Parent group not found',
        );
        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
      });

      it('should throw NotFoundException when parentId is not a valid GROUP', async () => {
        const dto: CreateGroupDto = {
          name: 'Invalid Parent Group',
          parentId: UUIDS.groupId,
        };

        mockGroupsService.create.mockRejectedValue(
          new NotFoundException('Parent group not found'),
        );

        await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
      });

      it('should propagate database errors from service', async () => {
        const dto: CreateGroupDto = { name: 'Error Group' };
        const dbError = new Error('Database connection failed');

        mockGroupsService.create.mockRejectedValue(dbError);

        await expect(controller.create(dto)).rejects.toThrow(
          'Database connection failed',
        );
        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
      });

      it('should propagate generic errors from service', async () => {
        const dto: CreateGroupDto = { name: 'Generic Error' };
        const genericError = new Error('Something went wrong');

        mockGroupsService.create.mockRejectedValue(genericError);

        await expect(controller.create(dto)).rejects.toThrow(
          'Something went wrong',
        );
        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
      });
    });

    describe('service delegation', () => {
      it('should pass DTO directly to service without modification', async () => {
        const dto: CreateGroupDto = {
          name: 'Test Group',
          parentId: UUIDS.groupId,
        };
        const expectedGroup = createMockGroup(
          UUIDS.parentId,
          'Test Group',
          UUIDS.groupId,
        );

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        await controller.create(dto);

        expect(mockGroupsService.create).toHaveBeenCalledWith(dto);
        expect(mockGroupsService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: dto.name,
            parentId: dto.parentId,
          }),
        );
      });

      it('should call service exactly once per request', async () => {
        const dto: CreateGroupDto = { name: 'Single Call Test' };
        const expectedGroup = createMockGroup(UUIDS.userId, dto.name);

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        await controller.create(dto);

        expect(mockGroupsService.create).toHaveBeenCalledTimes(1);
      });

      it('should return the exact response from service', async () => {
        const dto: CreateGroupDto = { name: 'Exact Response' };
        const serviceResponse = createMockGroup(UUIDS.userId, dto.name);

        mockGroupsService.create.mockResolvedValue(serviceResponse);

        const controllerResponse = await controller.create(dto);

        expect(controllerResponse).toBe(serviceResponse);
        expect(controllerResponse).toStrictEqual(serviceResponse);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string name if DTO validation allows', async () => {
        const dto: CreateGroupDto = { name: '' };
        const expectedGroup = createMockGroup(UUIDS.userId, '');

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(result.name).toBe('');
      });

      it('should handle whitespace-only names if DTO validation allows', async () => {
        const dto: CreateGroupDto = { name: '   ' };
        const expectedGroup = createMockGroup(UUIDS.userId, '   ');

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(result.name).toBe('   ');
      });

      it('should handle undefined parentId as null', async () => {
        const dto: CreateGroupDto = { name: 'No Parent' };
        const expectedGroup = createMockGroup(UUIDS.userId, 'No Parent', null);

        mockGroupsService.create.mockResolvedValue(expectedGroup);

        const result = await controller.create(dto);

        expect(result.parentId).toBeNull();
        expect(mockGroupsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'No Parent' }),
        );
      });
    });
  });
});
