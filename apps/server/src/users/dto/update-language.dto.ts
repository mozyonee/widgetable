import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLanguageDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(10)
	@Transform(({ value }) => value?.trim())
	language: string;
}
