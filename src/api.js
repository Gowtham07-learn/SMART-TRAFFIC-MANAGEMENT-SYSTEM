const BASE_URL = 'http://localhost:8000';

export const api = {
    get: async (path) => {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    },
    post: async (path, body) => {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        return res.json();
    },
};
