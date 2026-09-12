import { IsArray, IsNotEmpty } from 'class-validator';

export class BulkActionDto {
  @IsArray()
  @IsNotEmpty()
  ids: (string | number)[];
}
