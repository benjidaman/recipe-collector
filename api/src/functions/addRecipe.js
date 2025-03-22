const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

app.http('addRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const body = await request.json();
        const url = body.url;
        if (!url) {
            return { status: 400, body: "URL is required" };
        }

        const client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT,
            key: process.env.COSMOS_KEY
        });
        const database = client.database('RecipesDB');
        const container = database.container('Recipes');

        const recipe = { 
            id: Date.now().toString(), 
            url, 
            name: url.split('/').pop().replace(/-/g, ' '), 
            ingredients: [] 
        };
        
        await container.items.create(recipe);
        
        return { status: 200, body: "Recipe added" };
    }
});