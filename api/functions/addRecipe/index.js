const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;
    context.log(`COSMOSDB_ENDPOINT: ${endpoint}`);
    context.log(`COSMOSDB_KEY (first 5 chars): ${key ? key.substring(0, 5) : 'undefined'}...`);

    // Add validation for endpoint and key
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

    if (!req.body || !req.body.url || !req.body.name) {
        context.log.warn('Invalid request body: Missing url or name');
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
        context.log(`Successfully created recipe with ID: ${resource.id}`);
        context.res = {
            status: 201,
            body: resource
        };
    } catch (error) {
        context.log.error(`Failed to create recipe: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            body: `Error adding recipe: ${error.message}`
        };
    }
};