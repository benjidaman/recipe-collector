const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
    context.log('addRecipe function processed a request.');

    const origin = req.headers['origin'] || '*';
    const allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:8080', 'https://brave-island-070dd7e10.6.azurestaticapps.net'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : '*';

    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
        return;
    }

    try {
        const recipe = req.body;
        if (!recipe || !recipe.url || !recipe.name) {
            context.res = {
                status: 400,
                body: 'Please provide a recipe with url and name.',
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin
                }
            };
            return;
        }

        const client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT,
            key: process.env.COSMOS_KEY
        });
        const database = client.database('RecipesDB');
        const container = database.container('Recipes');

        const newRecipe = {
            id: Date.now().toString(),
            url: recipe.url,
            name: recipe.name,
            ingredients: recipe.ingredients || []
        };

        const { resource } = await container.items.create(newRecipe);

        context.res = {
            status: 201,
            body: resource,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error adding recipe: ${error.message}`,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin
            }
        };
    }
};