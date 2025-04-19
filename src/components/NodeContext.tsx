'use client';

import React, { createContext, useContext, useState } from 'react';
import { Node } from '@xyflow/react';
import { DestinationNodeData } from './DestinationNode';

interface NodeContextType {
	nodes: Node<DestinationNodeData>[];
	setNodes: React.Dispatch<React.SetStateAction<Node<DestinationNodeData>[]>>;
}

const NodeContext = createContext<NodeContextType | null>(null);

export const useNodeContext = (): NodeContextType => {
	const context = useContext(NodeContext);
	if (!context) {
		throw new Error('useNodeContext must be used within a NodeProvider');
	}
	return context;
};

export const NodeProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const [nodes, setNodes] = useState<Node<DestinationNodeData>[]>([]);

	return (
		<NodeContext.Provider value={{ nodes, setNodes }}>
			{children}
		</NodeContext.Provider>
	);
};

export default NodeProvider;
