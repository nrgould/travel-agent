import { create } from 'zustand';
import { Node } from '@xyflow/react';
import { DestinationNodeData } from '@/components/DestinationNode';

interface DateStore {
	// Date constraints
	lastAvailableDate: Date | null;
	earliestAvailableDate: Date | null;

	// Itinerary analysis
	itineraryGaps: Array<{ startDate: Date; endDate: Date; duration: number }>;

	// Date suggestion
	suggestedDuration: number; // in days

	// Actions
	setLastAvailableDate: (date: Date | null) => void;
	setEarliestAvailableDate: (date: Date | null) => void;
	resetDates: () => void;
	analyzeItinerary: (nodes: Node<DestinationNodeData>[]) => void;
	getSuggestedDateRange: (
		prevNodeDate?: Date,
		nextNodeDate?: Date
	) => {
		suggestedStartDate: Date | null;
		suggestedEndDate: Date | null;
	};
}

export const useDateStore = create<DateStore>((set, get) => ({
	// Initial state
	lastAvailableDate: null,
	earliestAvailableDate: null,
	itineraryGaps: [],
	suggestedDuration: 2, // Default suggestion of 2 days per destination

	// Actions
	setLastAvailableDate: (date: Date | null) =>
		set({ lastAvailableDate: date }),

	setEarliestAvailableDate: (date: Date | null) =>
		set({ earliestAvailableDate: date }),

	resetDates: () =>
		set({
			lastAvailableDate: null,
			earliestAvailableDate: null,
			itineraryGaps: [],
		}),

	// Analyze the entire itinerary to find gaps and optimal durations
	analyzeItinerary: (nodes) => {
		// Make sure nodes have valid dates before proceeding
		const nodesWithDates = nodes.filter(
			(node) => node.data.startDate && node.data.endDate
		);

		if (nodesWithDates.length === 0) {
			set({ itineraryGaps: [] });
			return;
		}

		// Sort nodes by start date
		const sortedNodes = [...nodesWithDates].sort(
			(a, b) => a.data.startDate!.getTime() - b.data.startDate!.getTime()
		);

		// Calculate gaps between nodes
		const gaps = [];
		for (let i = 0; i < sortedNodes.length - 1; i++) {
			const currentNodeEndDate = sortedNodes[i].data.endDate!;
			const nextNodeStartDate = sortedNodes[i + 1].data.startDate!;

			// If there's a gap of at least 1 day
			if (
				nextNodeStartDate.getTime() - currentNodeEndDate.getTime() >
				24 * 60 * 60 * 1000
			) {
				gaps.push({
					startDate: currentNodeEndDate,
					endDate: nextNodeStartDate,
					duration: Math.ceil(
						(nextNodeStartDate.getTime() -
							currentNodeEndDate.getTime()) /
							(24 * 60 * 60 * 1000)
					),
				});
			}
		}

		// Calculate average duration of existing destinations
		if (sortedNodes.length > 0) {
			const durations = sortedNodes.map((node) => {
				const startTime = node.data.startDate!.getTime();
				const endTime = node.data.endDate!.getTime();
				return (
					Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000)) + 1
				); // +1 to include the end day
			});

			const avgDuration =
				durations.reduce((sum, duration) => sum + duration, 0) /
				durations.length;
			set({
				suggestedDuration: Math.max(2, Math.round(avgDuration)),
				itineraryGaps: gaps,
			});
		}
	},

	// Get a suggested date range based on surrounding nodes or existing itinerary
	getSuggestedDateRange: (prevNodeDate, nextNodeDate) => {
		const { lastAvailableDate, earliestAvailableDate, suggestedDuration } =
			get();

		// Default duration for a destination
		const defaultDuration = suggestedDuration || 2; // Default to 2 days if no suggested duration

		// Case 1: We have both a prev and next node date - fit between them
		if (prevNodeDate && nextNodeDate) {
			// Calculate days between the two nodes
			const daysBetween = Math.floor(
				(nextNodeDate.getTime() - prevNodeDate.getTime()) /
					(24 * 60 * 60 * 1000)
			);

			// If we have enough space between nodes
			if (daysBetween > 1) {
				const suggestedStartDate = new Date(prevNodeDate);
				suggestedStartDate.setDate(prevNodeDate.getDate() + 1);

				const suggestedEndDate = new Date(suggestedStartDate);
				suggestedEndDate.setDate(
					suggestedStartDate.getDate() +
						Math.min(defaultDuration, daysBetween - 1)
				);

				return { suggestedStartDate, suggestedEndDate };
			}
		}

		// Case 2: Default to a simple suggestion of 2 weeks from now
		const today = new Date();
		const suggestedStartDate = new Date(today);
		suggestedStartDate.setDate(today.getDate() + 14); // 2 weeks from now

		const suggestedEndDate = new Date(suggestedStartDate);
		suggestedEndDate.setDate(
			suggestedStartDate.getDate() + defaultDuration
		);

		return { suggestedStartDate, suggestedEndDate };
	},
}));
