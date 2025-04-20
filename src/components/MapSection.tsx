'use client';

import React from 'react';
import {
	ComposableMap,
	Geographies,
	Geography,
	ZoomableGroup,
} from 'react-simple-maps';

// Using a reliable GeoJSON source
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const MapSection = () => {
	return (
		<div className='w-full h-full flex items-center justify-center'>
			<ComposableMap
				projection='geoEqualEarth'
				projectionConfig={{
					scale: 200,
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
									fill='#D6D6DA'
									stroke='#FFFFFF'
									className='fill-muted-foreground/20 stroke-border hover:fill-muted-foreground/40 cursor-pointer'
									style={{
										default: { outline: 'none' },
										hover: { outline: 'none' },
										pressed: { outline: 'none' },
									}}
								/>
							))
						}
					</Geographies>
				</ZoomableGroup>
			</ComposableMap>
		</div>
	);
};

export default MapSection;
