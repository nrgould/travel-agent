'use client';

import React from 'react';
import { format } from 'date-fns';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
	Calendar,
	MapPin,
	Clock,
	Landmark,
	Utensils,
	Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the shape of destination details
export interface DestinationDetails {
	id: string;
	label: string;
	description: string;
	type?: 'city' | 'landmark' | 'attraction';
	startDate?: Date;
	endDate?: Date;
	bestTime?: string;
	attractions?: string[];
	restaurants?: string[];
	activities?: string[];
	// Add any other details you want to display
}

interface DestinationSheetProps {
	isOpen: boolean;
	onClose: () => void;
	destination: DestinationDetails | null;
}

export function DestinationSheet({
	isOpen,
	onClose,
	destination,
}: DestinationSheetProps) {
	if (!destination) {
		return null;
	}

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent className='w-[400px] sm:w-[540px] overflow-y-auto px-4'>
				<SheetHeader className='pb-4'>
					<div className='flex items-center justify-between'>
						<SheetTitle className='text-xl'>
							{destination.label}
						</SheetTitle>
						<Badge
							className={cn(
								'transition-colors',
								destination.type === 'city'
									? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
									: destination.type === 'landmark'
									? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
									: 'bg-green-100 text-green-700 hover:bg-green-200'
							)}
						>
							{destination.type || 'destination'}
						</Badge>
					</div>
					<SheetDescription className='mt-2 text-sm'>
						{destination.description}
					</SheetDescription>
				</SheetHeader>

				<div className='space-y-6'>
					{/* Destination Details */}
					<div className='space-y-2'>
						{(destination.startDate || destination.endDate) && (
							<div className='flex items-center text-sm'>
								<Calendar className='h-4 w-4 mr-2 text-muted-foreground' />
								<span>
									{destination.startDate
										? format(
												destination.startDate,
												'LLL dd, y'
										  )
										: '??'}
									{destination.endDate &&
									destination.startDate
										? ` - ${format(
												destination.endDate,
												'LLL dd, y'
										  )}`
										: destination.endDate
										? format(
												destination.endDate,
												'LLL dd, y'
										  )
										: ''}
								</span>
							</div>
						)}
						{destination.bestTime && (
							<div className='flex items-center text-sm'>
								<Clock className='h-4 w-4 mr-2 text-muted-foreground' />
								<span>
									Best time to visit: {destination.bestTime}
								</span>
							</div>
						)}
						<div className='flex items-center text-sm'>
							<MapPin className='h-4 w-4 mr-2 text-muted-foreground' />
							<a
								href={`https://maps.google.com/?q=${destination.label}`}
								target='_blank'
								rel='noopener noreferrer'
								className='text-primary hover:underline'
							>
								View on Google Maps
							</a>
						</div>
					</div>

					{/* Attractions Section */}
					{destination.attractions &&
						destination.attractions.length > 0 && (
							<div className='space-y-2'>
								<h3 className='font-medium flex items-center'>
									<Landmark className='h-4 w-4 mr-2 text-blue-500' />
									Must-See Attractions
								</h3>
								<ul className='space-y-1 pl-6 list-disc text-sm'>
									{destination.attractions.map(
										(attraction, i) => (
											<li key={i}>{attraction}</li>
										)
									)}
								</ul>
							</div>
						)}

					{/* Restaurants Section */}
					{destination.restaurants &&
						destination.restaurants.length > 0 && (
							<div className='space-y-2'>
								<h3 className='font-medium flex items-center'>
									<Utensils className='h-4 w-4 mr-2 text-amber-500' />
									Recommended Restaurants
								</h3>
								<ul className='space-y-1 pl-6 list-disc text-sm'>
									{destination.restaurants.map(
										(restaurant, i) => (
											<li key={i}>{restaurant}</li>
										)
									)}
								</ul>
							</div>
						)}

					{/* Activities Section */}
					{destination.activities &&
						destination.activities.length > 0 && (
							<div className='space-y-2'>
								<h3 className='font-medium flex items-center'>
									<Camera className='h-4 w-4 mr-2 text-green-500' />
									Things to Do
								</h3>
								<ul className='space-y-1 pl-6 list-disc text-sm'>
									{destination.activities.map(
										(activity, i) => (
											<li key={i}>{activity}</li>
										)
									)}
								</ul>
							</div>
						)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
