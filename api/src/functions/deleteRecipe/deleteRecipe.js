const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

app.http('deleteRecipe', {
    methods: ['POST', 'OPTIONS'],
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
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                },
                body: ''
            };
        }

        try {
            // Parse the request body
            const body = await request.json();
            const { id } = body;

            if (!id) {
                return {
                    status: 400,
                    body: 'Recipe ID is required',
                    headers: {
                        'Access-Control-Allow-Origin': corsOrigin
                    }
                };
            }

            const client = new CosmosClient({
                endpoint: process.env.COSMOS_ENDPOINT,
                key: process.env.COSMOS_KEY
            });
            const database = client.database('RecipesDB');
            const container = database.container('Recipes');

            // Delete the recipe by ID
            await container.item(id, id).delete();

            return {
                status: 200,
                body: 'Recipe deleted successfully',
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin
                }
            };
        } catch (error) {
            return {
                status: 500,
                body: `Error deleting recipe: ${error.message}`,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin
                }
            };
        }
    }
});