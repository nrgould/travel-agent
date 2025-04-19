'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
	ReactFlow,
	Controls,
	Background,
	applyNodeChanges,
	applyEdgeChanges,
	MarkerType,
	Node,
	Edge,
	BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ConceptNode } from './ConceptNode';
import {
	LearningPathNode,
	LearningPathEdge,
	LearningPath,
} from '@/lib/learning-path-schemas';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearningPathStore } from '@/store/learning-path-store';
import { Skeleton } from '@/components/ui/skeleton';

// Define the type for our custom node
type ConceptNodeData = {
	node: LearningPathNode;
	onProgressChange: (id: string, progress: number) => void;
};

interface LearningPathFlowProps {
	currentPath: LearningPath;
	setCurrentPath: (path: LearningPath | null, pathId?: string | null) => void;
}

// Export the component directly without wrapping it with ReactFlowProvider
// since the parent component now provides the context
export function LearningPathFlow({
	currentPath,
	setCurrentPath,
}: LearningPathFlowProps) {
	// Define node types
	const nodeTypes = useMemo(() => ({ concept: ConceptNode }), []);
	const { updateNodeProgress } = useLearningPathStore();

	// State for nodes and edges with proper typing
	const [nodes, setNodes] = useState<Node<ConceptNodeData>[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Calculate overall progress
	const overallProgress = currentPath?.nodes.length
		? Math.round(
				currentPath.nodes.reduce(
					(sum, node) => sum + node.progress,
					0
				) / currentPath.nodes.length
			)
		: 0;

	// Arrange nodes in a logical path based on dependencies while preserving original order
	const arrangeNodesInLogicalPath = (
		nodes: LearningPathNode[],
		edges: LearningPathEdge[]
	) => {
		const HORIZONTAL_SPACING = 350; // Space between nodes horizontally
		const START_X = 50; // Starting X position
		const START_Y = 100; // Starting Y position

		if (!nodes.length) return [];

		// If no edges, just maintain the original order
		if (!edges.length) {
			return nodes.map((node, index) => ({
				...node,
				position: {
					x: START_X + index * HORIZONTAL_SPACING,
					y: START_Y,
				},
			}));
		}

		// Create a map of node IDs to their original indices to preserve order
		const nodeIndexMap = new Map<string, number>();
		nodes.forEach((node, index) => {
			nodeIndexMap.set(node.id, index);
		});

		// Create a dependency graph
		const graph: Record<string, string[]> = {};
		const inDegree: Record<string, number> = {};

		// Initialize graph and inDegree
		nodes.forEach((node) => {
			graph[node.id] = [];
			inDegree[node.id] = 0;
		});

		// Build the graph
		edges.forEach((edge) => {
			graph[edge.source].push(edge.target);
			inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
		});

		// Find nodes with no dependencies (roots)
		const rootIds = nodes
			.filter((node) => inDegree[node.id] === 0)
			// Sort roots by their original index to maintain order
			.sort(
				(a, b) =>
					(nodeIndexMap.get(a.id) || 0) -
					(nodeIndexMap.get(b.id) || 0)
			)
			.map((node) => node.id);

		if (!rootIds.length) {
			// If there are no clear roots (circular dependencies),
			// use the first node as root
			const firstNode = nodes[0];
			rootIds.push(firstNode.id);
			// Reset its inDegree to avoid cycles
			inDegree[firstNode.id] = 0;
		}

		// Perform a topological sort with BFS
		const queue = [...rootIds];
		const visited = new Set<string>();
		const orderedNodes: LearningPathNode[] = [];

		while (queue.length) {
			const nodeId = queue.shift()!;
			const node = nodes.find((n) => n.id === nodeId);

			if (!node || visited.has(nodeId)) continue;

			visited.add(nodeId);
			orderedNodes.push(node);

			// Add neighbors to queue, sorted by their original index
			const neighborIds = graph[nodeId];
			const neighbors = neighborIds
				.map((id) => {
					const node = nodes.find((n) => n.id === id);
					return { id, originalIndex: nodeIndexMap.get(id) || 0 };
				})
				.sort((a, b) => a.originalIndex - b.originalIndex);

			neighbors.forEach(({ id }) => {
				inDegree[id]--;
				if (inDegree[id] === 0) {
					queue.push(id);
				}
			});
		}

		// If we haven't visited all nodes (due to cycles), add remaining nodes in their original order
		const remainingNodes = nodes
			.filter((node) => !visited.has(node.id))
			.sort(
				(a, b) =>
					(nodeIndexMap.get(a.id) || 0) -
					(nodeIndexMap.get(b.id) || 0)
			);

		orderedNodes.push(...remainingNodes);

		// Assign positions
		return orderedNodes.map((node, index) => ({
			...node,
			position: {
				x: START_X + index * HORIZONTAL_SPACING,
				y: START_Y,
			},
		}));
	};

	// Create linear connections between nodes based on their order
	const createLinearEdges = (nodes: LearningPathNode[]) => {
		if (!nodes || nodes.length <= 1) return [];

		return nodes.slice(0, -1).map((node, index) => {
			const nextNode = nodes[index + 1];
			// An edge should be disabled if the next node is not unlocked
			// Next node is unlocked if current node has progress >= 75%
			const isDisabled = node.progress < 75;

			return {
				id: `edge-${node.id}-${nextNode.id}`,
				source: node.id,
				target: nextNode.id,
				animated: !isDisabled,
				type: 'default',
				markerEnd: {
					type: MarkerType.ArrowClosed,
					width: 20,
					height: 20,
				},
				style: {
					stroke: isDisabled ? '#e5e7eb' : '#93c5fd',
					opacity: isDisabled ? 0.5 : 1,
				},
			};
		});
	};

	// Handle progress changes and sync with Supabase
	const handleProgressChange = async (nodeId: string, progress: number) => {
		// Use the Zustand store's updateNodeProgress function
		// This will update the UI state and sync with Supabase
		await updateNodeProgress(nodeId, progress);
	};

	// Update nodes and edges when currentPath changes
	useEffect(() => {
		if (!currentPath) return;

		// Only set loading if we have a current path with nodes
		if (currentPath.nodes && currentPath.nodes.length > 0) {
			setIsLoading(true);

			// Arrange nodes in a logical path based on dependencies and progress
			const arrangedNodes = arrangeNodesInLogicalPath(
				currentPath.nodes,
				currentPath.edges
			);

			// Convert learning path nodes to ReactFlow nodes
			const flowNodes: Node<ConceptNodeData>[] = arrangedNodes.map(
				(node, index) => {
					// First node is always unlocked
					// Other nodes are unlocked if the previous node has progress >= 75%
					const isUnlocked =
						index === 0 ||
						(index > 0 && arrangedNodes[index - 1].progress >= 75);

					// A node is disabled if it's not unlocked
					const isDisabled = !isUnlocked;

					return {
						id: node.id,
						type: 'concept',
						position: node.position,
						data: {
							node,
							onProgressChange: handleProgressChange,
							isDisabled,
						},
					};
				}
			);

			// Create linear edges (only connect to previous/next)
			const flowEdges = createLinearEdges(arrangedNodes);

			// Delay setting nodes to create a loading effect
			setTimeout(() => {
				setNodes(flowNodes);
				setEdges(flowEdges);
				setIsLoading(false);
			}, 500);
		} else {
			// If there are no nodes, don't show loading
			setIsLoading(false);
			setNodes([]);
			setEdges([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPath]);

	// Handle node changes
	const onNodesChange = useCallback(
		(changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
		[]
	);

	// Handle edge changes
	const onEdgesChange = useCallback(
		(changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
		[]
	);

	if (!currentPath) return null;

	if (isLoading) {
		return (
			<div className='flex-1 flex flex-col'>
				<div className='border-b p-4 flex items-center justify-between'>
					<div className='space-y-2'>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-4 w-96' />
					</div>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-9 w-24' />
						<Skeleton className='h-9 w-24' />
					</div>
				</div>
				<div className='flex-1 flex'>
					<div className='flex-1 relative'>
						<div className='absolute inset-0 bg-grid-pattern opacity-5' />
						{/* <div className='absolute inset-0 flex items-center justify-center'>
							<Skeleton className='h-48 w-48 rounded-xl' />
						</div> */}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='w-full h-[calc(100vh-64px)]'>
			<div className='p-4 border-b bg-white sticky top-0 z-10'>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
					<div>
						<h1 className='text-2xl font-bold text-gray-800'>
							{currentPath.title}
						</h1>
						<p className='text-gray-600 mt-1'>
							{currentPath.description}
						</p>
					</div>

					<div className='flex flex-col items-evenly justify-evenly gap-3'>
						<Badge
							variant='outline'
							className='bg-blue-50 text-blue-700 border-blue-200 px-3 py-1'
						>
							<BookOpen className='w-4 h-4 mr-2' />
							{currentPath.nodes.length} Concepts
						</Badge>

						<Badge
							variant='outline'
							className='bg-violet-50 text-violet-700 border-violet-200 px-3 py-1'
						>
							<BarChart2 className='w-4 h-4 mr-2' />
							{overallProgress}% Complete
						</Badge>
					</div>
				</div>
			</div>

			<AnimatePresence>
				{isLoading ? (
					<motion.div
						className='flex items-center justify-center h-[200px] mt-8'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<div className='text-center'>
							<div className='inline-block p-2 bg-primary/10 rounded-full'>
								<div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
							</div>
							<p className='text-sm text-muted-foreground mt-2'>
								Loading...
							</p>
						</div>
					</motion.div>
				) : (
					<motion.div
						className='w-full h-full'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							nodeTypes={nodeTypes}
							fitView
							attributionPosition='bottom-right'
							minZoom={0.5}
							maxZoom={1.5}
						>
							{/* <Background color='#FAECD2' gap={16} /> */}
							<Background id='1' gap={0} color='#fdfbf6' />

							<Controls position='top-right' />
						</ReactFlow>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
