const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;
    context.log(`COSMOSDB_ENDPOINT: ${endpoint}`);
    context.log(`COSMOSDB_KEY (first 5 chars): ${key ? key.substring(0, 5) : 'undefined'}...`); // Mask the key for security
    const client = new CosmosClient({ endpoint, key });

    const databaseId = "RecipesDB";
    const containerId = "Recipes";

    const database = client.database(databaseId);
    const container = database.container(containerId);

    if (!req.body || !req.body.url || !req.body.name) {
        context.res = {
            status: 400,
            body: "Please provide a recipe with url and name."
        };
        return;
    }

    const newRecipe = {
        id: Date.now().toString(),
        url: req.body.url,
        name: req.body.name,
        comment: req.body.comment || "",
        ingredients: req.body.ingredients || [],
        dateAdded: new Date().toISOString()
    };

    try {
        const { resource } = await container.items.create(newRecipe);
        context.res = {
            status: 201,
            body: resource
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error adding recipe: ${error.message}`
        };
    }
};