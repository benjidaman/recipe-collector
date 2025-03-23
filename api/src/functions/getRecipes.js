const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

app.http('getRecipes', {
    methods: ['GET', 'OPTIONS'], // Add OPTIONS for CORS preflight
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS preflight request
        const origin = request.headers.get('Origin') || '*';
        const allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:8080', 'https://brave-island-070dd7e10.6.azurestaticapps.net'];
        const corsOrigin = allowedOrigins.includes(origin) ? origin : '*';

        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                },
                body: ''
            };
        }

        try {
            const client = new CosmosClient({
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY
            });
            const database = client.database('RecipesDB');
            const container = database.container('Recipes');

            const { resources } = await container.items.readAll().fetchAll();

            return {
                status: 200,
                body: JSON.stringify(resources),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin
                }
            };
        } catch (error) {
            return {
                status: 500,
                body: `Error fetching recipes: ${error.message}`,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin
                }
            };
        }
    }
});