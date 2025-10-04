import { ApiProperty } from '@nestjs/swagger';

export class UserOrganizationDto {
  @ApiProperty({
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Group name',
    example: 'Engineering',
  })
  name: string;

  @ApiProperty({
    description: 'Depth from user to group',
    example: 1,
    minimum: 1,
  })
  depth: number;
}
