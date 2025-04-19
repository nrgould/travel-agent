import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

function MadeBy() {
	return (
		<div className='flex items-center gap-2 border border-zinc-800 rounded-xl p-2'>
			<Avatar>
				<AvatarImage src='/nicholas.webp' />
				<AvatarFallback>NG</AvatarFallback>
			</Avatar>
			<p className='text-sm font-medium'>About</p>
		</div>
	);
}

export default MadeBy;
