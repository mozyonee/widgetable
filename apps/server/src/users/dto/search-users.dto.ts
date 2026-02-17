import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchUsersDto {
	@IsString()
	@IsNotEmpty()
	@Transform(({ value }) => value?.trim())
	query: string;
}
