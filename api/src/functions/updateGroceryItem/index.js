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

    if (!req.body || !req.body.id) {
        context.log.warn('Invalid request body: Missing required fields');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Please provide an item id." })
        };
        return;
    }

    const itemId = req.body.id;
    const isGrabbed = req.body.isGrabbed; // Optional
    const category = req.body.category; // Optional

    if (isGrabbed === undefined && category === undefined) {
        context.log.warn('Invalid request body: No fields to update');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Please provide at least one field to update (isGrabbed or category)." })
        };
        return;
    }

    try {
        // Fetch the existing item
        const { resource: item } = await container.item(itemId, itemId).read();
        if (!item) {
            context.log.warn(`Item with ID ${itemId} not found`);
            context.res = {
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: `Item with ID ${itemId} not found.` })
            };
            return;
        }

        // Update fields if provided
        if (isGrabbed !== undefined) {
            item.isGrabbed = isGrabbed;
        }
        if (category !== undefined) {
            item.category = category;
        }

        // Replace the item in Cosmos DB
        const { resource } = await container.item(itemId, itemId).replace(item);
        context.log(`Successfully updated grocery item with ID: ${itemId}`);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: resource
        };
    } catch (error) {
        context.log.error(`Failed to update grocery item: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error updating grocery item: ${error.message}` })
        };
    }
};