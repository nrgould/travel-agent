'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { LearningPathSidebar } from './LearningPathSidebar';

export function MobileLearningPathSidebar() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant='outline'
					size='icon'
					className='fixed bottom-4 left-4 z-50 rounded-full shadow-lg'
				>
					<Menu className='h-4 w-4' />
				</Button>
			</SheetTrigger>
			<SheetContent side='left' className='p-0 w-80'>
				<LearningPathSidebar
					className='w-full h-full'
					containerClassName='h-[calc(100vh-56px)]'
				/>
			</SheetContent>
		</Sheet>
	);
}
