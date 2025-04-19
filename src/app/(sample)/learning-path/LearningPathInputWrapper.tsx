'use client';

import { useRouter } from 'next/navigation';
import { LearningPathInput } from './LearningPathInput';
import { LearningPath } from '@/lib/learning-path-schemas';

export default function LearningPathInputWrapper() {
	const router = useRouter();

	const handlePathCreated = (
		path: LearningPath,
		concept: string,
		gradeLevel: string,
		pathId?: string
	) => {
		// Navigate to the new learning path if pathId is provided
		if (pathId) {
			router.push(`/learning-path/${pathId}`);
		}
	};

	return <LearningPathInput onPathCreated={handlePathCreated} />;
}
