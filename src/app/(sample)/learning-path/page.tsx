import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserLearningPaths } from './actions';
import ClientRedirect from './ClientRedirect';
import LearningPathInputWrapper from './LearningPathInputWrapper';
import { PdfLearningPathCreator } from './PdfLearningPathCreator';

type Props = {
	searchParams?: Promise<{ pdfId?: string }>;
};

export default async function LearningPathPage({ searchParams }: Props) {
	const params = await searchParams;
	const pdfId = params?.pdfId;

	// Get all user learning paths
	try {
		const pathsResponse = await getUserLearningPaths();
		if (pathsResponse.success && pathsResponse.learningPaths) {
			const paths = pathsResponse.learningPaths;

			// If we have a pdfId, we want to show the dialog regardless of existing paths
			if (pdfId) {
				return (
					<Suspense fallback={<LoadingSkeleton />}>
						<div className='flex-1 flex items-center justify-center'>
							<PdfLearningPathCreator pdfId={pdfId} />
						</div>
					</Suspense>
				);
			}

			if (paths.length > 0) {
				// Sort by lastUpdated and get the most recent one
				const sortedPaths = [...paths].sort(
					(a, b) =>
						new Date(b.updated_at).getTime() -
						new Date(a.updated_at).getTime()
				);

				// Use client-side redirect instead
				return <ClientRedirect pathId={sortedPaths[0].id} />;
			}
		}
	} catch (error) {
		console.error('Error fetching learning paths:', error);
	}

	// Either no paths exist or there was an error, show the creation page
	// If we have a pdfId, show the PDF learning path creator
	if (pdfId) {
		return (
			<Suspense fallback={<LoadingSkeleton />}>
				<div className='flex-1 flex items-center justify-center'>
					<PdfLearningPathCreator pdfId={pdfId} />
				</div>
			</Suspense>
		);
	}

	// Otherwise show the regular input wrapper
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<div className='flex-1 flex items-center justify-center'>
				<LearningPathInputWrapper />
			</div>
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
