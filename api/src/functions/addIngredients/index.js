const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
    context.log('addIngredients function processed a request.');

    const origin = req.headers['origin'] || '*';
    const allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:8080', 'https://brave-island-070dd7e10.6.azurestaticapps.net'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : '*';

    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'PUT',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
        return;
    }

    try {
        const id = context.bindingData.id ? context.bindingData.id.toString() : null;
        const ingredients = req.body && req.body.ingredients;

        context.log(`ID: ${id}, Type: ${typeof id}`);
        context.log(`Ingredients: ${JSON.stringify(ingredients)}`);

        if (!id || !ingredients || !Array.isArray(ingredients)) {
            context.res = {
                status: 400,
                body: 'Please provide a recipe ID and an array of ingredients.',
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

        context.log('Reading recipe from Cosmos DB...');
        const { resource: recipe } = await container.item(id, id).read();
        if (!recipe) {
            context.log('Recipe not found.');
            context.res = {
                status: 404,
                body: 'Recipe not found.',
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin
                }
            };
            return;
        }

        context.log(`Recipe found: ${JSON.stringify(recipe)}`);

        recipe.ingredients = ingredients;

        context.log('Updating recipe in Cosmos DB...');
        const { resource: updatedRecipe } = await container.item(id, id).replace(recipe);
        context.log(`Updated recipe: ${JSON.stringify(updatedRecipe)}`);

        context.res = {
            status: 200,
            body: updatedRecipe,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin
            }
        };
    } catch (error) {
        context.log(`Error: ${error.message}`);
        context.res = {
            status: 500,
            body: `Error adding ingredients: ${error.message}`,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin
            }
        };
    }
};