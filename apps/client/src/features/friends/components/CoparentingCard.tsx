'use client';

import { Button } from '@/components/ui/Button';
import PetSprite from '@/features/pets/components/PetSprite';
import { Request, RequestDirection } from '@widgetable/types';
import { Check, Clock, Users, X } from 'lucide-react';

interface CoparentingCardProps {
	request: Request;
	type: RequestDirection;
	onAccept?: () => void;
	onDecline?: () => void;
	onCancel?: () => void;
}

const CoparentingCard = ({ request, type, onAccept, onDecline, onCancel }: CoparentingCardProps) => {
	const otherUser = type === RequestDirection.RECEIVED ? request.sender : request.recipient;
	const pet = request.metadata?.pet;

	if (!pet || !otherUser) return null;

	return (
		<div className="bg-white rounded-2xl p-4 shadow-md border border-secondary/20 flex items-center gap-4">
			<div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
				<PetSprite pet={pet} height={64} width={64} />
			</div>

			<div className="flex-1 min-w-0">
				<p className="font-semibold text-foreground truncate">{pet.name}</p>
				<div className="flex items-center gap-1 text-sm text-secondary min-w-0">
					<Users size={12} className="flex-shrink-0" />
					<span className="truncate min-w-0">
						{type === RequestDirection.RECEIVED
							? `${otherUser.name} wants to share`
							: `Shared with ${otherUser.name}`}
					</span>
				</div>
			</div>

			<div className="flex flex-col items-center gap-2">
				{type === RequestDirection.RECEIVED ? (
					<>
						<Button onClick={onAccept} variant="primary" className="!p-2">
							<Check size={20} />
						</Button>
						<Button onClick={onDecline} variant="secondary" className="!p-2">
							<X size={20} />
						</Button>
					</>
				) : (
					<>
						<Button disabled={true} variant="secondary" title="Pending" className="!p-2">
							<Clock size={20} className="flex-shrink-0" />
						</Button>
						<Button onClick={onCancel} variant="secondary" className="!p-2">
							<X size={20} />
						</Button>
					</>
				)}
			</div>
		</div>
	);
};

export default CoparentingCard;
