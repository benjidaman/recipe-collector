const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
    context.log('deleteRecipe function processed a request.');

    const origin = req.headers['origin'] || '*';
    const allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:8080', 'https://brave-island-070dd7e10.6.azurestaticapps.net'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : '*';

    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'DELETE',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
        return;
    }

    try {
        const id = context.bindingData.id ? context.bindingData.id.toString() : null;

        context.log(`ID: ${id}, Type: ${typeof id}`);

        if (!id) {
            context.log('No recipe ID provided.');
            context.res = {
                status: 400,
                body: 'Please provide a recipe ID.',
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

        context.log('Deleting recipe from Cosmos DB...');
        await container.item(id, id).delete();
        context.log('Recipe deleted successfully.');

        context.res = {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin
            }
        };
    } catch (error) {
        context.log(`Error: ${error.message}`);
        if (error.code === 404) {
            context.log(`Recipe with ID ${context.bindingData.id} not found.`);
            context.res = {
                status: 404,
                body: `Recipe with ID ${context.bindingData.id} not found.`,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Content-Type': 'text/plain'
                }
            };
        } else {
            context.res = {
                status: 500,
                body: `Error deleting recipe: ${error.message}`,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Content-Type': 'text/plain'
                }
            };
        }
    }
};