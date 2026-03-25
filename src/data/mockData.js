export const MOCK_JUNCTIONS = [
    { id: 'j1', name: 'PSG Tech Main Gate', status: 'congested', type: 'intersection', vehicles: 45, speed: 22, signal: 'Red', timeRemaining: 12, coords: [11.0247, 77.0030] },
    { id: 'j2', name: 'Peelamedu Signal', status: 'smooth', type: 'bridge', vehicles: 12, speed: 48, signal: 'Green', timeRemaining: 45, coords: [11.0260, 77.0040] },
    { id: 'j3', name: 'HOPES College Signal', status: 'moderate', type: 'plaza', vehicles: 28, speed: 35, signal: 'Yellow', timeRemaining: 3, coords: [11.0280, 77.0120] },
    { id: 'j4', name: 'Nava India Junction', status: 'congested', type: 'intersection', vehicles: 52, speed: 18, signal: 'Red', timeRemaining: 28, coords: [11.0180, 76.9920] },
    { id: 'j5', name: 'Fun Republic Mall Road', status: 'smooth', type: 'tunnel', vehicles: 8, speed: 55, signal: 'Green', timeRemaining: 60, coords: [11.0270, 77.0150] },
];

export const MOCK_STATS = [
    { label: 'Total Active Junctions', value: '124', change: '+2', trend: 'up' },
    { label: 'Current Congestion', value: '32%', change: '-5%', trend: 'down' },
    { label: 'Emergency Vehicles', value: '4', change: 'Active', trend: 'neutral' },
    { label: 'Avg Travel Time', value: '18 min', change: '+1.2 min', trend: 'up' },
    { label: 'CO₂ Saved', value: '1,240 kg', change: '+12%', trend: 'up' },
];

export const MOCK_CHART_DATA = [
    { time: '08:00', volume: 420 },
    { time: '10:00', volume: 380 },
    { time: '12:00', volume: 450 },
    { time: '14:00', volume: 520 },
    { time: '16:00', volume: 680 },
    { time: '18:00', volume: 720 },
    { time: '20:00', volume: 480 },
    { time: '22:00', volume: 320 },
];

export const MOCK_HEALTH = [
    { name: 'Edge Camera Node A1', status: 'operational', load: '12%', uptime: '99.9%' },
    { name: 'Edge Camera Node A2', status: 'operational', load: '15%', uptime: '99.8%' },
    { name: 'Traffic Sensor S-12', status: 'warning', load: '85%', uptime: '94.2%' },
    { name: 'AI Prediction Module', status: 'operational', load: '42%', uptime: '100%' },
    { name: 'Database Cluster', status: 'operational', load: '28%', uptime: '99.99%' },
    { name: 'API Gateway', status: 'operational', load: '18%', uptime: '99.95%' },
];
