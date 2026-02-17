import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SendGiftDto {
	@IsMongoId()
	@IsNotEmpty()
	recipientId: string;

	@IsString()
	@IsNotEmpty()
	itemName: string;

	@IsNumber()
	@Min(1)
	quantity: number;
}
