// Vercel serverless function for school menu API
import https from 'https';

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { mealType, date } = req.query;
        
        if (!mealType || !date) {
            res.status(400).json({ error: 'Missing mealType or date parameter' });
            return;
        }

        // Convert date format from YYYY-MM-DD to YYYY/MM/DD for API
        const apiDate = date.replace(/-/g, '/');
        
        const baseUrl = 'https://jordandistrict.api.nutrislice.com/menu/api/weeks/school/rosamond/menu-type';
        const apiUrl = `${baseUrl}/${mealType}/${apiDate}`;
        
        console.log(`Fetching: ${apiUrl}`);
        
        const data = await httpsGet(apiUrl);
        res.status(200).json(data);
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to fetch menu data' });
    }
}