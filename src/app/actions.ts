'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { Node, Edge } from '@xyflow/react';
import { DestinationNodeData } from '@/components/DestinationNode';

// Define interfaces for the raw Supabase data shapes if needed for clarity
interface SupabaseNode {
	id: string;
	name: string;
	position: { x: number; y: number };
	metadata?: Record<string, any>;
	description?: string;
	type?: 'city' | 'landmark' | 'attraction';
	updated_at?: string;
	start_date?: string; // ISO string format for timestamptz
	end_date?: string; // ISO string format for timestamptz
	// Map frontend to backend field names
	label?: string; // Maps to name
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
			.select(
				'id, name, position, metadata, description, type, start_date, end_date'
			);

		if (nodesError) throw nodesError;

		// Fetch edges
		const { data: edgesData, error: edgesError } = await supabase
			.from('edges')
			.select('id, source_node_id, target_node_id, type, duration');

		if (edgesError) throw edgesError;

		console.log('nodesData', nodesData);
		console.log('edgesData', edgesData);

		// Type assertion (consider using generated types later if complex)
		const typedNodes = (nodesData || []) as SupabaseNode[];
		const typedEdges = (edgesData || []) as SupabaseEdge[];

		// Transform nodesData to React Flow Node format
		const formattedNodes: Node<DestinationNodeData>[] = typedNodes.map(
			(node) => {
				// Parse dates from the dedicated timestamp columns
				let startDate = undefined;
				let endDate = undefined;

				if (node.start_date) {
					startDate = new Date(node.start_date);
				}

				if (node.end_date) {
					endDate = new Date(node.end_date);
				}

				return {
					id: node.id,
					position: node.position,
					data: {
						label: node.name,
						description: node.description,
						type: node.type,
						startDate: startDate,
						endDate: endDate,
					},
					type: 'destination',
				};
			}
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
export async function addNodeAction(
	position: { x: number; y: number },
	additionalData?: {
		startDate?: string;
		endDate?: string;
		[key: string]: any;
	}
) {
	const supabase = await createServerSupabaseClient();
	const newNodeData = {
		name: 'New Destination',
		position: position,
		description: 'Add details here',
		type: 'city' as const,
		metadata: {},
		start_date: additionalData?.startDate,
		end_date: additionalData?.endDate,
	};

	try {
		const { data, error } = await supabase
			.from('nodes')
			.insert(newNodeData)
			.select(
				'id, name, position, description, type, metadata, start_date, end_date'
			)
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
					description: typedNode.description || 'Add details here',
					type: typedNode.type || 'city',
					startDate: typedNode.start_date
						? new Date(typedNode.start_date)
						: undefined,
					endDate: typedNode.end_date
						? new Date(typedNode.end_date)
						: undefined,
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
	dataUpdate: Partial<SupabaseNode>
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createServerSupabaseClient();

	// Prepare the update object
	const updateObject: Record<string, any> = {
		...dataUpdate,
		updated_at: new Date().toISOString(),
	};

	// Map frontend 'label' to backend 'name' if necessary
	if ('label' in updateObject) {
		updateObject.name = updateObject.label;
		delete updateObject.label;
	}

	// Handle date conversion for dedicated timestamp columns
	if ('startDate' in updateObject) {
		if (updateObject.startDate instanceof Date) {
			updateObject.start_date = updateObject.startDate.toISOString();
		} else if (updateObject.startDate) {
			updateObject.start_date = updateObject.startDate;
		} else {
			updateObject.start_date = null; // Allow clearing the date
		}
		delete updateObject.startDate;
	}

	if ('endDate' in updateObject) {
		if (updateObject.endDate instanceof Date) {
			updateObject.end_date = updateObject.endDate.toISOString();
		} else if (updateObject.endDate) {
			updateObject.end_date = updateObject.endDate;
		} else {
			updateObject.end_date = null; // Allow clearing the date
		}
		delete updateObject.endDate;
	}

	// Make sure we only include fields that exist in the database schema
	const validFields = [
		'name',
		'position',
		'metadata',
		'description',
		'type',
		'updated_at',
		'start_date',
		'end_date',
	];
	const filteredUpdate = Object.fromEntries(
		Object.entries(updateObject).filter(([key]) =>
			validFields.includes(key)
		)
	);

	try {
		const { error } = await supabase
			.from('nodes')
			.update(filteredUpdate)
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

// Server action to delete a node
export async function deleteNodeAction(
	nodeId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createServerSupabaseClient();

	try {
		// First, delete any associated edges where this node is a source
		const { error: sourceEdgesError } = await supabase
			.from('edges')
			.delete()
			.eq('source_node_id', nodeId);

		if (sourceEdgesError) {
			console.error('Error deleting source edges:', sourceEdgesError);
			return { success: false, error: sourceEdgesError.message };
		}

		// Then delete edges where this node is a target
		const { error: targetEdgesError } = await supabase
			.from('edges')
			.delete()
			.eq('target_node_id', nodeId);

		if (targetEdgesError) {
			console.error('Error deleting target edges:', targetEdgesError);
			return { success: false, error: targetEdgesError.message };
		}

		// Finally delete the node
		const { error: nodeError } = await supabase
			.from('nodes')
			.delete()
			.eq('id', nodeId);

		if (nodeError) {
			console.error('Error deleting node:', nodeError);
			return { success: false, error: nodeError.message };
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('Error in deleteNodeAction:', error);
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
