'use client';

interface TabsProps {
	tabs: string[];
	activeTab: number;
	onTabChange: (index: number) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
	return (
		<div className="flex gap-2 bg-white rounded-2xl shadow-md border border-secondary/20 p-2">
			{tabs.map((label, index) => (
				<button
					key={index}
					onClick={() => onTabChange(index)}
					className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
						activeTab === index
							? 'bg-primary text-white'
							: 'bg-transparent text-secondary hover:bg-secondary/10'
					}`}
				>
					{label}
				</button>
			))}
		</div>
	);
}
