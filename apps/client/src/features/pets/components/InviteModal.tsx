'use client';

import UserCard from '@/features/friends/components/UserCard';
import { Clock, Close } from '@nsmr/pixelart-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface InviteModalProps {
	isOpen: boolean;
	onClose: () => void;
	friends: any[];
	onInvite: (friendId: string) => void;
}

export const InviteModal = ({ isOpen, onClose, friends, onInvite }: InviteModalProps) => {
	const [mounted, setMounted] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose]);

	const modalContent = isOpen && mounted ? (
		<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
			<div
				ref={modalRef}
				className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[80vh] overflow-hidden flex flex-col"
			>
				<div className="flex items-center justify-between p-4 border-b border-secondary/20">
					<h2 className="text-xl font-bold text-foreground">Invite a Friend</h2>
					<button
						onClick={onClose}
						className="text-secondary hover:text-foreground transition"
					>
						<Close width={24} height={24} />
					</button>
				</div>

				<div className="overflow-y-auto">
					{friends.length > 0 ? (
						friends.map((friend) => (
							<button
								key={friend._id}
								onClick={() => {
									if (!friend.hasPendingRequest) {
										onInvite(friend._id!);
										onClose();
									}
								}}
								disabled={friend.hasPendingRequest}
								className={`w-full text-left transition ${
									friend.hasPendingRequest ? 'cursor-not-allowed' : 'hover:bg-secondary/10'
								}`}
							>
								<div className={friend.hasPendingRequest ? 'opacity-50' : ''}>
									<UserCard
										user={friend}
										variant="nested"
										actions={
											friend.hasPendingRequest && (
												<Clock width={20} height={20} className="text-secondary" />
											)
										}
									/>
								</div>
							</button>
						))
					) : (
						<div className="flex flex-col items-center gap-2 p-6">
							<span className="text-secondary">No friends can be invited</span>
							<Link href="/friends" className="text-primary font-semibold hover:underline">
								Find more friends
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	) : null;

	return mounted && modalContent ? createPortal(modalContent, document.body) : null;
};
