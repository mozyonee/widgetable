import { User } from "@widgetable/types";

export enum FriendshipStatus {
	NONE = 'none',
	SENT = 'sent',
	RECEIVED = 'received',
	FRIENDS = 'friends',
}

export interface FriendRequests {
	received: User[];
	sent: User[];
}

export interface FriendWithStatus extends User {
	status: FriendshipStatus.RECEIVED | FriendshipStatus.SENT | FriendshipStatus.FRIENDS;
}
