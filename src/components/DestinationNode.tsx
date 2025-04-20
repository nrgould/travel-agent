'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
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
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
	Plane,
	Train,
	Bus,
	MapPin,
	Calendar as CalendarIcon,
	Info,
	Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DestinationSheet, DestinationDetails } from './DestinationSheet';
import { useNodeContext } from './NodeSection';
import { useDateStore } from '@/store/dateStore';

// Define the shape of our node data
export interface DestinationNodeData {
	label: string;
	description?: string;
	type?: 'city' | 'landmark' | 'attraction';
	stayDuration?: number; // in days
	startDate?: Date;
	endDate?: Date;
	bestTime?: string;
	// Re-add index signature
	[key: string]: any;
	// imageUrl removed as it's not used
}

// Mock destination details data - in a real app, this would come from your backend
const destinationDetailsMap: Record<string, DestinationDetails> = {
	Munich: {
		id: 'munich',
		label: 'Munich',
		description:
			'Capital of Bavaria with rich cultural heritage and famous Oktoberfest',
		type: 'city',
		startDate: new Date(2024, 9, 1),
		endDate: new Date(2024, 9, 3),
		bestTime: 'September-October (Oktoberfest)',
		attractions: [
			'Marienplatz and New Town Hall',
			'English Garden',
			'BMW Museum & BMW World',
			'Nymphenburg Palace',
			'Munich Residenz',
		],
		restaurants: [
			'Hofbräuhaus - Historic beer hall',
			'Augustiner Bräustuben - Traditional Bavarian food',
			'Tantris - Michelin-starred restaurant',
			'Viktualienmarkt - Food market with various stalls',
		],
		activities: [
			'Take a brewery tour',
			'Watch FC Bayern Munich play at Allianz Arena',
			'Day trip to Neuschwanstein Castle',
			'Visit the Museum Quarter',
		],
	},
	Vienna: {
		id: 'vienna',
		label: 'Vienna',
		description: 'City of Music, elegant cafes and imperial palaces',
		type: 'city',
		startDate: new Date(2024, 9, 4),
		endDate: new Date(2024, 9, 7),
		bestTime: 'April-May or September-October',
		attractions: [
			'Schönbrunn Palace',
			"St. Stephen's Cathedral",
			'Belvedere Palace',
			'Vienna State Opera',
			'Hofburg Imperial Palace',
		],
		restaurants: [
			'Café Central - Historic coffeehouse',
			'Figlmüller - Famous for schnitzel',
			'Steirereck - Fine dining',
			'Naschmarkt - Food market with restaurants',
		],
		activities: [
			'Attend a classical music concert',
			'Visit the Spanish Riding School',
			'Take a Danube River cruise',
			'Explore the MuseumsQuartier',
		],
	},
	Prague: {
		id: 'prague',
		label: 'Prague',
		description: 'Historic capital with stunning architecture',
		type: 'city',
		bestTime: 'May-June or September',
		attractions: [
			'Prague Castle',
			'Charles Bridge',
			'Old Town Square & Astronomical Clock',
			'St. Vitus Cathedral',
			'Jewish Quarter',
		],
		restaurants: [
			'Lokál - Czech pub with traditional food',
			'Café Louvre - Historic café',
			'La Degustation - Michelin-starred restaurant',
			'Kantýna - Butcher shop and restaurant',
		],
		activities: [
			'Take a river cruise on the Vltava',
			'Attend a black light theater performance',
			'Climb Petřín Hill for amazing views',
			"Visit Prague's microbreweries",
		],
	},
	'Neuschwanstein Castle': {
		id: 'neuschwanstein',
		label: 'Neuschwanstein Castle',
		description: 'Iconic fairytale castle in the Alps',
		type: 'landmark',
		bestTime: 'April-October',
		attractions: [
			'Neuschwanstein Castle Tour',
			'Hohenschwangau Castle',
			'Museum of the Bavarian Kings',
			'Alpsee Lake',
			"Marienbrücke (Queen Mary's Bridge)",
		],
		restaurants: [
			'Schlossrestaurant Neuschwanstein - Near the castle',
			'Alpenrose am See - By the lake',
			'Hotel Müller Restaurant - Traditional Bavarian food',
		],
		activities: [
			'Scenic hike around the castle',
			'Boat ride on Alpsee Lake',
			'Visit nearby Füssen old town',
			'Explore the Tegelberg mountain via cable car',
		],
	},
	Salzburg: {
		id: 'salzburg',
		label: 'Salzburg',
		description: 'Birthplace of Mozart with Alpine landscapes',
		type: 'city',
		bestTime: 'July-August or December',
		attractions: [
			'Hohensalzburg Fortress',
			"Mozart's Birthplace",
			'Mirabell Palace and Gardens',
			'Salzburg Cathedral',
			'Hellbrunn Palace',
		],
		restaurants: [
			'St. Peter Stiftskulinarium - Oldest restaurant in Europe',
			'Café Tomaselli - Historic café',
			'Goldener Hirsch - Fine dining',
			'Augustiner Bräustübl - Beer hall with food stalls',
		],
		activities: [
			"Take 'The Sound of Music' tour",
			'Visit the Salzburg Festival (if in season)',
			'Day trip to Hallstatt and the salt mines',
			'Visit the Untersberg mountain',
		],
	},
	'New Destination': {
		id: 'new-destination',
		label: 'New Destination',
		description: 'Add details here',
		type: 'city',
		bestTime: 'Anytime',
		attractions: [],
		restaurants: [],
		activities: [],
	},
};

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

// Define props type manually, mimicking sample code
interface DestinationNodeProps {
	id: string; // ID is still passed by React Flow
	data: DestinationNodeData; // Your data object
	selected?: boolean; // Selected state from React Flow (optional)
	isConnectable?: boolean; // isConnectable is still passed
	onDelete?: (id: string) => void; // Add delete callback
	// Date constraint props
	prevNodeEndDate?: Date; // End date of the previous node in sequence
	nextNodeStartDate?: Date; // Start date of the next node in sequence
	// Remove unused position/state props for now
	// xPos?: number;
	// yPos?: number;
	// zIndex?: number;
	// dragging?: boolean;
	// Add other props React Flow might pass if needed
}

// The actual node component
// Use the new props interface
export function DestinationNode({
	id,
	data,
	selected,
	isConnectable,
	onDelete,
	prevNodeEndDate,
	nextNodeStartDate,
}: // Remove unused props from destructuring
// xPos,
// yPos,
DestinationNodeProps) {
	const { updateNodeData } = useNodeContext();
	const {
		lastAvailableDate,
		earliestAvailableDate,
		setLastAvailableDate,
		setEarliestAvailableDate,
	} = useDateStore();
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
		// Access data properties directly
		if (data.startDate && data.endDate) {
			return { from: data.startDate, to: data.endDate };
		}
		return undefined;
	});

	// Update global date store when this node's dates change
	useEffect(() => {
		// Only update if we have valid dates
		if (!data.startDate && !data.endDate) return;

		try {
			// Make sure we're working with valid Date objects
			if (data.startDate) {
				const startDate =
					data.startDate instanceof Date
						? data.startDate
						: new Date(data.startDate);

				// Only update if this is actually the earliest date
				if (
					!earliestAvailableDate ||
					startDate < earliestAvailableDate
				) {
					setEarliestAvailableDate(startDate);
				}
			}

			if (data.endDate) {
				const endDate =
					data.endDate instanceof Date
						? data.endDate
						: new Date(data.endDate);

				// Only update if this is actually the latest date
				if (!lastAvailableDate || endDate > lastAvailableDate) {
					setLastAvailableDate(endDate);
				}
			}
		} catch (error) {
			console.error('Error handling date updates:', error);
		}
	}, [
		data.startDate,
		data.endDate,
		earliestAvailableDate,
		lastAvailableDate,
		setEarliestAvailableDate,
		setLastAvailableDate,
	]);

	// Get details from our map, or use a fallback if not found
	const getNodeDetails = (): DestinationDetails | null => {
		// Access data properties directly
		if (data.label && destinationDetailsMap[data.label]) {
			return {
				...destinationDetailsMap[data.label],
				startDate: data.startDate,
				endDate: data.endDate,
			};
		}

		// If no details found in our map, create basic details from node data
		if (data.label) {
			return {
				id: id, // Use id from props
				label: data.label,
				description: data.description || `Visit ${data.label}`,
				type: data.type,
				startDate: data.startDate,
				endDate: data.endDate,
				bestTime: data.bestTime,
			};
		}

		return null;
	};

	// Handlers for saving edits
	const handleTitleSave = (value: string) => {
		// Pass id from props
		updateNodeData(id, { label: value });
		setIsEditingTitle(false);
	};

	// Handle date range selection
	const handleDateSelect = (range: DateRange | undefined) => {
		// Update local state
		setDateRange(range);

		// Only update node data when we have a complete range
		if (range && range.from && range.to) {
			updateNodeData(id, {
				startDate: range.from,
				endDate: range.to,
			});
		}
		// If only start date is set, don't update node data yet
		// This allows the user to select the end date without the popover closing
	};

	return (
		// Add selected class based on props.selected
		<div
			className={cn(
				'relative',
				selected ? 'border-2 border-primary' : ''
			)}
		>
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

			{/* Access data properties directly inside JSX */}
			<Card className='w-[280px] shadow-md hover:shadow-lg transition-all duration-200 bg-card node-card'>
				<CardHeader className='pb-2 pt-3'>
					<div className='flex items-center justify-between mb-1'>
						{isEditingTitle ? (
							<Input
								size={1}
								className='text-base font-medium h-7 px-2 mr-2 nodrag'
								defaultValue={data.label}
								autoFocus
								onBlur={(e) => handleTitleSave(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter')
										handleTitleSave(
											(e.target as HTMLInputElement).value
										);
									if (e.key === 'Escape')
										setIsEditingTitle(false);
								}}
							/>
						) : (
							<div
								className='flex-grow cursor-text'
								onDoubleClick={() => setIsEditingTitle(true)}
							>
								<CardTitle className='text-base font-medium'>
									{data.label}
								</CardTitle>
							</div>
						)}
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
					{/* Date Range Picker */}
					<div className='grid gap-2'>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id='date'
									variant={'outline'}
									className={cn(
										'w-full justify-start text-left font-normal h-7 px-2 text-xs',
										!dateRange && 'text-muted-foreground'
									)}
								>
									<CalendarIcon className='mr-2 h-3.5 w-3.5' />
									{dateRange?.from ? (
										dateRange.to ? (
											<>
												{format(
													dateRange.from,
													'LLL dd, y'
												)}{' '}
												-{'	'}
												{format(
													dateRange.to,
													'LLL dd, y'
												)}
											</>
										) : (
											format(dateRange.from, 'LLL dd, y')
										)
									) : (
										<span>
											Pick arrival/departure dates
										</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className='w-auto p-0'
								align='start'
								// Make sure the popover doesn't close on selection
								onInteractOutside={(e) => {
									// Only close if we click outside completely
									// This helps prevent the popover from closing when selecting dates
									const currentTarget =
										e.currentTarget as HTMLElement;
									const target = e.target as Node;
									if (
										currentTarget &&
										!currentTarget.contains(target)
									) {
										e.preventDefault();
									}
								}}
							>
								<Calendar
									initialFocus
									mode='range'
									defaultMonth={dateRange?.from}
									selected={dateRange}
									onSelect={handleDateSelect}
									numberOfMonths={1}
									// Use basic constraints but without type issues
									fromDate={
										prevNodeEndDate
											? new Date(prevNodeEndDate)
											: undefined
									}
									toDate={
										nextNodeStartDate
											? new Date(nextNodeStartDate)
											: undefined
									}
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* View on Map Link */}
					<div className='flex items-center text-xs text-muted-foreground'>
						<MapPin className='h-3.5 w-3.5 mr-2' />
						<a
							href={`https://maps.google.com/?q=${data.label}`}
							target='_blank'
							rel='noopener noreferrer'
							className='text-primary hover:underline'
							onClick={(e) => e.stopPropagation()}
						>
							View on map
						</a>
					</div>
				</CardContent>

				<CardFooter className='pt-2 pb-3 flex justify-between gap-2'>
					<Button
						variant='outline'
						size='sm'
						className='text-xs h-7 flex-1'
						onClick={() => setIsSheetOpen(true)}
					>
						<Info className='h-3.5 w-3.5 mr-1.5' />
						Details
					</Button>

					{onDelete && (
						<Button
							variant='outline'
							size='sm'
							className='text-xs h-7 w-9 text-destructive hover:text-destructive hover:bg-destructive/10'
							onClick={(e) => {
								e.stopPropagation();
								if (onDelete) onDelete(id);
							}}
						>
							<Trash2 className='h-3.5 w-3.5' />
						</Button>
					)}
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

			{/* Destination details sheet */}
			<DestinationSheet
				isOpen={isSheetOpen}
				onClose={() => setIsSheetOpen(false)}
				destination={getNodeDetails()}
			/>
		</div>
	);
}

// Export the transport icon for use in edge labels
export { TransportIcon };
