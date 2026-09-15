import { IsArray, IsOptional } from 'class-validator';

export class BulkActionDto {
  @IsArray()
  @IsOptional()
  ids?: (string | number)[];

  @IsArray()
  @IsOptional()
  userIds?: (string | number)[];

  @IsArray()
  @IsOptional()
  invitationIds?: (string | number)[];
}

