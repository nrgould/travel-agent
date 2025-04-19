import React from 'react';
import {
	// Remove EdgeProps import if no longer directly used
	// EdgeProps,
	getBezierPath,
	EdgeLabelRenderer,
	Position, // Import Position enum
	// Remove BaseEdge import if unused
	// BaseEdge,
} from '@xyflow/react';
import { TransportIcon } from './DestinationNode'; // Assuming TransportIcon is exported

// Define the shape of edge data
interface CustomEdgeData {
	type?: 'plane' | 'train' | 'bus';
	duration?: string;
	[key: string]: any; // Add index signature for compatibility
}

// Define Edge props manually based on EdgeProps and what the component uses
interface CustomEdgeProps {
	id: string;
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	sourcePosition: Position;
	targetPosition: Position;
	style?: React.CSSProperties;
	data: CustomEdgeData;
	markerEnd?: string;
	selected?: boolean; // Add selected state
	// Add other potentially passed props if needed
}

// Use the new props interface
export default function CustomEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	markerEnd,
	selected, // Destructure selected
}: CustomEdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const hasTransport = data && data.type;

	// Create a path for the edge - more explicit SVG approach
	// Conditionally apply style based on 'selected' prop if desired
	return (
		<>
			{/* Using a more direct SVG approach for the path to ensure dashes are visible */}
			<svg
				style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					top: 0,
					left: 0,
				}}
			>
				<path
					id={id}
					d={edgePath}
					className={`react-flow__edge-path ${
						hasTransport ? 'transport-edge' : 'no-transport-edge'
					} ${selected ? 'selected' : ''}`}
					strokeWidth={hasTransport ? 2 : 3}
					stroke={
						selected
							? 'hsl(var(--ring))' // Highlight color when selected
							: hasTransport
							? 'hsl(var(--primary))'
							: 'hsl(var(--destructive))'
					}
					strokeDasharray={hasTransport ? '7, 4' : 'none'}
					fill='none'
					markerEnd={markerEnd}
					style={style} // Apply passed style
				/>
			</svg>

			{hasTransport && data.duration && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							pointerEvents: 'all',
							zIndex: 1,
						}}
						className='nodrag nopan px-2 py-1 rounded bg-background border border-secondary shadow-sm'
					>
						<div className='flex items-center space-x-2'>
							<TransportIcon type={data.type!} />
							<span className='text-xs text-muted-foreground'>
								{data.duration}
							</span>
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
