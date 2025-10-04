import { ApiProperty } from '@nestjs/swagger';
import { NodeType } from 'src/entities/node.entity';

export class NodesDto {
  @ApiProperty({
    description: 'Node ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Node name',
    example: 'Engineering',
  })
  name: string;

  @ApiProperty({
    description: 'Node type',
    example: NodeType.GROUP,
  })
  type: string;

  @ApiProperty({
    description: 'Depth relative to target node',
    example: 2,
    minimum: 1,
  })
  depth: number;
}
