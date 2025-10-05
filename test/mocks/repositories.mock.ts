import { UserOrganizationDto } from 'src/modules/users/dto/user-organization.dto';

export const mockRepositoriesService = {
  nodeRepository: {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  },
  closureRepository: {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
};

export const createMockQueryBuilder = (
  results: UserOrganizationDto[] = [],
) => ({
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(results),
});

export const UUIDS = {
  userId: '11111111-1111-1111-1111-111111111111',
  groupId: '22222222-2222-2222-2222-222222222222',
  parentId: '33333333-3333-3333-3333-333333333333',
  rootId: '44444444-4444-4444-4444-444444444444',
};
