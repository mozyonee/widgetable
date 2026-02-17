import { IsMongoId, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
	@IsMongoId()
	@IsNotEmpty()
	recipientId: string;
}
