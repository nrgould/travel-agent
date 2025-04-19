'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Map, SquareMousePointer, Calendar, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNodeContext } from './NodeContext';

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
	// Get nodes from context
	const { nodes } = useNodeContext();

	// Handle toggle changes - ToggleGroup provides the current pressed values in an array
	const handleValueChange = (value: string[]) => {
		setMapVisible(value.includes('map'));
		setNodeVisible(value.includes('nodes'));
	};

	// Determine the current values based on visibility state
	const currentValues = [];
	if (isMapVisible) currentValues.push('map');
	if (isNodeVisible) currentValues.push('nodes');

	// Calculate total trip duration and destinations
	const totalDestinations = nodes.length;
	const totalDuration = nodes.reduce((total, node) => {
		return total + (node.data.stayDuration || 0);
	}, 0);

	return (
		<Card className='p-1.5 shadow-lg border bg-card/80 backdrop-blur-sm'>
			<div className='flex items-center'>
				<ToggleGroup
					type='multiple'
					variant='default'
					value={currentValues}
					onValueChange={handleValueChange}
				>
					<ToggleGroupItem value='map' aria-label='Toggle map'>
						<Map className='h-4 w-4' />
					</ToggleGroupItem>
					<ToggleGroupItem value='nodes' aria-label='Toggle nodes'>
						<SquareMousePointer className='h-4 w-4' />
					</ToggleGroupItem>
				</ToggleGroup>

				<div className='mx-2 h-5 w-px bg-border'></div>

				<div className='flex items-center gap-3 text-xs text-muted-foreground px-1'>
					<div className='flex items-center gap-1.5'>
						<MapPin className='h-3.5 w-3.5' />
						<span>{totalDestinations}</span>
					</div>
					<div className='flex items-center gap-1.5'>
						<Calendar className='h-3.5 w-3.5' />
						<span>{totalDuration}d</span>
					</div>
				</div>
			</div>
		</Card>
	);
};

export default ControlPanel;
