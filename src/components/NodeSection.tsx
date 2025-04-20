'use client';

// Separate React imports from React Flow imports
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
	NodeChange,
	EdgeChange,
	applyNodeChanges,
	applyEdgeChanges,
	NodeTypes,
	EdgeTypes,
	ReactFlowProvider,
	useReactFlow,
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useNodeContext as useGlobalNodeContext } from './NodeContext';
import {
	getFlowData,
	addNodeAction,
	updateNodePositionAction,
	updateNodeDetailsAction,
	addEdgeAction,
	deleteNodeAction,
} from '@/app/actions';
import { toast } from 'sonner';
import { useDateStore } from '@/store/dateStore';

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
	const { setLastAvailableDate, setEarliestAvailableDate, analyzeItinerary } =
		useDateStore();

	const [edges, setEdges] = useState<Edge[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Handle node delete with confirmation
	const handleNodeDelete = useCallback((nodeId: string) => {
		setSelectedNodeId(nodeId);
		setIsDeleteDialogOpen(true);
	}, []);

	// Fetch initial data using the server action
	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const { nodes, edges } = await getFlowData();
				setContextNodes(nodes);
				setEdges(edges);

				// Update global date constraints and analyze itinerary
				updateGlobalDateConstraints(nodes);
				analyzeItinerary(nodes);
			} catch (error) {
				console.error('Error loading flow data:', error);
				toast.error('Error Loading Itinerary', {
					description:
						'Could not load itinerary data. Please try refreshing.',
				});
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [
		setContextNodes,
		setLastAvailableDate,
		setEarliestAvailableDate,
		analyzeItinerary,
	]);

	// Function to update global date constraints based on all nodes
	const updateGlobalDateConstraints = useCallback(
		(nodes: Node<DestinationNodeData>[]) => {
			// Find the latest end date from all nodes
			const endDates = nodes
				.filter((node) => node.data.endDate)
				.map((node) => node.data.endDate!.getTime());

			// Find the earliest start date from all nodes
			const startDates = nodes
				.filter((node) => node.data.startDate)
				.map((node) => node.data.startDate!.getTime());

			if (endDates.length > 0) {
				setLastAvailableDate(new Date(Math.max(...endDates)));
			} else {
				setLastAvailableDate(null);
			}

			if (startDates.length > 0) {
				setEarliestAvailableDate(new Date(Math.min(...startDates)));
			} else {
				setEarliestAvailableDate(null);
			}

			// Analyze the entire itinerary for gaps and suggestions
			analyzeItinerary(nodes);
		},
		[setLastAvailableDate, setEarliestAvailableDate, analyzeItinerary]
	);

	// Handle node changes (optimistic update only)
	const onNodesChange = useCallback(
		async (changes: NodeChange[]) => {
			// Check for node removal operations
			const removeChanges = changes.filter(
				(change) => change.type === 'remove'
			);

			if (removeChanges.length > 0) {
				// Handle node deletions using the server action
				for (const change of removeChanges) {
					try {
						const result = await deleteNodeAction(change.id);
						if (!result.success) {
							console.error(
								'Failed to delete node from database:',
								result.error
							);
							toast.error('Sync Error', {
								description:
									'Failed to delete node from database.',
							});
						} else {
							toast.success('Destination Deleted', {
								description:
									'The destination has been removed from your itinerary.',
							});
						}
					} catch (error) {
						console.error(
							'Error deleting node from database:',
							error
						);
						toast.error('Error', {
							description:
								'Could not delete destination from database.',
						});
					}
				}
			}

			// Apply changes locally for smooth UI
			setContextNodes((nds: Node<DestinationNodeData>[]) => {
				const updatedNodes = applyNodeChanges(
					changes,
					nds
				) as Node<DestinationNodeData>[];

				// Update global date constraints when nodes change
				updateGlobalDateConstraints(updatedNodes);

				return updatedNodes;
			});
		},
		[setContextNodes, updateGlobalDateConstraints]
	);

	// Handle node drag stop (persist final position)
	const onNodeDragStop = useCallback(
		(event: React.MouseEvent, node: Node) => {
			// Ensure position exists on the node object
			if (!node.position) {
				console.error('Node position not available on drag stop', node);
				return;
			}
			// Call server action with final position
			updateNodePositionAction(node.id, node.position).then(
				({ success, error }) => {
					if (!success) {
						console.error('Failed to update node position:', error);
						toast.error('Sync Error', {
							description: 'Failed to save node position.',
						});
					}
				}
			);
		},
		[] // No dependencies needed for this handler
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
			if (!connection.source || !connection.target) return;

			try {
				const result = await addEdgeAction(
					connection.source,
					connection.target,
					{}
				);

				if (result.error) {
					toast.error('Error Creating Connection', {
						description: result.error,
					});
				} else if (result.edge) {
					setEdges((eds: Edge[]) => addEdge(result.edge!, eds));
					toast.success('Connection Created', {
						description: 'Edge saved successfully.',
					});
				} else {
					throw new Error(
						'Server action did not return an edge or error.'
					);
				}
			} catch (error) {
				console.error('Failed to add edge:', error);
				toast.error('Error', {
					description: 'Could not create connection.',
				});
			}
		},
		[setEdges]
	);

	// Handle updates to node details (label, dates, etc.) from DestinationNode
	const updateNodeData = useCallback(
		async (nodeId: string, dataUpdate: Partial<DestinationNodeData>) => {
			// Optimistically update local state first
			setContextNodes((nds: Node<DestinationNodeData>[]) => {
				const updatedNodes = nds.map(
					(node: Node<DestinationNodeData>) =>
						node.id === nodeId
							? { ...node, data: { ...node.data, ...dataUpdate } }
							: node
				);

				// Update global date constraints when a node's data changes
				updateGlobalDateConstraints(updatedNodes);

				return updatedNodes;
			});

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
					toast.error('Sync Error', {
						description: 'Failed to save node details.',
					});
					// Optionally revert optimistic update here
				}
			} catch (error) {
				console.error('Error calling updateNodeDetailsAction:', error);
				toast.error('Error', {
					description: 'Could not save node details.',
				});
				// Optionally revert optimistic update here
			}
		},
		[setContextNodes, updateGlobalDateConstraints]
	);

	// Function to find connected nodes and their dates
	const getConnectedNodeDates = useCallback(
		(nodeId: string) => {
			// Find edges where this node is the source (outgoing)
			const outgoingEdges = edges.filter(
				(edge) => edge.source === nodeId
			);

			// Find edges where this node is the target (incoming)
			const incomingEdges = edges.filter(
				(edge) => edge.target === nodeId
			);

			// Find the previous nodes (connected to node's input)
			const prevNodes = incomingEdges
				.map((edge) =>
					contextNodes.find((node) => node.id === edge.source)
				)
				.filter(Boolean) as Node<DestinationNodeData>[];

			// Find the next nodes (connected to node's output)
			const nextNodes = outgoingEdges
				.map((edge) =>
					contextNodes.find((node) => node.id === edge.target)
				)
				.filter(Boolean) as Node<DestinationNodeData>[];

			// Get the latest end date from previous nodes
			let prevNodeEndDate: Date | undefined = undefined;
			if (prevNodes.length > 0) {
				const endDates = prevNodes
					.filter((node) => node.data.endDate)
					.map((node) =>
						node.data.endDate ? node.data.endDate.getTime() : 0
					);

				if (endDates.length > 0) {
					prevNodeEndDate = new Date(Math.max(...endDates));
				}
			}

			// Get the earliest start date from next nodes
			let nextNodeStartDate: Date | undefined = undefined;
			if (nextNodes.length > 0) {
				const startDates = nextNodes
					.filter((node) => node.data.startDate)
					.map((node) =>
						node.data.startDate
							? node.data.startDate.getTime()
							: Infinity
					);

				if (
					startDates.length > 0 &&
					!isFinite(Math.min(...startDates))
				) {
					nextNodeStartDate = undefined;
				} else if (startDates.length > 0) {
					nextNodeStartDate = new Date(Math.min(...startDates));
				}
			}

			return {
				prevNodeEndDate,
				nextNodeStartDate,
			};
		},
		[contextNodes, edges]
	);

	// Remove the 'as any' cast, hoping the refactor fixed the type issue
	const nodeTypes: NodeTypes = useMemo<NodeTypes>(
		() => ({
			destination: (props) => {
				// Get connected node dates
				const { prevNodeEndDate, nextNodeStartDate } =
					getConnectedNodeDates(props.id);

				return (
					<DestinationNode
						{...props}
						onDelete={(id) => handleNodeDelete(id)}
						prevNodeEndDate={prevNodeEndDate}
						nextNodeStartDate={nextNodeStartDate}
					/>
				);
			},
		}),
		[handleNodeDelete, getConnectedNodeDates]
	);

	// Remove the 'as any' cast for edgeTypes
	const edgeTypes: EdgeTypes = useMemo<EdgeTypes>(
		() => ({ custom: CustomEdge }),
		[]
	);

	// Confirm node deletion
	const confirmNodeDelete = useCallback(
		async (nodeId: string) => {
			try {
				const result = await deleteNodeAction(nodeId);

				if (result.success) {
					// Optimistically update local state to remove the node
					setContextNodes((nds) =>
						nds.filter((node) => node.id !== nodeId)
					);
					toast.success('Destination Deleted', {
						description:
							'The destination has been removed from your itinerary.',
					});
				} else {
					throw new Error(
						result.error || 'Failed to delete destination'
					);
				}
			} catch (error) {
				console.error('Error deleting node:', error);
				toast.error('Error', {
					description:
						'Could not delete destination. Please try again.',
				});
			} finally {
				setIsDeleteDialogOpen(false);
				setSelectedNodeId(null);
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
					onNodeDragStop={onNodeDragStop}
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
	onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
}

// NodeDelete component with confirmation dialog
interface NodeDeleteProps {
	nodeId: string | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (nodeId: string) => void;
}

const NodeDelete: React.FC<NodeDeleteProps> = ({
	nodeId,
	isOpen,
	onOpenChange,
	onSuccess,
}) => {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!nodeId) return;

		setIsDeleting(true);

		try {
			const result = await deleteNodeAction(nodeId);

			if (result.success) {
				toast.success(
					'The destination and its connections have been removed.'
				);
				onSuccess(nodeId);
			} else {
				toast.error(result.error || 'An unknown error occurred');
			}
		} catch (error) {
			console.error('Error during node deletion:', error);
			toast.error('Something went wrong. Please try again.');
		} finally {
			setIsDeleting(false);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Destination</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this destination? This
						will also remove all connections to and from this
						destination. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

const NodeSection = ({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	setNodes,
	onNodeDragStop,
}: NodeSectionProps) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const { getNode } = useReactFlow();
	const { getSuggestedDateRange } = useDateStore();

	// Handle node delete with confirmation
	const handleNodeDelete = useCallback((nodeId: string) => {
		setSelectedNodeId(nodeId);
		setIsDeleteDialogOpen(true);
	}, []);

	// Function to find connected nodes and their dates
	const getConnectedNodeDates = useCallback(
		(nodeId: string) => {
			// Find edges where this node is the source (outgoing)
			const outgoingEdges = edges.filter(
				(edge) => edge.source === nodeId
			);

			// Find edges where this node is the target (incoming)
			const incomingEdges = edges.filter(
				(edge) => edge.target === nodeId
			);

			// Find the previous nodes (connected to node's input)
			const prevNodes = incomingEdges
				.map((edge) => nodes.find((node) => node.id === edge.source))
				.filter(Boolean) as Node<DestinationNodeData>[];

			// Find the next nodes (connected to node's output)
			const nextNodes = outgoingEdges
				.map((edge) => nodes.find((node) => node.id === edge.target))
				.filter(Boolean) as Node<DestinationNodeData>[];

			// Get the latest end date from previous nodes
			let prevNodeEndDate: Date | undefined = undefined;
			if (prevNodes.length > 0) {
				const endDates = prevNodes
					.filter((node) => node.data.endDate)
					.map((node) =>
						node.data.endDate ? node.data.endDate.getTime() : 0
					);

				if (endDates.length > 0) {
					prevNodeEndDate = new Date(Math.max(...endDates));
				}
			}

			// Get the earliest start date from next nodes
			let nextNodeStartDate: Date | undefined = undefined;
			if (nextNodes.length > 0) {
				const startDates = nextNodes
					.filter((node) => node.data.startDate)
					.map((node) =>
						node.data.startDate
							? node.data.startDate.getTime()
							: Infinity
					);

				if (
					startDates.length > 0 &&
					!isFinite(Math.min(...startDates))
				) {
					nextNodeStartDate = undefined;
				} else if (startDates.length > 0) {
					nextNodeStartDate = new Date(Math.min(...startDates));
				}
			}

			return {
				prevNodeEndDate,
				nextNodeStartDate,
			};
		},
		[nodes, edges]
	);

	// Add keyboard event handler for Delete key
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Delete' && selectedNodeId) {
				// Prevent default to avoid direct node removal without confirmation
				event.preventDefault();
				// Show confirmation dialog instead
				setIsDeleteDialogOpen(true);
			}
		};

		// Add event listener
		window.addEventListener('keydown', handleKeyDown);

		// Clean up
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [selectedNodeId]);

	// Remove the 'as any' cast, hoping the refactor fixed the type issue
	const nodeTypes: NodeTypes = useMemo<NodeTypes>(
		() => ({
			destination: (props) => {
				// Get connected node dates
				const { prevNodeEndDate, nextNodeStartDate } =
					getConnectedNodeDates(props.id);

				return (
					<DestinationNode
						{...props}
						onDelete={(id) => handleNodeDelete(id)}
						prevNodeEndDate={prevNodeEndDate}
						nextNodeStartDate={nextNodeStartDate}
					/>
				);
			},
		}),
		[handleNodeDelete, getConnectedNodeDates]
	);

	// Remove the 'as any' cast for edgeTypes
	const edgeTypes: EdgeTypes = useMemo<EdgeTypes>(
		() => ({ custom: CustomEdge }),
		[]
	);

	// Update addNode to use the server action with simpler date handling
	const addNode = useCallback(async () => {
		const position = { x: Math.random() * 500, y: Math.random() * 300 };

		try {
			// Create a new node with default values (no dates)
			const result = await addNodeAction(position);

			if (result.error) {
				throw new Error(result.error);
			}

			if (result.node) {
				// Update context state with the node returned from the server action
				setNodes((nds) => nds.concat(result.node!));
				toast.success('New Destination Added', {
					description: 'Please add dates to this destination',
				});
			} else {
				console.error('Server action did not return a node.');
			}
		} catch (error) {
			console.error('Error adding node:', error);
			toast.error('Error', {
				description: 'Could not create new destination',
			});
		}
	}, [setNodes]);

	// Confirm node deletion
	const confirmNodeDelete = useCallback(
		async (nodeId: string) => {
			try {
				const result = await deleteNodeAction(nodeId);

				if (result.success) {
					// Optimistically update local state to remove the node
					setNodes((nds) => nds.filter((node) => node.id !== nodeId));
					toast.success('Destination Deleted', {
						description:
							'The destination has been removed from your itinerary.',
					});
				} else {
					throw new Error(
						result.error || 'Failed to delete destination'
					);
				}
			} catch (error) {
				console.error('Error deleting node:', error);
				toast.error('Error', {
					description:
						'Could not delete destination. Please try again.',
				});
			} finally {
				setIsDeleteDialogOpen(false);
				setSelectedNodeId(null);
			}
		},
		[setNodes]
	);

	return (
		<>
			<NodeDelete
				nodeId={selectedNodeId}
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				onSuccess={confirmNodeDelete}
			/>
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
							onNodeDragStop={onNodeDragStop}
							nodeTypes={nodeTypes}
							edgeTypes={edgeTypes}
							fitView
							fitViewOptions={{ padding: 0.2 }}
							attributionPosition='bottom-right'
							minZoom={0.4}
							maxZoom={1.5}
							defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
							onNodeContextMenu={(e, node) => {
								e.preventDefault();
								setSelectedNodeId(node.id);
							}}
							onSelectionChange={({ nodes }) => {
								// Set selectedNodeId to the first selected node, or null if none selected
								setSelectedNodeId(
									nodes.length > 0 ? nodes[0].id : null
								);
							}}
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
					{selectedNodeId && (
						<ContextMenuItem
							inset
							onSelect={() => handleNodeDelete(selectedNodeId)}
							className='text-destructive focus:text-destructive'
						>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Destination
						</ContextMenuItem>
					)}
				</ContextMenuContent>
			</ContextMenu>
		</>
	);
};

export default NodeSectionWrapper;
