'use client';

import { CreateLearningPathDialog } from './CreateLearningPathDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LearningPath } from '@/lib/learning-path-schemas';

interface LearningPathInputProps {
	onPathCreated: (
		path: any,
		concept: string,
		gradeLevel: string,
		pathId?: string
	) => void;
}

export function LearningPathInput({ onPathCreated }: LearningPathInputProps) {
	return (
		<div className='flex flex-col items-center justify-center h-[calc(100vh-64px)] w-full'>
			<div className='text-center flex items-center justify-center flex-col'>
				<h2 className='text-2xl font-bold mb-2'>
					No Learning Paths
				</h2>
				<p className='text-muted-foreground mb-4'>
					Create your first learning path to get started!
				</p>
				<CreateLearningPathDialog
					onPathCreated={onPathCreated}
					triggerButton={
						<Button size='lg' className='flex items-center gap-2'>
							<Plus className='h-5 w-5' />
							Create Learning Path
						</Button>
					}
				/>
			</div>
		</div>
	);
}
