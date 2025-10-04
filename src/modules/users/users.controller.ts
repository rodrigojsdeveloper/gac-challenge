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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post(':id/groups')
  @HttpCode(204)
  addUserToGroup(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddUserToGroupDto,
  ) {
    return this.usersService.addUserToGroup(id, dto);
  }

  @Get(':id/organizations')
  getUserOrganizations(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.usersService.getUserOrganizations(id);
  }
}
