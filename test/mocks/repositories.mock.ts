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
