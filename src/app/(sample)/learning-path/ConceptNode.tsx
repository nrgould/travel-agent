'use client';

import { Handle, Position } from '@xyflow/react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, BookOpen, Play, ArrowRight, Loader2 } from 'lucide-react';
import { LearningPathNode } from '@/lib/learning-path-schemas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { generateUUID } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createChatFromLearningPathNode } from './actions';

interface ConceptNodeProps {
	data: {
		node: LearningPathNode;
		onProgressChange?: (id: string, progress: number) => void;
		isDisabled?: boolean;
	};
	selected: boolean;
}

export function ConceptNode({ data, selected }: ConceptNodeProps) {
	const { node, onProgressChange, isDisabled } = data;
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// Debug log to see what properties are available on the node
	useEffect(() => {
		console.log('Node properties:', {
			id: node.id,
			chat_id: node.chat_id,
			is_active: node.is_active,
			progress: node.progress,
		});
	}, [node]);

	// Function to get color based on difficulty
	const getDifficultyColor = (difficulty: number) => {
		if (difficulty <= 3)
			return 'bg-emerald-50 text-emerald-600 border-emerald-100';
		if (difficulty <= 6)
			return 'bg-amber-50 text-amber-600 border-amber-100';
		return 'bg-rose-50 text-rose-600 border-rose-100';
	};

	// Function to get grade color and letter
	const getGradeInfo = (grade: number | undefined) => {
		if (grade === undefined)
			return { color: 'text-gray-400', letter: 'Not Started' };
		if (grade >= 90) return { color: 'text-emerald-500', letter: 'A' };
		if (grade >= 80) return { color: 'text-emerald-400', letter: 'B' };
		if (grade >= 70) return { color: 'text-yellow-500', letter: 'C' };
		if (grade >= 60) return { color: 'text-red-400', letter: 'D' };
		return { color: 'text-red-500', letter: 'F' };
	};

	const handleStartConcept = async () => {
		try {
			// Check if the node ID is a simple number (like "1", "2", etc.)
			// This indicates we're using temporary IDs and need to refresh
			if (/^\d+$/.test(node.id)) {
				toast({
					title: 'Please refresh the page',
					description:
						'Please refresh the page before starting this concept.',
					variant: 'destructive',
				});
				return;
			}

			setIsLoading(true);

			// Generate a unique ID for the chat
			const chatId = generateUUID();

			// Show a toast to indicate the process has started
			toast({
				title: 'Starting Concept',
				description: `Creating a chat for ${node.concept}...`,
			});

			// Call the server action to create a chat from this node
			const result = await createChatFromLearningPathNode(
				{
					id: node.id,
					concept: node.concept,
					description: node.description,
				},
				chatId,
				false // Disable server-side redirect
			);

			if (!result.success) {
				throw new Error(result.error);
			}

			// Navigate to the chat page using the returned chat ID
			router.push(`/chat/${result.chatId || chatId}`);
		} catch (error) {
			console.error('Error starting concept:', error);
			toast({
				title: 'Error',
				description:
					'Failed to start learning this concept. Please try again.',
				variant: 'destructive',
			});
			setIsLoading(false);
		}
	};

	const handleContinueConcept = async () => {
		if (!node.chat_id) return;

		try {
			setIsLoading(true);

			// Show a toast notification
			toast({
				title: 'Continuing Learning',
				description: `Resuming your chat for ${node.concept}...`,
			});

			// Navigate to the chat page
			await router.push(`/chat/${node.chat_id}`);
		} catch (error) {
			console.error('Error continuing concept:', error);
			toast({
				title: 'Error',
				description: 'Failed. Please try again.',
				variant: 'destructive',
			});
			setIsLoading(false);
		}
	};

	const difficultyClass = getDifficultyColor(node.difficulty);
	const gradeInfo = getGradeInfo(node.grade);

	// Use is_active property to determine if the node is active
	const isActive = node.is_active || false;
	const hasChatId = !!node.chat_id;

	// canStart means the node is unlocked and can be started
	const canStart = !isDisabled;

	return (
		<div
			className={cn(
				'p-4 rounded-lg shadow-md bg-white border-2 w-[250px] transition-opacity duration-200',
				selected ? 'border-primary' : 'border-gray-200',
				isActive && node.progress < 100
					? 'border-l-4 border-l-blue-500'
					: '',
				node.progress === 100 ? 'border-l-4 border-l-green-500' : '',
				isDisabled && 'opacity-50 cursor-not-allowed'
			)}
		>
			{/* Source handle */}
			<Handle
				type='source'
				position={Position.Right}
				className={cn(
					'w-3 h-3 border-2 border-white',
					isDisabled ? 'bg-gray-400' : 'bg-primary'
				)}
			/>

			{/* Target handle */}
			<Handle
				type='target'
				position={Position.Left}
				className={cn(
					'w-3 h-3 border-2 border-white',
					isDisabled ? 'bg-gray-400' : 'bg-primary'
				)}
			/>

			<div className='space-y-3'>
				{/* Concept title with active indicator */}
				<div className='flex items-center justify-between'>
					<h3 className='font-semibold text-gray-800'>
						{node.concept}
					</h3>
					{node.progress === 100 && (
						<Badge
							variant='outline'
							className='bg-green-50 text-green-600 border-green-200 text-xs px-2'
						>
							Completed
						</Badge>
					)}
					{isDisabled && (
						<Badge
							variant='outline'
							className='bg-gray-50 text-gray-600 border-gray-200 text-xs px-2'
						>
							Locked
						</Badge>
					)}
				</div>

				{/* Description */}
				<p className='text-sm text-gray-600 line-clamp-2'>
					{node.description}
				</p>

				{/* Metadata */}
				<div className='flex flex-wrap gap-2 text-xs'>
					<Badge
						variant='outline'
						className={`${difficultyClass} text-xs opacity-80`}
					>
						Lvl {node.difficulty}
					</Badge>

					{/* <Badge
						variant='outline'
						className='bg-violet-50 text-violet-700 border-violet-200'
					>
						<BookOpen className='w-3 h-3 mr-1' />
						Grade:{' '}
						<span className={`ml-1 font-bold ${gradeInfo.color}`}>
							{gradeInfo.letter}
						</span>
					</Badge> */}
				</div>

				{/* Progress section */}
				<div className='space-y-1'>
					<div className='flex justify-between text-xs text-gray-600'>
						<span>Progress</span>
						<span>{node.progress}%</span>
					</div>
					<Progress value={node.progress} className='h-2' />
				</div>

				{/* Button section - show different buttons based on state */}
				<>
					{canStart && hasChatId && isActive ? (
						// Continue button for active concepts with existing chat
						<Button
							className='w-full gap-2 mt-2'
							onClick={handleContinueConcept}
							size='sm'
							variant='outline'
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									Loading...
								</>
							) : (
								<>
									<ArrowRight className='w-4 h-4' />
									Continue Learning
								</>
							)}
						</Button>
					) : canStart ? (
						// Start button for concepts without existing chat
						<Button
							className='w-full gap-2 mt-2'
							onClick={handleStartConcept}
							size='sm'
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									Starting...
								</>
							) : (
								<>
									<Play className='w-4 h-4' />
									Start Learning
								</>
							)}
						</Button>
					) : null}
				</>
			</div>
		</div>
	);
}
