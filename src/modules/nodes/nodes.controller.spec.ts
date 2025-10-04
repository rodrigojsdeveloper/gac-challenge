import { Test, TestingModule } from '@nestjs/testing';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';

describe('NodesController', () => {
  let controller: NodesController;

  const mockNodesService = {
    getAncestors: jest.fn(),
    getDescendants: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodesController],
      providers: [{ provide: NodesService, useValue: mockNodesService }],
    }).compile();

    controller = module.get<NodesController>(NodesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
