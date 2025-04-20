'use client';

import { useState, useEffect } from 'react';
import ControlPanel from '@/components/ControlPanel';
import MadeBy from '@/components/MadeBy';
import MapSection from '@/components/MapSection';
import NodeSection from '@/components/NodeSection';
import { ModeToggle } from '@/components/theme-toggle';
import { motion, AnimatePresence } from 'motion/react';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { NodeProvider } from '@/components/NodeContext';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Home() {
	const searchParams = useSearchParams();
	const router = useRouter();

	// Get initial visibility from URL params or default to true
	const initialMapVisible = searchParams.get('map') !== 'false';
	const initialNodeVisible = searchParams.get('node') !== 'false';

	const [isMapVisible, setMapVisible] = useState(initialMapVisible);
	const [isNodeVisible, setNodeVisible] = useState(initialNodeVisible);

	// Update URL when visibility changes
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('map', isMapVisible.toString());
		params.set('node', isNodeVisible.toString());
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.replaceState(null, '', newUrl);
	}, [isMapVisible, isNodeVisible, searchParams]);

	// Custom setters that update both state and URL
	const updateMapVisibility = (visible: boolean) => {
		setMapVisible(visible);
	};

	const updateNodeVisibility = (visible: boolean) => {
		setNodeVisible(visible);
	};

	return (
		<NodeProvider>
			<div className='relative flex flex-col h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]'>
				<div className='absolute top-5 left-5 z-20'>
					<MadeBy />
				</div>
				<div className='absolute bottom-5 left-1/2 -translate-x-1/2 z-20'>
					<ControlPanel
						isMapVisible={isMapVisible}
						setMapVisible={updateMapVisibility}
						isNodeVisible={isNodeVisible}
						setNodeVisible={updateNodeVisibility}
					/>
				</div>
				<div className='absolute top-5 right-5 z-20'>
					<ModeToggle />
				</div>
				<div className='flex-1 flex min-h-0'>
					<ResizablePanelGroup
						id='main-panel-group'
						direction='horizontal'
						className='flex-grow border rounded-lg overflow-hidden relative'
					>
						<AnimatePresence initial={false}>
							{isMapVisible && (
								<ResizablePanel
									key='map-panel'
									id='map-panel'
									defaultSize={50}
									minSize={20}
									maxSize={80}
									className='!overflow-auto'
								>
									<motion.div
										key='map-content'
										className='h-full w-full'
										transition={{
											duration: 0.3,
											ease: 'easeInOut',
										}}
										initial={{ x: '-100%', opacity: 0 }}
										animate={{ x: '0%', opacity: 1 }}
										exit={{ x: '-100%', opacity: 0 }}
									>
										<MapSection />
									</motion.div>
								</ResizablePanel>
							)}
						</AnimatePresence>

						{/* Resizable Handle - outside of any animation wrapper */}
						{isMapVisible && isNodeVisible && (
							<ResizableHandle withHandle id='main-handle' />
						)}

						<AnimatePresence initial={false}>
							{isNodeVisible && (
								<ResizablePanel
									key='node-panel'
									id='node-panel'
									defaultSize={50}
									minSize={20}
									maxSize={80}
									className='!overflow-auto'
								>
									<motion.div
										key='node-content'
										className='h-full w-full'
										transition={{
											duration: 0.3,
											ease: 'easeInOut',
										}}
										initial={{ x: '100%', opacity: 0 }}
										animate={{ x: '0%', opacity: 1 }}
										exit={{ x: '100%', opacity: 0 }}
									>
										<NodeSection />
									</motion.div>
								</ResizablePanel>
							)}
						</AnimatePresence>
					</ResizablePanelGroup>
				</div>
			</div>
		</NodeProvider>
	);
}
