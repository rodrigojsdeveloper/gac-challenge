import { Test, TestingModule } from '@nestjs/testing';
import { NodesService } from './nodes.service';
import { RepositoriesService } from 'src/repositories';

describe('NodesController', () => {
  let service: NodesService;

  const mockRepositoriesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodesService,
        { provide: RepositoriesService, useValue: mockRepositoriesService },
      ],
    }).compile();

    service = module.get<NodesService>(NodesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
