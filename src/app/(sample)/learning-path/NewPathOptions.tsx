'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from 'ai/react';
import { useLearningPathStore } from '@/store/learning-path-store';
import { learningPathSchema } from '@/lib/learning-path-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { BookOpen, FileText, Plus, Loader2, Sparkles } from 'lucide-react';
import { getUserLearningPaths } from './actions';

interface NewPathOptionsProps {
	onNewPath: () => void;
}

export function NewPathOptions({ onNewPath }: NewPathOptionsProps) {
	const router = useRouter();
	const {
		clearCurrentPath,
		setCurrentPath,
		loadPaths,
		isLoading: storeIsLoading,
	} = useLearningPathStore();

	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [localConcept, setLocalConcept] = useState('');
	const [localGradeLevel, setLocalGradeLevel] = useState('high school');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Use the useObject hook to generate the learning path
	const {
		submit: generate,
		object: completion,
		isLoading: isGenerating,
	} = useObject({
		api: '/api/learning-path',
		schema: learningPathSchema,
		onFinish: async ({ object }) => {
			if (object) {
				try {
					// Small delay to ensure the path is saved before we fetch it
					await new Promise((resolve) => setTimeout(resolve, 500));

					const result = await getUserLearningPaths();
					if (
						result.success &&
						result.learningPaths &&
						result.learningPaths.length > 0
					) {
						// Sort by created_at and get the most recent one
						const paths = result.learningPaths.sort(
							(a, b) =>
								new Date(b.created_at).getTime() -
								new Date(a.created_at).getTime()
						);

						const mostRecent = paths[0];

						// Set the current path with the path ID
						setCurrentPath(object, mostRecent.id);
					} else {
						// Fallback if we couldn't get the ID
						setCurrentPath(object, null);
					}

					// Refresh the paths list
					await loadPaths();

					toast({
						title: 'Learning Path Created',
						description: `Your personalized learning path for ${localConcept} has been created.`,
					});

					// Close the dialog
					setIsDialogOpen(false);
				} catch (error) {
					console.error('Error fetching learning path ID:', error);
					setCurrentPath(object, null);
				}
			}
			setIsLoading(false);
		},
		onError: (error) => {
			console.error('Error generating learning path:', error);
			setError('Failed to generate learning path. Please try again.');

			toast({
				title: 'Error Creating Learning Path',
				description:
					'There was a problem generating your learning path. Please try again.',
				variant: 'destructive',
			});

			setIsLoading(false);
		},
	});

	const handleCreateFromMaterials = () => {
		// Call the onNewPath prop instead of using Zustand
		onNewPath();

		// Show toast notification
		toast({
			title: 'Create New Learning Path',
			description: 'You can now upload materials to learn from.',
		});

		// Navigate to the learning path page with a query parameter to force a refresh
		router.push('/learning-path?new=' + Date.now());

		// Close the popover
		setIsPopoverOpen(false);
	};

	const handleOpenDescriptionDialog = () => {
		setIsDialogOpen(true);
		setIsPopoverOpen(false);
	};

	const handleCreateFromDescription = (e: React.FormEvent) => {
		e.preventDefault();

		if (!localConcept.trim()) {
			toast({
				title: 'Please enter a concept',
				description:
					'You need to specify what you want to learn about.',
				variant: 'destructive',
			});
			return;
		}

		// Set loading state and clear any previous errors
		setIsLoading(true);
		setError(null);

		try {
			// Generate the learning path using the AI
			generate({
				concept: localConcept,
				gradeLevel: localGradeLevel,
			});

			// Note: We don't close the dialog or navigate here
			// The onFinish callback will handle that after the AI generates the path
		} catch (err) {
			// Handle any synchronous errors
			console.error('Error submitting form:', err);
			setError('Failed to submit form. Please try again.');
			setIsLoading(false);

			toast({
				title: 'Error Submitting Form',
				description:
					'There was a problem with your submission. Please try again.',
				variant: 'destructive',
			});
		}
	};

	return (
		<>
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<PopoverTrigger asChild>
					<Button variant='outline' className='w-full justify-start'>
						<Plus className='mr-2 h-4 w-4' />
						Create New Path
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-56' align='start'>
					<div className='grid gap-2'>
						<Button
							variant='outline'
							className='justify-start'
							onClick={handleCreateFromMaterials}
						>
							<FileText className='mr-2 h-4 w-4' />
							From Materials
						</Button>
						<Button
							variant='outline'
							className='justify-start'
							onClick={handleOpenDescriptionDialog}
						>
							<BookOpen className='mr-2 h-4 w-4' />
							From Description
						</Button>
					</div>
				</PopoverContent>
			</Popover>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>Create Learning Path</DialogTitle>
						<DialogDescription>
							Enter a concept you want to learn about and select
							your grade level.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateFromDescription}>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<Label htmlFor='concept'>
									What do you want to learn?
								</Label>
								<Input
									id='concept'
									placeholder='e.g., Quantum Physics, World War II, Calculus'
									value={localConcept}
									onChange={(e) =>
										setLocalConcept(e.target.value)
									}
									disabled={isLoading || isGenerating}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='grade-level'>Grade Level</Label>
								<Select
									value={localGradeLevel}
									onValueChange={setLocalGradeLevel}
									disabled={isLoading || isGenerating}
								>
									<SelectTrigger id='grade-level'>
										<SelectValue placeholder='Select grade level' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='elementary school'>
											Elementary School
										</SelectItem>
										<SelectItem value='middle school'>
											Middle School
										</SelectItem>
										<SelectItem value='high school'>
											High School
										</SelectItem>
										<SelectItem value='undergraduate'>
											Undergraduate
										</SelectItem>
										<SelectItem value='graduate'>
											Graduate
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='submit'
								disabled={isLoading || isGenerating}
								className='gap-2'
							>
								{isLoading || isGenerating ? (
									<>
										<Loader2 className='h-4 w-4 animate-spin' />
										Generating...
									</>
								) : (
									<>
										<Sparkles className='h-4 w-4' />
										Generate Learning Path
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
