// api/addRecipe/index.js (Node.js Azure Function)
const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
    const url = req.body.url;
    if (!url) {
        context.res = { status: 400, body: "URL is required" };
        return;
    }

    const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
    const database = client.database('RecipesDB');
    const container = database.container('Recipes');

    // Simple recipe extraction (you might need to scrape the URL for title/ingredients)
    const recipe = { id: Date.now().toString(), url, name: url.split('/').pop(), ingredients: [] };
    
    await container.items.create(recipe);
    
    context.res = { status: 200, body: "Recipe added" };
};