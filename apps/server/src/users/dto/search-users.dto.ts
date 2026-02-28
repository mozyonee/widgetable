import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchUsersDto {
	@IsString()
	@IsNotEmpty()
	@Transform(({ value }: { value: string }) => value?.trim())
	query: string;
}
