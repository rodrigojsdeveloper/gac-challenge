import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RepositoriesService } from 'src/repositories';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepositoriesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
