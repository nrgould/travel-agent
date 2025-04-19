'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { Node, Edge } from '@xyflow/react';
import { DestinationNodeData } from '@/components/DestinationNode';

// Define interfaces for the raw Supabase data shapes if needed for clarity
interface SupabaseNode {
	id: string;
	name: string;
	position: { x: number; y: number };
	// Add other fields matching the 'nodes' table schema
	label?: string; // Assuming label maps to name
	startDate?: string; // Store dates as ISO strings in DB?
	endDate?: string;
	// Add other potential fields from DestinationNodeData if they map to DB columns
}

interface SupabaseEdge {
	id: string;
	source_node_id: string;
	target_node_id: string;
	type: 'plane' | 'train' | 'bus' | null;
	duration: string | null;
	// Add other fields as necessary from your schema
}

// Simpler type for edge data needed for insertion
interface EdgeDataForInsert {
	type?: 'plane' | 'train' | 'bus' | null;
	duration?: string | null;
}

interface FlowData {
	nodes: Node<DestinationNodeData>[];
	edges: Edge[];
}

export async function getFlowData(): Promise<FlowData> {
	const supabase = await createServerSupabaseClient();

	try {
		// Fetch nodes
		const { data: nodesData, error: nodesError } = await supabase
			.from('nodes')
			.select('id, name, position');

		if (nodesError) throw nodesError;

		// Fetch edges
		const { data: edgesData, error: edgesError } = await supabase
			.from('edges')
			.select('id, source_node_id, target_node_id, type, duration');

		if (edgesError) throw edgesError;

		// Type assertion (consider using generated types later if complex)
		const typedNodes = (nodesData || []) as SupabaseNode[];
		const typedEdges = (edgesData || []) as SupabaseEdge[];

		// Transform nodesData to React Flow Node format
		const formattedNodes: Node<DestinationNodeData>[] = typedNodes.map(
			(node) => ({
				id: node.id,
				position: node.position,
				data: {
					label: node.name,
					// Add other necessary fields from DestinationNodeData with defaults or fetched values
				},
				type: 'destination',
			})
		);

		// Transform edgesData to React Flow Edge format
		const formattedEdges: Edge[] = typedEdges.map((edge) => ({
			id: edge.id,
			source: edge.source_node_id,
			target: edge.target_node_id,
			type: 'custom',
			data: {
				type: edge.type,
				duration: edge.duration,
			},
		}));

		return { nodes: formattedNodes, edges: formattedEdges };
	} catch (error) {
		console.error('Error fetching flow data in server action:', error);
		// Return empty arrays or re-throw error based on desired handling
		return { nodes: [], edges: [] };
	}
}

// Server action for adding a node
export async function addNodeAction(position: { x: number; y: number }) {
	const supabase = await createServerSupabaseClient();
	const newNodeData = {
		name: 'New Destination',
		position: position,
	};

	try {
		const { data, error } = await supabase
			.from('nodes')
			.insert(newNodeData)
			.select('id, name, position')
			.single();

		if (error) {
			console.error('Error inserting node:', error);
			return { error: error.message };
		}

		// Transform to React Flow node format before returning
		if (data) {
			const typedNode = data as SupabaseNode;
			const reactFlowNode: Node<DestinationNodeData> = {
				id: typedNode.id,
				position: typedNode.position,
				data: {
					label: typedNode.name,
					description: 'Add details here',
					type: 'city',
				},
				type: 'destination',
			};
			return { node: reactFlowNode };
		}
		return { error: 'Failed to add node, no data returned.' };
	} catch (error: unknown) {
		console.error('Error in addNodeAction:', error);
		const message =
			error instanceof Error
				? error.message
				: 'An unknown error occurred';
		return { error: message };
	}
}

// Server action to update node position
export async function updateNodePositionAction(
	nodeId: string,
	position: { x: number; y: number }
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createServerSupabaseClient();

	try {
		const { error } = await supabase
			.from('nodes')
			.update({ position, updated_at: new Date().toISOString() })
			.eq('id', nodeId);

		if (error) {
			console.error('Error updating node position:', error);
			return { success: false, error: error.message };
		}
		return { success: true };
	} catch (error: unknown) {
		console.error('Error in updateNodePositionAction:', error);
		const message =
			error instanceof Error
				? error.message
				: 'An unknown error occurred';
		return {
			success: false,
			error: message,
		};
	}
}

// Server action to update node details (label, dates, etc.)
export async function updateNodeDetailsAction(
	nodeId: string,
	dataUpdate: Partial<SupabaseNode> // Type more specifically
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createServerSupabaseClient();

	// Prepare the update object
	// Explicitly type as Record<string, any> since we modify keys
	const updateObject: Record<string, any> = {
		...dataUpdate,
		updated_at: new Date().toISOString(),
	};

	// Map frontend 'label' to backend 'name' if necessary
	if ('label' in updateObject) {
		updateObject.name = updateObject.label;
		delete updateObject.label;
	}
	// Handle date conversion if stored differently (e.g., Date to ISO string)
	if (updateObject.startDate instanceof Date) {
		updateObject.startDate = updateObject.startDate.toISOString();
	}
	if (updateObject.endDate instanceof Date) {
		updateObject.endDate = updateObject.endDate.toISOString();
	}

	// Remove any fields not actually in the DB schema before updating
	// delete updateObject.someFieldNotInNodesTable;

	try {
		const { error } = await supabase
			.from('nodes')
			.update(updateObject)
			.eq('id', nodeId);

		if (error) {
			console.error('Error updating node details:', error);
			return { success: false, error: error.message };
		}
		return { success: true };
	} catch (error: unknown) {
		console.error('Error in updateNodeDetailsAction:', error);
		const message =
			error instanceof Error
				? error.message
				: 'An unknown error occurred';
		return {
			success: false,
			error: message,
		};
	}
}

// Server action for adding an edge
export async function addEdgeAction(
	sourceId: string,
	targetId: string,
	data: EdgeDataForInsert // Use the simpler interface
): Promise<{ edge?: Edge; error?: string }> {
	const supabase = await createServerSupabaseClient();

	const newEdgeData = {
		source_node_id: sourceId,
		target_node_id: targetId,
		type: data.type || null,
		duration: data.duration || null,
	};

	try {
		const { data: insertedData, error } = await supabase
			.from('edges')
			.insert(newEdgeData)
			.select('id, source_node_id, target_node_id, type, duration') // Select generated ID + other fields
			.single();

		if (error) {
			// Handle potential unique constraint violation (duplicate edge)
			if (error.code === '23505') {
				// Postgres unique violation code
				console.warn('Attempted to add duplicate edge:', error.message);
				return {
					error: 'An edge already exists between these destinations.',
				};
			}
			console.error('Error inserting edge:', error);
			return { error: error.message };
		}

		if (insertedData) {
			const typedEdge = insertedData as SupabaseEdge;
			// Transform to React Flow edge format
			const reactFlowEdge: Edge = {
				id: typedEdge.id,
				source: typedEdge.source_node_id,
				target: typedEdge.target_node_id,
				type: 'custom',
				data: {
					type: typedEdge.type,
					duration: typedEdge.duration,
				},
			};
			return { edge: reactFlowEdge };
		}
		return { error: 'Failed to add edge, no data returned.' };
	} catch (error: unknown) {
		console.error('Error in addEdgeAction:', error);
		const message =
			error instanceof Error
				? error.message
				: 'An unknown error occurred';
		return { error: message };
	}
}
