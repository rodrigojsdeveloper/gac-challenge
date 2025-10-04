import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
