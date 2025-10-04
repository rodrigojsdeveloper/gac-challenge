import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NodesService } from './nodes.service';
import { NodesDto } from './dto/nodes.dto';

@ApiTags('nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Get node ancestors' })
  @ApiParam({ name: 'id', description: 'Node ID' })
  @ApiResponse({
    status: 200,
    description: 'List of ancestor nodes ordered by depth',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (uuid is expected)',
  })
  @ApiResponse({ status: 404, description: 'Node not found' })
  getAncestors(@Param('id', ParseUUIDPipe) id: string): Promise<NodesDto[]> {
    return this.nodesService.getAncestors(id);
  }

  @Get(':id/descendants')
  @ApiOperation({ summary: 'Get node descendants' })
  @ApiParam({ name: 'id', description: 'Node ID' })
  @ApiResponse({
    status: 200,
    description: 'List of descendant nodes ordered by depth',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (uuid is expected)',
  })
  @ApiResponse({ status: 404, description: 'Node not found' })
  getDescendants(@Param('id', ParseUUIDPipe) id: string): Promise<NodesDto[]> {
    return this.nodesService.getDescendants(id);
  }
}
