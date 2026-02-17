import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePetDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsInt()
	@IsOptional()
	background?: number;

	@IsString()
	@IsOptional()
	action?: string;
}
