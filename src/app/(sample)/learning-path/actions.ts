'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { LearningPath } from '@/lib/learning-path-schemas';
import { v4 as uuidv4 } from 'uuid';
import { generateFirstMessage } from '@/app/chat/[id]/actions';
export async function saveLearningPathToSupabase(
	learningPath: LearningPath,
	concept: string,
	gradeLevel: string,
	providedLearningPathId?: string
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const supabase = await createServerSupabaseClient();

		// Generate a UUID for the learning path or use the provided one
		const learningPathId = providedLearningPathId || uuidv4();

		// Calculate overall progress
		const totalNodes = learningPath.nodes.length;
		const totalProgress = learningPath.nodes.reduce(
			(sum, node) => sum + (node.progress || 0),
			0
		);
		const overallProgress =
			totalNodes > 0 ? Math.round(totalProgress / totalNodes) : 0;

		// 1. Insert the learning path
		const { error: learningPathError } = await supabase
			.from('LearningPath')
			.insert({
				id: learningPathId,
				user_id: userId,
				title: learningPath.title,
				description: learningPath.description,
				concept: concept,
				grade_level: gradeLevel,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				overall_progress: overallProgress,
			});

		if (learningPathError) {
			throw new Error(
				`Error saving learning path: ${learningPathError.message}`
			);
		}

		// 2. Insert the nodes
		const nodesData = learningPath.nodes.map((node, index) => ({
			id: node.id,
			learning_path_id: learningPathId,
			concept: node.concept,
			description: node.description,
			difficulty: node.difficulty,
			position_x: node.position.x,
			position_y: node.position.y,
			progress: node.progress || 0,
			grade: node.grade,
		}));

		const { error: nodesError } = await supabase
			.from('LearningPathNode')
			.insert(nodesData);

		if (nodesError) {
			throw new Error(
				`Error saving learning path nodes: ${nodesError.message}`
			);
		}

		// 3. Insert the edges
		const edgesData = learningPath.edges.map((edge) => ({
			id: edge.id,
			learning_path_id: learningPathId,
			source: edge.source,
			target: edge.target,
			type: edge.type,
		}));

		const { error: edgesError } = await supabase
			.from('LearningPathEdge')
			.insert(edgesData);

		if (edgesError) {
			throw new Error(
				`Error saving learning path edges: ${edgesError.message}`
			);
		}

		// Revalidate the learning path page
		revalidatePath('/learning-path');

		return {
			success: true,
			learningPathId,
		};
	} catch (error) {
		console.error('Error saving learning path to Supabase:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getUserLearningPaths() {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const supabase = await createServerSupabaseClient();

		const { data: learningPaths, error } = await supabase
			.from('LearningPath')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Error fetching learning paths: ${error.message}`);
		}

		return {
			success: true,
			learningPaths,
		};
	} catch (error) {
		console.error('Error fetching learning paths:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getLearningPathDetails(learningPathId: string) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return {
				success: false,
				error: 'User not authenticated',
			};
		}

		const supabase = await createServerSupabaseClient();

		// 1. Get the learning path
		const { data: learningPath, error: learningPathError } = await supabase
			.from('LearningPath')
			.select('*')
			.eq('id', learningPathId)
			.eq('user_id', userId)
			.single();

		if (learningPathError) {
			return {
				success: false,
				error: `Error fetching learning path: ${learningPathError.message}`,
			};
		}

		// 2. Get the nodes
		const { data: nodes, error: nodesError } = await supabase
			.from('LearningPathNode')
			.select('*')
			.eq('learning_path_id', learningPathId)
			.order('id');

		if (nodesError) {
			return {
				success: false,
				error: `Error fetching learning path nodes: ${nodesError.message}`,
			};
		}

		// Log the raw node data from the database
		console.log('Raw node data from database:', nodes);

		// 3. Get the edges
		const { data: edges, error: edgesError } = await supabase
			.from('LearningPathEdge')
			.select('*')
			.eq('learning_path_id', learningPathId);

		if (edgesError) {
			return {
				success: false,
				error: `Error fetching learning path edges: ${edgesError.message}`,
			};
		}

		// 4. Format the data
		const formattedNodes = nodes.map((node) => ({
			id: node.id,
			concept: node.concept,
			description: node.description,
			difficulty: node.difficulty,
			position: {
				x: node.position_x,
				y: node.position_y,
			},
			progress: node.progress || 0,
			grade: node.grade,
			is_active: node.is_active || false,
			chat_id: node.chat_id || null,
		}));

		// Log the formatted nodes
		console.log('Formatted nodes:', formattedNodes);

		const formattedEdges = edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			type: edge.type,
		}));

		return {
			success: true,
			learningPath: {
				id: learningPath.id,
				title: learningPath.title,
				description: learningPath.description,
				concept: learningPath.concept,
				grade_level: learningPath.grade_level,
				created_at: learningPath.created_at,
				updated_at: learningPath.updated_at,
				overall_progress: learningPath.overall_progress,
				nodes: formattedNodes,
				edges: formattedEdges,
			},
		};
	} catch (error) {
		console.error('Error in getLearningPathDetails:', error);
		return {
			success: false,
			error: 'An unexpected error occurred',
		};
	}
}

export async function updateLearningPathNodeProgress(
	nodeId: string,
	progress: number
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const supabase = await createServerSupabaseClient();

		// First, get the node to find its learning path ID
		const { data: node, error: nodeError } = await supabase
			.from('LearningPathNode')
			.select('learning_path_id')
			.eq('id', nodeId)
			.single();

		if (nodeError) {
			throw new Error(`Error fetching node: ${nodeError.message}`);
		}

		const learningPathId = node.learning_path_id;

		// Update the node's progress
		const { error: updateError } = await supabase
			.from('LearningPathNode')
			.update({ progress })
			.eq('id', nodeId);

		if (updateError) {
			throw new Error(
				`Error updating node progress: ${updateError.message}`
			);
		}

		// Get all nodes for this learning path to update active status
		const { data: nodes, error: nodesError } = await supabase
			.from('LearningPathNode')
			.select('*')
			.eq('learning_path_id', learningPathId)
			.order('id');

		if (nodesError) {
			throw new Error(`Error fetching nodes: ${nodesError.message}`);
		}

		// Update active status for all nodes
		// First node is always active
		// Other nodes are active only if the previous node has progress >= 75%
		for (let i = 0; i < nodes.length; i++) {
			const isActive =
				i === 0 || (i > 0 && (nodes[i - 1].progress || 0) >= 75);

			await supabase
				.from('LearningPathNode')
				.update({ is_active: isActive })
				.eq('id', nodes[i].id);
		}

		// Calculate overall progress
		const totalNodes = nodes.length;
		const totalProgress = nodes.reduce(
			(sum, node) => sum + (node.progress || 0),
			0
		);
		const overallProgress =
			totalNodes > 0 ? Math.round(totalProgress / totalNodes) : 0;

		// Update the learning path's overall progress and updated_at timestamp
		const { error: pathUpdateError } = await supabase
			.from('LearningPath')
			.update({
				overall_progress: overallProgress,
				updated_at: new Date().toISOString(),
			})
			.eq('id', learningPathId);

		if (pathUpdateError) {
			throw new Error(
				`Error updating learning path: ${pathUpdateError.message}`
			);
		}

		// Revalidate the learning path pages to refresh data
		revalidatePath('/learning-path');
		revalidatePath(`/learning-path/${learningPathId}`);

		return {
			success: true,
			learningPathId,
		};
	} catch (error) {
		console.error('Error updating node progress:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function deleteLearningPath(learningPathId: string) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const supabase = await createServerSupabaseClient();

		// First, get all chats associated with this learning path
		const { data: chats, error: chatsError } = await supabase
			.from('Chat')
			.select('id')
			.eq('learning_path_id', learningPathId)
			.eq('user_id', userId);

		if (chatsError) {
			console.error('Error finding associated chats:', chatsError);
		} else if (chats && chats.length > 0) {
			// Delete all messages for these chats
			const chatIds = chats.map((chat) => chat.id);

			// Delete chat messages
			const { error: messagesError } = await supabase
				.from('ChatMessage')
				.delete()
				.in('chat_id', chatIds);

			if (messagesError) {
				console.error('Error deleting chat messages:', messagesError);
			}

			// Delete the chats
			const { error: chatsDeletionError } = await supabase
				.from('Chat')
				.delete()
				.in('id', chatIds);

			if (chatsDeletionError) {
				console.error('Error deleting chats:', chatsDeletionError);
			}
		}

		// Now update the Concept table to clear chat_id for any concepts linked to this learning path
		const { error: conceptUpdateError } = await supabase
			.from('Concept')
			.update({ chat_id: null })
			.eq('user_id', userId)
			.eq('learning_path_id', learningPathId);

		if (conceptUpdateError) {
			console.error('Error updating concepts:', conceptUpdateError);
		}

		// Delete the learning path (cascade will delete nodes and edges)
		const { error } = await supabase
			.from('LearningPath')
			.delete()
			.eq('id', learningPathId)
			.eq('user_id', userId);

		if (error) {
			throw new Error(`Error deleting learning path: ${error.message}`);
		}

		// Revalidate the learning path page
		revalidatePath('/learning-path');

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error deleting learning path:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function checkConceptActive(nodeId: string) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const supabase = await createServerSupabaseClient();

		// Check if the learning path node exists and has a chat_id
		const { data, error } = await supabase
			.from('LearningPathNode')
			.select('id, chat_id, is_active')
			.eq('id', nodeId)
			.single();

		if (error) {
			// If the node doesn't exist, it's not active
			if (error.code === 'PGRST116') {
				// PostgreSQL not found error
				return {
					success: true,
					isActive: false,
					chatId: null,
				};
			}
			throw new Error(`Error checking node: ${error.message}`);
		}

		return {
			success: true,
			isActive: data.is_active && data.chat_id !== null,
			chatId: data.chat_id,
		};
	} catch (error) {
		console.error('Error checking if node is active:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			isActive: false,
			chatId: null,
		};
	}
}

export async function createChatFromLearningPathNode(
	node: {
		id: string;
		concept: string;
		description: string;
		learningPathId?: string; // Optional learning path ID
	},
	chatId: string,
	shouldRedirect: boolean = false
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const supabase = await createServerSupabaseClient();

		// First, check if the learning path node already has a chat associated with it
		const { data: existingNode, error: nodeError } = await supabase
			.from('LearningPathNode')
			.select('id, chat_id, is_active')
			.eq('id', node.id)
			.single();

		// If the node exists and has a chat, return that chat ID
		if (existingNode && existingNode.chat_id) {
			return {
				success: true,
				chatId: existingNode.chat_id,
				message: 'Using existing chat for this node',
			};
		}

		// Get the learning path ID for this node if not provided
		let learningPathId = node.learningPathId;
		if (!learningPathId && existingNode) {
			// Try to find the learning path ID from the node
			const { data: nodeData, error: lpNodeError } = await supabase
				.from('LearningPathNode')
				.select('learning_path_id')
				.eq('id', node.id)
				.single();

			if (!lpNodeError && nodeData) {
				learningPathId = nodeData.learning_path_id;
			}
		}

		// Create a Chat entry that references the learning path node
		const { data: chatData, error: chatError } = await supabase
			.from('Chat')
			.insert({
				id: chatId,
				description: node.description,
				title: node.concept,
				created_at: new Date().toISOString(),
				user_id: userId,
				// Add learning path references
				learning_path_id: learningPathId || null,
				learning_path_node_id: node.id,
			})
			.select()
			.single();

		if (chatError) {
			throw new Error(`Error creating chat: ${chatError.message}`);
		}

		// Update the LearningPathNode with the chat_id and set is_active to true
		console.log('Updating LearningPathNode with chat_id and is_active:', {
			node_id: node.id,
			chat_id: chatData.id,
		});

		const { error: nodeUpdateError } = await supabase
			.from('LearningPathNode')
			.update({
				chat_id: chatData.id,
				is_active: true,
			})
			.eq('id', node.id);

		if (nodeUpdateError) {
			console.error(
				`Warning: Failed to update node with chat ID: ${nodeUpdateError.message}`
			);
			// Continue execution even if this fails
		} else {
			console.log(
				'Successfully updated LearningPathNode with chat_id and is_active'
			);
		}

		// Generate the first message for the chat
		await generateFirstMessage(node.concept, node.description, chatId);

		// Return success with the chat ID
		return {
			success: true,
			chatId,
		};
	} catch (error) {
		console.error('Error creating chat from learning path node:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
