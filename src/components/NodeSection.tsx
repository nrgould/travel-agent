'use client';

import React, { useCallback, useMemo } from 'react';
import {
	ReactFlow,
	addEdge,
	Background,
	Connection,
	Controls,
	Edge,
	MiniMap,
	Node,
	useEdgesState,
	useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
	DestinationNode,
	DestinationNodeData,
	TransportIcon,
} from './DestinationNode';

// Define the initial destinations for a horizontal layout
const initialNodes: Node<DestinationNodeData>[] = [
	{
		id: '1',
		position: { x: 50, y: 150 }, // Start node
		data: {
			label: 'Munich',
			description: 'Capital of Bavaria with rich cultural heritage',
			type: 'city',
			stayDuration: 3,
			bestTime: 'Sep-Oct (Oktoberfest)',
		},
		type: 'destination',
	},
	{
		id: '2',
		position: { x: 450, y: 150 }, // Directly right of Munich
		data: {
			label: 'Vienna',
			description: 'City of Music, elegant cafes and imperial palaces',
			type: 'city',
			stayDuration: 4,
			bestTime: 'Apr-May or Sep-Oct',
		},
		type: 'destination',
	},
	{
		id: '3',
		position: { x: 850, y: 150 }, // Directly right of Vienna
		data: {
			label: 'Prague',
			description: 'City of a Hundred Spires with medieval architecture',
			type: 'city',
			stayDuration: 3,
			bestTime: 'Mar-May or Sep-Nov',
		},
		type: 'destination',
	},
	{
		id: '4',
		position: { x: 450, y: 400 }, // Below Vienna/Munich
		data: {
			label: 'Neuschwanstein',
			description: 'Fairytale castle that inspired Disney',
			type: 'landmark',
			stayDuration: 1,
			bestTime: 'Jun-Sep',
		},
		type: 'destination',
	},
	{
		id: '5',
		position: { x: 850, y: 400 }, // Below Prague, right of Neuschwanstein
		data: {
			label: 'Salzburg',
			description: 'Birthplace of Mozart with Alpine landscapes',
			type: 'city',
			stayDuration: 2,
			bestTime: 'Jul-Aug or Dec',
		},
		type: 'destination',
	},
];

// Define the edges for horizontal connections, specifying handle IDs
const initialEdges: Edge[] = [
	{
		id: 'e1-2',
		source: '1',
		sourceHandle: 'right', // Specify source handle
		target: '2',
		targetHandle: 'left', // Specify target handle
		label: <TransportIcon type='train' />,
		data: { type: 'train' },
	},
	{
		id: 'e2-3',
		source: '2',
		sourceHandle: 'right',
		target: '3',
		targetHandle: 'left',
		label: <TransportIcon type='plane' />,
		data: { type: 'plane' },
	},
	{
		id: 'e1-4',
		source: '1',
		sourceHandle: 'right', // Connect from right side of Munich
		target: '4',
		targetHandle: 'left', // Connect to left side of Neuschwanstein
		label: <TransportIcon type='bus' />,
		data: { type: 'bus' },
	},
	{
		id: 'e4-5',
		source: '4',
		sourceHandle: 'right',
		target: '5',
		targetHandle: 'left',
		label: <TransportIcon type='bus' />,
		data: { type: 'bus' },
	},
	{
		id: 'e2-5',
		source: '2',
		sourceHandle: 'right', // Connect from right side of Vienna
		target: '5',
		targetHandle: 'left', // Connect to left side of Salzburg
		label: <TransportIcon type='train' />,
		data: { type: 'train' },
	},
	// Removed e1-3, e2-3, e3-5, e4-5, e2-5 if they don't fit horizontal flow
	// Add connections that make sense horizontally
];

const NodeSection = () => {
	// Register custom node types
	const nodeTypes = useMemo(
		() => ({
			destination: DestinationNode,
		}),
		[]
	);

	// Use the hooks as before
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// onConnect remains the same, using addEdge helper
	const onConnect = useCallback(
		(params: Edge | Connection) =>
			setEdges((eds: Edge[]) => addEdge(params, eds)),
		[setEdges]
	);

	return (
		<div className='w-full h-full border rounded-lg overflow-hidden'>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				fitView
				fitViewOptions={{ padding: 0.2 }} // Add padding for better initial view
				attributionPosition='bottom-right'
				minZoom={0.4}
				maxZoom={1.5}
				defaultViewport={{ x: 0, y: 0, zoom: 0.7 }} // Adjust initial zoom/pan
			>
				<Background
					style={{ backgroundColor: 'hsl(var(--background))' }}
				/>
			</ReactFlow>
		</div>
	);
};

export default NodeSection;
