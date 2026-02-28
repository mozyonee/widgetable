import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddInventoryDto {
	@IsString()
	@IsNotEmpty()
	@Transform(({ value }: { value: string }) => value?.trim())
	actionName: string;

	@IsNumber()
	@IsOptional()
	@Min(1)
	amount?: number;
}
