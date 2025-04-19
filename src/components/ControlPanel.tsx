'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Map, SquareMousePointer } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ControlPanelProps {
	isMapVisible: boolean;
	setMapVisible: (visible: boolean) => void;
	isNodeVisible: boolean;
	setNodeVisible: (visible: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
	isMapVisible,
	setMapVisible,
	isNodeVisible,
	setNodeVisible,
}) => {
	// Handle toggle changes - ToggleGroup provides the current pressed values in an array
	const handleValueChange = (value: string[]) => {
		setMapVisible(value.includes('map'));
		setNodeVisible(value.includes('nodes'));
	};

	// Determine the current values based on visibility state
	const currentValues = [];
	if (isMapVisible) currentValues.push('map');
	if (isNodeVisible) currentValues.push('nodes');

	return (
		<Card className='p-1.5 shadow-lg border bg-card/80 backdrop-blur-sm'>
		<ToggleGroup
			type='multiple' // Allow multiple toggles to be pressed
			variant='default'
			value={currentValues} // Controlled component
			onValueChange={handleValueChange}
			// className='flex items-center'
		>
			<ToggleGroupItem value='map' aria-label='Toggle map'>
				<Map className='h-4 w-4' />
			</ToggleGroupItem>
			<ToggleGroupItem value='nodes' aria-label='Toggle nodes'>
				<SquareMousePointer className='h-4 w-4' />
				</ToggleGroupItem>
			</ToggleGroup>
		</Card>
	);
};

export default ControlPanel;
