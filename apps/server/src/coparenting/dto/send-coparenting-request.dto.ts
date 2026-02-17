import { IsMongoId, IsNotEmpty } from 'class-validator';

export class SendCoparentingRequestDto {
	@IsMongoId()
	@IsNotEmpty()
	recipientId: string;

	@IsMongoId()
	@IsNotEmpty()
	petId: string;
}
