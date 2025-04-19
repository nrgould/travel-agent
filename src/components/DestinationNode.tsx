'use client';

import React, { useState } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plane, Train, Bus, MapPin, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the shape of our node data
export interface DestinationNodeData {
	label: string;
	description?: string;
	type?: 'city' | 'landmark' | 'attraction';
	stayDuration?: number; // in days
	bestTime?: string;
	// imageUrl removed as it's not used
}

// Component to show the right transportation icon
const TransportIcon = ({ type }: { type: string }) => {
	switch (type) {
		case 'plane':
			return <Plane className='h-4 w-4 text-blue-500' />;
		case 'train':
			return <Train className='h-4 w-4 text-green-500' />;
		case 'bus':
			return <Bus className='h-4 w-4 text-amber-500' />;
		default:
			return null;
	}
};

// Define props type for the DestinationNode
type DestinationNodeProps = NodeProps<DestinationNodeData>;

// The actual node component
export function DestinationNode({ data, isConnectable }: DestinationNodeProps) {
	const [isFavorite, setIsFavorite] = useState(false);

	return (
		<div className='relative'>
			{/* Input handle (left) */}
			<Handle
				id='left'
				type='target'
				position={Position.Left}
				isConnectable={isConnectable}
				className='w-2 h-2 bg-muted-foreground/50 border-2 border-background rounded-full'
				style={{
					top: '50%',
					transform: 'translateY(-50%)',
					left: '-4px',
				}}
			/>

			<Card className='w-[280px] shadow-md hover:shadow-lg transition-all duration-200 bg-card'>
				<CardHeader className='pb-2 pt-3'>
					<div className='flex items-center justify-between mb-1'>
						<CardTitle className='text-base font-medium'>
							{data.label}
						</CardTitle>
						<Badge
							className={cn(
								'transition-colors text-xs px-2 py-0.5',
								data.type === 'city'
									? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
									: data.type === 'landmark'
									? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
									: 'bg-green-100 text-green-700 hover:bg-green-200'
							)}
						>
							{data.type || 'destination'}
						</Badge>
					</div>
					{data.description && (
						<CardDescription className='text-xs line-clamp-2 mt-1'>
							{data.description}
						</CardDescription>
					)}
				</CardHeader>

				<CardContent className='space-y-2 pb-2 pt-1'>
					{data.stayDuration && (
						<div className='flex items-center text-xs text-muted-foreground'>
							<Calendar className='h-3.5 w-3.5 mr-2' />
							<span>
								Stay: {data.stayDuration}{' '}
								{data.stayDuration === 1 ? 'day' : 'days'}
							</span>
						</div>
					)}

					<div className='flex items-center text-xs text-muted-foreground'>
						<MapPin className='h-3.5 w-3.5 mr-2' />
						<span>View on map</span>
					</div>
				</CardContent>

				<CardFooter className='pt-2 pb-3 flex justify-between'>
					<Button
						variant='outline'
						size='sm'
						className='text-xs h-7 w-full'
					>
						<Info className='h-3.5 w-3.5 mr-1.5' />
						Details
					</Button>
				</CardFooter>
			</Card>

			{/* Output handle (right) */}
			<Handle
				id='right'
				type='source'
				position={Position.Right}
				isConnectable={isConnectable}
				className='w-2 h-2 bg-primary/50 border-2 border-background rounded-full'
				style={{
					top: '50%',
					transform: 'translateY(-50%)',
					right: '-4px',
				}}
			/>
		</div>
	);
}

// Export the transport icon for use in edge labels
export { TransportIcon };
