// server.js - Simple Node.js server to proxy the API calls
const express = require('express');
const https = require('https');
const cors = require('cors'); // npm install cors

const app = express();
app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Helper function to make HTTPS requests
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        }).on('error', reject);
    });
}

// API endpoint to get school menu
app.get('/api/menu/:mealType/:date', async (req, res) => {
    try {
        const { mealType, date } = req.params;
        // Convert date from 2025-10-07 to 2025/10/07 format for the API
        const apiDate = date.replace(/-/g, '/');
        const url = `https://jordandistrict.api.nutrislice.com/menu/api/weeks/school/rosamond/menu-type/${mealType}/${apiDate}`;
        
        console.log(`Fetching: ${url}`);
        const data = await httpsGet(url);
        
        console.log(`✅ Successfully fetched ${mealType} menu for ${date}`);
        res.json(data);
        
    } catch (error) {
        console.error('❌ Error fetching menu:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});