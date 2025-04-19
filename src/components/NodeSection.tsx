'use client';

import React, {
	useCallback,
	useMemo,
	useRef,
	createContext,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	ReactFlow,
	addEdge,
	Background,
	Connection,
	Edge,
	Node,
	EdgeTypes,
	NodeTypes,
	ReactFlowProvider,
	NodeChange,
	applyNodeChanges,
	EdgeChange,
	applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DestinationNode, DestinationNodeData } from './DestinationNode';
import CustomEdge from './CustomEdge';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { nanoid } from 'nanoid';
import { useNodeContext as useGlobalNodeContext } from './NodeContext';
import {
	getFlowData,
	addNodeAction,
	updateNodePositionAction,
	updateNodeDetailsAction,
	addEdgeAction,
} from '@/app/actions';
import { toast } from '@/components/ui/toast';

// Context for providing updateNodeData
interface NodeContextType {
	updateNodeData: (
		nodeId: string,
		dataUpdate: Partial<DestinationNodeData>
	) => void;
	nodes: Node<DestinationNodeData>[];
}
const NodeContext = createContext<NodeContextType | undefined>(undefined);

export const useNodeContext = () => {
	const context = useContext(NodeContext);
	if (!context) {
		throw new Error('useNodeContext must be used within a NodeProvider');
	}
	return context;
};

// Helper to get unique ID for nodes
const getUID = () => nanoid();

// Wrapper component to provide context
const NodeSectionWrapper = () => {
	const { nodes: contextNodes, setNodes: setContextNodes } =
		useGlobalNodeContext();

	const [edges, setEdges] = useState<Edge[]>([]);
	const [loading, setLoading] = useState(true);

	// Fetch initial data using the server action
	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const { nodes, edges } = await getFlowData();
				setContextNodes(nodes);
				setEdges(edges);
			} catch (error) {
				console.error('Error loading flow data:', error);
				toast({
					title: 'Error',
					description: 'Could not load itinerary.',
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [setContextNodes]);

	// Handle node changes (persist position)
	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			setContextNodes((nds: Node<DestinationNodeData>[]) => {
				const updatedNodes = applyNodeChanges(changes, nds);

				// Find position changes and call server action
				changes.forEach((change) => {
					if (change.type === 'position' && change.position) {
						// Fire and forget for now, add error handling if needed
						updateNodePositionAction(
							change.id,
							change.position
						).then(({ success, error }) => {
							if (!success) {
								console.error(
									'Failed to update node position:',
									error
								);
								toast({
									title: 'Sync Error',
									description:
										'Failed to save node position.',
									variant: 'destructive',
								});
							}
						});
					}
				});

				return updatedNodes as Node<DestinationNodeData>[];
			});
		},
		[setContextNodes]
	);

	// Handle edge changes (e.g., deletion - not implemented yet)
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) =>
			// TODO: Handle edge deletion via server action
			setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)),
		[setEdges]
	);

	// Handle new connections (add edge)
	const onConnect = useCallback(
		async (connection: Connection) => {
			// Ensure source and target are present
			if (!connection.source || !connection.target) return;

			// Optimistically create edge with temporary ID (or leave it out)
			// const tempEdge = { ...connection, type: 'custom', id: `temp-${nanoid()}` };
			// setEdges((eds) => addEdge(tempEdge, eds));

			try {
				const result = await addEdgeAction(
					connection.source,
					connection.target,
					{} // Pass empty data initially, or default type/duration
				);

				if (result.error) {
					toast({
						title: 'Error Creating Connection',
						description: result.error,
						variant: 'destructive',
					});
					// Remove optimistic edge if added
					// setEdges((eds) => eds.filter((e) => e.id !== tempEdge.id));
				} else if (result.edge) {
					// Add the actual edge returned from the server
					setEdges((eds: Edge[]) => addEdge(result.edge!, eds));
					toast({
						title: 'Connection Created',
						description: 'Edge saved successfully.',
					});
				} else {
					throw new Error(
						'Server action did not return an edge or error.'
					);
				}
			} catch (error) {
				console.error('Failed to add edge:', error);
				toast({
					title: 'Error',
					description: 'Could not create connection.',
					variant: 'destructive',
				});
				// Remove optimistic edge if added
				// setEdges((eds) => eds.filter((e) => e.id !== tempEdge.id));
			}
		},
		[setEdges]
	);

	// Handle updates to node details (label, dates, etc.) from DestinationNode
	const updateNodeData = useCallback(
		async (nodeId: string, dataUpdate: Partial<DestinationNodeData>) => {
			// Optimistically update local state first
			setContextNodes((nds: Node<DestinationNodeData>[]) =>
				nds.map((node: Node<DestinationNodeData>) =>
					node.id === nodeId
						? { ...node, data: { ...node.data, ...dataUpdate } }
						: node
				)
			);

			// Prepare payload for server action, converting dates
			const updatePayload: Record<string, any> = { ...dataUpdate };
			if (dataUpdate.startDate instanceof Date) {
				updatePayload.startDate = dataUpdate.startDate.toISOString();
			}
			if (dataUpdate.endDate instanceof Date) {
				updatePayload.endDate = dataUpdate.endDate.toISOString();
			}

			// Call the server action to persist the change
			try {
				const result = await updateNodeDetailsAction(
					nodeId,
					updatePayload
				);
				if (!result.success) {
					console.error(
						'Failed to update node details:',
						result.error
					);
					toast({
						title: 'Sync Error',
						description: 'Failed to save node details.',
						variant: 'destructive',
					});
					// Optionally revert optimistic update here
				}
			} catch (error) {
				console.error('Error calling updateNodeDetailsAction:', error);
				toast({
					title: 'Error',
					description: 'Could not save node details.',
					variant: 'destructive',
				});
				// Optionally revert optimistic update here
			}
		},
		[setContextNodes]
	);

	if (loading) {
		return <div>Loading itinerary...</div>;
	}

	return (
		<ReactFlowProvider>
			<NodeContext.Provider
				value={{ updateNodeData, nodes: contextNodes }}
			>
				<NodeSection
					nodes={contextNodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					setNodes={setContextNodes}
				/>
			</NodeContext.Provider>
		</ReactFlowProvider>
	);
};

interface NodeSectionProps {
	nodes: Node<DestinationNodeData>[];
	edges: Edge[];
	onNodesChange: (changes: NodeChange[]) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
	onConnect: (connection: Connection) => void;
	setNodes: React.Dispatch<React.SetStateAction<Node<DestinationNodeData>[]>>;
}

const NodeSection = ({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	setNodes,
}: NodeSectionProps) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);

	// Remove the 'as any' cast, hoping the refactor fixed the type issue
	const nodeTypes: NodeTypes = useMemo<NodeTypes>(
		() => ({ destination: DestinationNode }),
		[]
	);

	// Remove the 'as any' cast for edgeTypes
	const edgeTypes: EdgeTypes = useMemo<EdgeTypes>(
		() => ({ custom: CustomEdge }),
		[]
	);

	// Update addNode to use the server action
	const addNode = useCallback(async () => {
		// Remove client-side Supabase logic
		// const supabase = createClient();
		const position = { x: Math.random() * 500, y: Math.random() * 300 };
		// Remove local newNodeData definition
		// const newNodeData = { ... };

		try {
			const result = await addNodeAction(position);

			if (result.error) {
				throw new Error(result.error);
			}

			if (result.node) {
				// Update context state with the node returned from the server action
				setNodes((nds) => nds.concat(result.node!));
			} else {
				console.error('Server action did not return a node.');
			}
		} catch (error) {
			console.error('Error adding node:', error);
			// Handle error display to the user if needed
		}
	}, [setNodes]); // Dependency is the state setter function

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className='w-full h-full border rounded-lg overflow-hidden'
					ref={reactFlowWrapper}
				>
					<ReactFlow
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						fitView
						fitViewOptions={{ padding: 0.2 }}
						attributionPosition='bottom-right'
						minZoom={0.4}
						maxZoom={1.5}
						defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
					>
						<Background
							style={{
								backgroundColor: 'hsl(var(--background))',
							}}
						/>
					</ReactFlow>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className='w-64'>
				<ContextMenuItem inset onSelect={addNode}>
					Add New Destination
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default NodeSectionWrapper;
