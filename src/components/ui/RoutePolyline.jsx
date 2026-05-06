import React, { useState, useEffect } from 'react';
import { Polyline } from 'react-leaflet';

export function RoutePolyline({ junctions, pathOptions }) {
    const [routeGeometry, setRouteGeometry] = useState([]);
    
    // Default straight lines connecting junctions
    const defaultPositions = junctions.map(j => [j.latitude, j.longitude]);

    useEffect(() => {
        if (!junctions || junctions.length < 2) {
            setRouteGeometry([]);
            return;
        }
        
        // Only re-fetch if the junctions actually change (by ID)
        const junctionIds = junctions.map(j => j.id).join(',');
        const coords = junctions.map(j => `${j.longitude},${j.latitude}`).join(';');
        
        fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const geometry = data.routes[0].geometry.coordinates;
                    // OSRM returns [lon, lat], Leaflet needs [lat, lon]
                    setRouteGeometry(geometry.map(coord => [coord[1], coord[0]]));
                }
            })
            .catch(console.error);
    }, [junctions.map(j => j.id).join(',')]); // Stable dependency

    const positions = routeGeometry.length > 0 ? routeGeometry : defaultPositions;

    return <Polyline positions={positions} pathOptions={pathOptions} />;
}
