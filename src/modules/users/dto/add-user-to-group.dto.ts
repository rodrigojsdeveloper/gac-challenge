import { IsUUID } from 'class-validator';

export class AddUserToGroupDto {
  @IsUUID()
  groupId: string;
}
