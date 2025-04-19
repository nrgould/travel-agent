'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ClientRedirectProps {
	pathId: string;
}

export default function ClientRedirect({ pathId }: ClientRedirectProps) {
	const router = useRouter();

	useEffect(() => {
		if (pathId) {
			router.push(`/learning-path/${pathId}`);
		}
	}, [pathId, router]);

	return (
		<div className='flex flex-col items-center justify-center h-screen'>
			<Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
			<p className='text-muted-foreground'>
				Redirecting to your learning path...
			</p>
		</div>
	);
}
