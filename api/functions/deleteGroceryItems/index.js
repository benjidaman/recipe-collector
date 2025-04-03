const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;
    context.log(`COSMOSDB_ENDPOINT: ${endpoint}`);
    context.log(`COSMOSDB_KEY (first 5 chars): ${key ? key.substring(0, 5) : 'undefined'}...`);

    if (!endpoint || !key) {
        context.log.error('Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY');
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Server configuration error: Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY" })
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error creating CosmosClient: ${error.message}` })
        };
        return;
    }

    const databaseId = "RecipesDB";
    const containerId = "GroceryList";

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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error connecting to database/container: ${error.message}` })
        };
        return;
    }

    if (!req.body || !req.body.itemIds || !Array.isArray(req.body.itemIds) || req.body.itemIds.length === 0) {
        context.log.warn('Invalid request body: Missing or invalid itemIds');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Please provide a list of item IDs to delete." })
        };
        return;
    }

    const itemIds = req.body.itemIds;

    try {
        for (const itemId of itemIds) {
            await container.item(itemId, itemId).delete();
            context.log(`Successfully deleted grocery item with ID: ${itemId}`);
        }
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Grocery items deleted successfully" })
        };
    } catch (error) {
        context.log.error(`Failed to delete grocery items: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error deleting grocery items: ${error.message}` })
        };
    }
};