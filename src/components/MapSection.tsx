'use client';

import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl =
	'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

const MapSection = () => {
	return (
		<div className='w-full h-full border overflow-hidden'>
			<ComposableMap>
				<Geographies geography={geoUrl}>
					{({ geographies }) =>
						geographies.map((geo) => (
							<Geography
								key={geo.rsmKey}
								geography={geo}
								className='fill-muted-foreground/20 stroke-background outline-none'
							/>
						))
					}
				</Geographies>
			</ComposableMap>
		</div>
	);
};

export default MapSection;
