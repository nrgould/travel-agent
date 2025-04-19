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

export default function Home() {
	const [isMapVisible, setMapVisible] = useState(true);
	const [isNodeVisible, setNodeVisible] = useState(true);

	const transitionSettings = { duration: 0.3, ease: 'easeInOut' };

	return (
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
					direction='horizontal'
					className='flex-grow border rounded-lg overflow-hidden'
				>
					<AnimatePresence initial={false}>
						{isMapVisible && (
							<ResizablePanel
								key='map-panel'
								defaultSize={isNodeVisible ? 50 : 100}
								minSize={20}
								className='!overflow-auto'
							>
								<motion.div
									key='map-content'
									className='h-full w-full'
									transition={transitionSettings}
									initial={{ x: '-100%', opacity: 0 }}
									animate={{ x: '0%', opacity: 1 }}
									exit={{ x: '-100%', opacity: 0 }}
								>
									<MapSection />
								</motion.div>
							</ResizablePanel>
						)}
					</AnimatePresence>

					{isMapVisible && isNodeVisible && <ResizableHandle />}

					<AnimatePresence initial={false}>
						{isNodeVisible && (
							<ResizablePanel
								key='node-panel'
								defaultSize={isMapVisible ? 50 : 100}
								minSize={20}
								className='!overflow-auto'
							>
								<motion.div
									key='node-content'
									className='h-full w-full'
									transition={transitionSettings}
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
	);
}
