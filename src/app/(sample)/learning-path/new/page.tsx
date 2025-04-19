import { Suspense } from 'react';
import LearningPathClient from '../LearningPathClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewLearningPathPage() {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<LearningPathClient />
		</Suspense>
	);
}

function LoadingSkeleton() {
	return (
		<div className='flex-1 flex items-center justify-center'>
			<div className='space-y-8 w-[80%] max-w-[800px]'>
				<Skeleton className='h-8 w-3/4' />
				<Skeleton className='h-4 w-1/2' />
				<div className='space-y-4'>
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className='space-y-2'>
							<Skeleton className='h-20 w-full' />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
