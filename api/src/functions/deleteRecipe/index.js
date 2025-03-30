const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // Log the full request URL and bindings for debugging
    context.log(`Request URL: ${req.url}`);
    context.log(`Binding Data: ${JSON.stringify(context.bindingData)}`);

    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;
    context.log(`COSMOSDB_ENDPOINT: ${endpoint}`);
    context.log(`COSMOSDB_KEY (first 5 chars): ${key ? key.substring(0, 5) : 'undefined'}...`);

    if (!endpoint || !key) {
        context.log.error('Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY');
        context.res = {
            status: 500,
            body: "Server configuration error: Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY"
        };
        return;
    }

    let client;
    try {
        client = new CosmosClient({ endpoint, key });
    } catch (error) {
        context.log.error(`Failed to create CosmosClient: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            body: `Error creating CosmosClient: ${error.message}`
        };
        return;
    }

    const databaseId = "RecipesDB";
    const containerId = "Recipes";

    let database, container;
    try {
        database = client.database(databaseId);
        container = database.container(containerId);
        context.log(`Successfully connected to database: ${databaseId}, container: ${containerId}`);
    } catch (error) {
        context.log.error(`Failed to connect to database/container: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            body: `Error connecting to database/container: ${error.message}`
        };
        return;
    }

    const recipeId = context.bindingData.recipeId;
    if (!recipeId) {
        context.log.warn('Missing recipeId in request');
        context.res = {
            status: 400,
            body: "Please provide a recipe ID."
        };
        return;
    }

    try {
        await container.item(recipeId, recipeId).delete();
        context.log(`Successfully deleted recipe with ID: ${recipeId}`);
        context.res = {
            status: 200,
            body: "Recipe deleted successfully"
        };
    } catch (error) {
        context.log.error(`Failed to delete recipe: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            body: `Error deleting recipe: ${error.message}`
        };
    }
};