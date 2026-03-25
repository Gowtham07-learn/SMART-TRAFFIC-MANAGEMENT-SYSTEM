import { useState, useEffect } from 'react';
import { MOCK_JUNCTIONS, MOCK_STATS } from '../data/mockData';

export const useTrafficSimulation = () => {
    const [junctions, setJunctions] = useState(MOCK_JUNCTIONS);
    const [stats, setStats] = useState(MOCK_STATS);

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate signal timing countdowns
            setJunctions(prev => prev.map(j => {
                let newTime = j.timeRemaining - 1;
                let newSignal = j.signal;

                if (newTime <= 0) {
                    if (j.signal === 'Red') {
                        newSignal = 'Green';
                        newTime = 45;
                    } else if (j.signal === 'Green') {
                        newSignal = 'Yellow';
                        newTime = 5;
                    } else {
                        newSignal = 'Red';
                        newTime = 30;
                    }
                }

                // Simulate small vehicle count changes
                const vehicleDelta = Math.floor(Math.random() * 5) - 2;
                const newVehicles = Math.max(0, j.vehicles + vehicleDelta);

                return {
                    ...j,
                    signal: newSignal,
                    timeRemaining: newTime,
                    vehicles: newVehicles,
                    status: newVehicles > 40 ? 'congested' : newVehicles > 20 ? 'moderate' : 'smooth'
                };
            }));

            // Simulate slight stat changes
            setStats(prev => prev.map(s => {
                if (s.label === 'Current Congestion') {
                    const current = parseInt(s.value);
                    const delta = Math.floor(Math.random() * 3) - 1;
                    return { ...s, value: `${Math.max(10, Math.min(90, current + delta))}%` };
                }
                return s;
            }));

        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return { junctions, stats };
};
