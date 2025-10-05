import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodeType } from 'src/entities/node.entity';
import { RepositoriesService } from 'src/repositories';
import { UsersService } from './users.service';
import {
  createMockQueryBuilder,
  mockRepositoriesService,
} from 'test/mocks/repositories.mock';
import { UserOrganizationDto } from './dto/user-organization.dto';

type ClosureProps = {
  ancestorId: string;
  descendantId: string;
  depth: number;
};

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'John Doe',
    email: 'john@example.com',
    type: NodeType.USER,
  };

  const mockGroup = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Engineering',
    type: NodeType.GROUP,
  };

  const mockUserAndGroupFound = () => {
    mockRepositoriesService.nodeRepository.findOne
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(mockGroup);
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockRepositoriesService.nodeRepository.findOneBy.mockResolvedValue({
        id: 'existing-uuid',
        email: 'existing@example.com',
      });

      await expect(
        service.create({
          name: 'John Doe',
          email: 'existing@example.com',
        }),
      ).rejects.toThrow(ConflictException);

      expect(
        mockRepositoriesService.nodeRepository.findOneBy,
      ).toHaveBeenCalledWith({ email: 'existing@example.com' });
    });

    it('should create user successfully', async () => {
      mockRepositoriesService.nodeRepository.findOneBy.mockResolvedValue(null);
      mockRepositoriesService.nodeRepository.create.mockReturnValue(mockUser);
      mockRepositoriesService.nodeRepository.save.mockResolvedValue(mockUser);
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      const result = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(
        mockRepositoriesService.nodeRepository.create,
      ).toHaveBeenCalledWith({
        type: NodeType.USER,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith({
        ancestorId: mockUser.id,
        descendantId: mockUser.id,
        depth: 0,
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('addUserToGroup', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addUserToGroup(mockUser.id, { groupId: mockGroup.id }),
      ).rejects.toThrow(NotFoundException);

      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw BadRequestException if node is not a USER', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValueOnce({
        ...mockGroup,
        id: mockUser.id,
      });

      await expect(
        service.addUserToGroup(mockUser.id, { groupId: mockGroup.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if group not found', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      await expect(
        service.addUserToGroup(mockUser.id, { groupId: mockGroup.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if target is not a GROUP', async () => {
      mockRepositoriesService.nodeRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: mockGroup.id });

      await expect(
        service.addUserToGroup(mockUser.id, { groupId: mockGroup.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already belongs to group', async () => {
      mockUserAndGroupFound();

      mockRepositoriesService.closureRepository.findOne.mockResolvedValue({
        ancestorId: mockGroup.id,
        descendantId: mockUser.id,
        depth: 1,
      });

      await expect(
        service.addUserToGroup(mockUser.id, { groupId: mockGroup.id }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnprocessableEntityException if cyclic relationship detected', async () => {
      mockUserAndGroupFound();

      mockRepositoriesService.closureRepository.findOne.mockResolvedValue(null);
      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: mockUser.id, descendantId: mockGroup.id, depth: 1 },
        { ancestorId: mockGroup.id, descendantId: mockGroup.id, depth: 0 },
      ]);

      await expect(
        service.addUserToGroup(mockUser.id, { groupId: mockGroup.id }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should add user to group successfully', async () => {
      mockUserAndGroupFound();

      mockRepositoriesService.closureRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ancestorId: mockUser.id,
          descendantId: mockUser.id,
          depth: 0,
        });

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: mockGroup.id, descendantId: mockGroup.id, depth: 0 },
      ]);

      mockRepositoriesService.closureRepository.create.mockImplementation(
        (data: ClosureProps) => data,
      );
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      await service.addUserToGroup(mockUser.id, { groupId: mockGroup.id });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith([
        { ancestorId: mockGroup.id, descendantId: mockUser.id, depth: 1 },
      ]);
    });

    it('should add user to group with hierarchy', async () => {
      const parentGroupId = '33333333-3333-3333-3333-333333333333';

      mockUserAndGroupFound();

      mockRepositoriesService.closureRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ancestorId: mockUser.id,
          descendantId: mockUser.id,
          depth: 0,
        });

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: parentGroupId, descendantId: mockGroup.id, depth: 1 },
        { ancestorId: mockGroup.id, descendantId: mockGroup.id, depth: 0 },
      ]);

      mockRepositoriesService.closureRepository.create.mockImplementation(
        (data: ClosureProps) => data,
      );
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      await service.addUserToGroup(mockUser.id, { groupId: mockGroup.id });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith([
        { ancestorId: parentGroupId, descendantId: mockUser.id, depth: 2 },
        { ancestorId: mockGroup.id, descendantId: mockUser.id, depth: 1 },
      ]);
    });

    it('should create user self-reference if not exists', async () => {
      mockUserAndGroupFound();

      mockRepositoriesService.closureRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockRepositoriesService.closureRepository.find.mockResolvedValue([
        { ancestorId: mockGroup.id, descendantId: mockGroup.id, depth: 0 },
      ]);

      mockRepositoriesService.closureRepository.create.mockImplementation(
        (data: ClosureProps) => data,
      );
      mockRepositoriesService.closureRepository.save.mockResolvedValue({});

      await service.addUserToGroup(mockUser.id, { groupId: mockGroup.id });

      expect(
        mockRepositoriesService.closureRepository.save,
      ).toHaveBeenCalledWith([
        { ancestorId: mockGroup.id, descendantId: mockUser.id, depth: 1 },
        { ancestorId: mockUser.id, descendantId: mockUser.id, depth: 0 },
      ]);
    });
  });

  describe('getUserOrganizations', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserOrganizations(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockRepositoriesService.nodeRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw BadRequestException if node is not a USER', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
        mockGroup,
      );

      await expect(service.getUserOrganizations(mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty array if user has no organizations', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
        mockUser,
      );

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getUserOrganizations(mockUser.id);

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    });

    it('should return user organizations ordered by depth', async () => {
      const organizations: UserOrganizationDto[] = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Engineering',
          depth: 1,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Tech Department',
          depth: 2,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Company',
          depth: 3,
        },
      ];

      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
        mockUser,
      );

      const mockQueryBuilder = createMockQueryBuilder(organizations);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getUserOrganizations(mockUser.id);

      expect(result).toEqual(organizations);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'closure.descendant_id = :userId',
        { userId: mockUser.id },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'node.type = :type',
        {
          type: NodeType.GROUP,
        },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'closure.depth',
        'ASC',
      );
    });

    it('should filter only GROUP type nodes', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
        mockUser,
      );

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.getUserOrganizations(mockUser.id);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'node.type = :type',
        {
          type: NodeType.GROUP,
        },
      );
    });

    it('should only return ancestors with depth >= 1', async () => {
      mockRepositoriesService.nodeRepository.findOne.mockResolvedValue(
        mockUser,
      );

      const mockQueryBuilder = createMockQueryBuilder([]);
      mockRepositoriesService.closureRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.getUserOrganizations(mockUser.id);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'closure.depth >= 1',
      );
    });
  });
});
