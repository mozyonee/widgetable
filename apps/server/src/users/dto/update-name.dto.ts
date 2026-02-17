import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateNameDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	@Transform(({ value }) => value?.trim())
	name: string;
}
