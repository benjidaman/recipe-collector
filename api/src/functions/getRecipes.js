const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

app.http('getRecipes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
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
            headers: { 'Content-Type': 'application/json' }
        };
    }
});