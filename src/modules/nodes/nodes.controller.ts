import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { NodesService } from './nodes.service';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get(':id/ancestors')
  getAncestors(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.nodesService.getAncestors(id);
  }

  @Get(':id/descendants')
  getDescendants(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.nodesService.getDescendants(id);
  }
}
