'use client';

import React from 'react';
import {
	ComposableMap,
	Geographies,
	Geography,
	ZoomableGroup,
	Marker,
} from 'react-simple-maps';
import { useNodeContext } from './NodeContext';

// Using a reliable GeoJSON source
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Sample coordinates mapping for demonstration - in a real app,
// you would fetch these from an API or database
const cityCoordinates: Record<string, [number, number]> = {
	Munich: [11.582, 48.1351],
	Vienna: [16.3738, 48.2082],
	Prague: [14.4378, 50.0755],
	'Neuschwanstein Castle': [10.7498, 47.5575],
	Salzburg: [13.055, 47.8095],
	Berlin: [13.405, 52.52],
	Paris: [2.3522, 48.8566],
	London: [0.1278, 51.5074],
	Rome: [12.4964, 41.9028],
	Barcelona: [2.1734, 41.3851],
	Amsterdam: [4.9041, 52.3676],
	Budapest: [19.0402, 47.4979],
	Zurich: [8.5417, 47.3769],
	Frankfurt: [8.6821, 50.1109],
	'New York': [-74.006, 40.7128],
	Tokyo: [139.6917, 35.6895],
	Sydney: [151.2093, -33.8688],
	Cairo: [31.2357, 30.0444],
	Dubai: [55.2708, 25.2048],
	Istanbul: [28.9784, 41.0082],
	'New Destination': [0, 0],
};

const MapSection = () => {
	const { nodes } = useNodeContext();

	return (
		<div className='w-full h-full'>
			<ComposableMap
				projection='geoEquirectangular'
				projectionConfig={{
					scale: 110,
				}}
				style={{
					width: '100%',
					height: '100%',
				}}
			>
				<ZoomableGroup>
					<Geographies geography={geoUrl}>
						{({ geographies }) =>
							geographies.map((geo) => (
								<Geography
									key={geo.rsmKey}
									geography={geo}
									className='fill-muted-foreground/10 stroke-border/40 hover:fill-muted-foreground/40 cursor-pointer transition-colors duration-200'
									style={{
										default: { outline: 'none' },
										hover: {
											outline: 'none',
											fill: 'currentColor',
										},
										pressed: { outline: 'none' },
									}}
								/>
							))
						}
					</Geographies>

					{/* Map the nodes to markers */}
					{nodes.map((node) => {
						const coordinates = cityCoordinates[
							node.data.label
						] || [0, 0];
						return (
							<Marker key={node.id} coordinates={coordinates}>
								<circle
									r={2}
									fill='#000'
									strokeWidth={0.5}
									stroke='white'
								/>
							</Marker>
						);
					})}
				</ZoomableGroup>
			</ComposableMap>
		</div>
	);
};

export default MapSection;
