import { IsNotEmpty, IsString } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
