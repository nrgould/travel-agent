'use client';

import { useEffect, useState } from 'react';
import { LearningPathInput } from './LearningPathInput';
import { LearningPathFlow } from './LearningPathFlow';
import { Loader2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { usePathname, useRouter } from 'next/navigation';
import { useLearningPathStore } from '@/store/learning-path-store';
import { LearningPath } from '@/lib/learning-path-schemas';
import { Skeleton } from '@/components/ui/skeleton';

interface LearningPathClientProps {
	// Optional initialPathId to select on load
	initialPathId?: string;
	initialPathData?: LearningPath | null;
}

export default function LearningPathClient({
	initialPathId,
	initialPathData = null,
}: LearningPathClientProps) {
	// Use the Zustand store instead of React state
	const {
		currentPath,
		isLoading,
		loadPaths,
		clearCurrentPath,
		selectPath,
		setCurrentPath,
		activePathId,
	} = useLearningPathStore();

	const [initialized, setInitialized] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const isNewPath = pathname === '/learning-path/new';

	// Clear current path when on the 'new' route
	useEffect(() => {
		if (isNewPath) {
			clearCurrentPath();
			setInitialized(true);
		}
	}, [isNewPath, clearCurrentPath]);

	// Initialize with server-provided data if available
	useEffect(() => {
		if (initialPathData && initialPathId && !initialized) {
			setCurrentPath(initialPathData, initialPathId);
			setInitialized(true);
			loadPaths(); // Load the paths list in the background
		}
	}, [
		initialPathData,
		initialPathId,
		setCurrentPath,
		loadPaths,
		initialized,
	]);

	// Function to handle when a new path is created
	const handlePathCreated = (
		path: LearningPath,
		conceptValue: string,
		gradeLevelValue: string,
		pathId?: string
	) => {
		// Update the URL to the new path's ID
		if (pathId) {
			router.push(`/learning-path/${pathId}`);
		}

		// Also update the store
		if (pathId) {
			selectPath(pathId);
		} else {
			setCurrentPath(path, pathId || null);
		}

		// Refresh the paths list
		loadPaths();
	};

	// Render the main content area with loading state
	const renderMainContent = () => {
		if (!initialized || isLoading) {
			return (
				<div className='flex items-center justify-center h-[calc(100vh-64px)]'>
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

		if (currentPath && currentPath.nodes && currentPath.nodes.length > 0) {
			return (
				<LearningPathFlow
					currentPath={currentPath}
					setCurrentPath={setCurrentPath}
				/>
			);
		}

		return (
			<div className='flex items-center justify-center h-[calc(100vh-64px)]'>
				<LearningPathInput onPathCreated={handlePathCreated} />
			</div>
		);
	};

	return <div className='flex-1'>{renderMainContent()}</div>;
}
