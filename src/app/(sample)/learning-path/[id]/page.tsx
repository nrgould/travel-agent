import { Suspense } from 'react';
import { getLearningPathDetails } from '../actions';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import LearningPathClient from '../LearningPathClient';
import { LearningPath } from '@/lib/learning-path-schemas';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LearningPathPage({ params }: Props) {
	const { id } = await params;

	// Handle new path creation
	if (id === 'new') {
		return (
			<Suspense fallback={<LoadingSkeleton />}>
				<LearningPathClient />
			</Suspense>
		);
	}

	// Fetch the learning path data
	try {
		const { userId } = await auth();
		if (!userId) {
			redirect('/sign-in');
		}

		const response = await getLearningPathDetails(id);

		if (!response.success || !response.learningPath) {
			notFound();
		}

		// Format the data for the client component
		const initialPathData: LearningPath = {
			title: response.learningPath.title,
			description: response.learningPath.description,
			nodes: response.learningPath.nodes,
			edges: response.learningPath.edges,
		};

		return (
			<Suspense fallback={<LoadingSkeleton />}>
				<LearningPathClient
					initialPathId={id}
					initialPathData={initialPathData}
				/>
			</Suspense>
		);
	} catch (error) {
		console.error('Error fetching learning path:', error);
		notFound();
	}
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
