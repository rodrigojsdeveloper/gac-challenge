import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post(':id/groups')
  @HttpCode(204)
  @ApiOperation({ summary: 'Associate user to group' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AddUserToGroupDto })
  @ApiResponse({
    status: 204,
    description: 'User successfully joined group.',
  })
  @ApiResponse({ status: 400, description: 'Node is not a USER or GROUP.' })
  @ApiResponse({ status: 404, description: 'User or Group not found.' })
  @ApiResponse({ status: 409, description: 'User already belongs to group.' })
  @ApiResponse({ status: 422, description: 'Cyclic relationship detected.' })
  addUserToGroup(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddUserToGroupDto,
  ) {
    return this.usersService.addUserToGroup(id, dto);
  }

  @Get(':id/organizations')
  @ApiOperation({ summary: 'List user organizations' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of groups ordered by depth.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          depth: { type: 'integer', minimum: 1 },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Node is not a USER.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  getUserOrganizations(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.usersService.getUserOrganizations(id);
  }
}
