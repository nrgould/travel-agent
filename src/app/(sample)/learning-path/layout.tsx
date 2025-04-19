'use client';

import { ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LearningPathSidebar } from './LearningPathSidebar';
import { MobileLearningPathSidebar } from './MobileLearningPathSidebar';

export default function LearningPathLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<ReactFlowProvider>
			<div className='flex flex-col md:flex-row min-h-screen'>
				{/* Learning paths sidebar - hidden on mobile */}
				<div className='hidden md:block border-r'>
					<LearningPathSidebar />
				</div>

				{/* Main content area */}
				<div className='flex-1'>{children}</div>

				{/* Mobile sidebar - visible only on mobile */}
				<div className='block md:hidden'>
					<MobileLearningPathSidebar />
				</div>
			</div>
		</ReactFlowProvider>
	);
}
