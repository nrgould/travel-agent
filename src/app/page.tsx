'use client';

import { useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import MadeBy from '@/components/MadeBy';
import MapSection from '@/components/MapSection';
import NodeSection from '@/components/NodeSection';
import { ModeToggle } from '@/components/theme-toggle';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';

export default function Home() {
	const [isMapVisible, setMapVisible] = useState(true);
	const [isNodeVisible, setNodeVisible] = useState(true);

	return (
		<div className='relative flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]'>
			<div className='absolute top-5 left-5 z-20'>
				<MadeBy />
			</div>
			<div className='absolute top-5 left-1/2 -translate-x-1/2 z-20'>
				<ControlPanel
					isMapVisible={isMapVisible}
					setMapVisible={setMapVisible}
					isNodeVisible={isNodeVisible}
					setNodeVisible={setNodeVisible}
				/>
			</div>
			<div className='absolute top-5 right-5 z-20'>
				<ModeToggle />
			</div>
			<ResizablePanelGroup
				direction='horizontal'
				className='flex-grow border rounded-lg overflow-hidden'
			>
				{isMapVisible && (
					<ResizablePanel
						defaultSize={isNodeVisible ? 50 : 100}
						minSize={20}
					>
						<MapSection />
					</ResizablePanel>
				)}

				{isMapVisible && isNodeVisible && <ResizableHandle />}

				{isNodeVisible && (
					<ResizablePanel
						defaultSize={isMapVisible ? 50 : 100}
						minSize={20}
					>
						<NodeSection />
					</ResizablePanel>
				)}
			</ResizablePanelGroup>
		</div>
	);
}
