'use client';

import { useState } from 'react';
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

export default function Home() {
	const [isMapVisible, setMapVisible] = useState(false);
	const [isNodeVisible, setNodeVisible] = useState(true);

	return (
		<NodeProvider>
			<div className='relative flex flex-col h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]'>
				<div className='absolute top-5 left-5 z-20'>
					<MadeBy />
				</div>
				<div className='absolute bottom-5 left-1/2 -translate-x-1/2 z-20'>
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
