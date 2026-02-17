'use client';
import { ICON_SIZES } from '@/config/constants';
import { Button } from '@/components/ui/Button';
import PetSprite from '@/features/pets/components/PetSprite';
import { useTranslation } from '@/i18n/useTranslation';
import { Check, Clock, Close, Users } from '@nsmr/pixelart-react';
import { Request, RequestDirection } from '@widgetable/types';

interface CoparentingCardProps {
	request: Request;
	type: RequestDirection;
	onAccept?: () => void;
	onDecline?: () => void;
	onCancel?: () => void;
}

const CoparentingCard = ({ request, type, onAccept, onDecline, onCancel }: CoparentingCardProps) => {
	const { t } = useTranslation();
	const otherUser = type === RequestDirection.RECEIVED ? request.sender : request.recipient;
	const pet = request.metadata?.pet;

	if (!pet || !otherUser) return null;

	return (
		<div className="bg-surface rounded-2xl p-2 shadow-md border border-secondary/20 flex items-center gap-4">
			<div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
				<PetSprite pet={pet} height={64} width={64} forceShow />
			</div>

			<div className="flex-1 min-w-0">
				<p className="font-semibold text-foreground truncate">{pet.name}</p>
				<div className="flex items-center gap-1 text-sm text-secondary min-w-0">
					<Users width={ICON_SIZES.XS} height={ICON_SIZES.XS} className="flex-shrink-0" />
					<span className="truncate min-w-0">
						{type === RequestDirection.RECEIVED
							? t('friends.wantsToShare', { name: otherUser.name })
							: t('friends.sharedWith', { name: otherUser.name })}
					</span>
				</div>
			</div>

			<div className="flex flex-col items-center gap-2">
				{type === RequestDirection.RECEIVED ? (
					<>
						<Button onClick={onAccept} variant="primary" className="p-2">
							<Check width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
						</Button>
						<Button onClick={onDecline} variant="secondary" className="p-2">
							<Close width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
						</Button>
					</>
				) : (
					<>
						<Button disabled={true} variant="secondary" title="Pending" className="p-2">
							<Clock width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="flex-shrink-0" />
						</Button>
						<Button onClick={onCancel} variant="secondary" className="p-2">
							<Close width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
						</Button>
					</>
				)}
			</div>
		</div>
	);
};

export default CoparentingCard;
