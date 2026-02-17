import { IsOptional, IsString } from 'class-validator';

export class UpdatePetDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	actionName?: string;
}
