const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // Define CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle CORS preflight (OPTIONS) request
    if (req.method === "OPTIONS") {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;
    context.log(`COSMOSDB_ENDPOINT: ${endpoint}`);
    context.log(`COSMOSDB_KEY (first 5 chars): ${key ? key.substring(0, 5) : 'undefined'}...`);

    if (!endpoint || !key) {
        context.log.error('Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY');
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
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
            headers: { "Content-Type": "application/json", ...corsHeaders },
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
            headers: { "Content-Type": "application/json", ...corsHeaders },
            body: JSON.stringify({ error: `Error connecting to database/container: ${error.message}` })
        };
        return;
    }

    if (!req.body || !req.body.id) {
        context.log.warn('Invalid request body: Missing required fields');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
            body: JSON.stringify({ error: "Please provide an item id." })
        };
        return;
    }

    const itemId = req.body.id;
    const isGrabbed = req.body.isGrabbed; // Optional
    const category = req.body.category; // Optional
    const name = req.body.name; // Optional - New field for updating the item name

    // Ensure at least one field (isGrabbed, category, or name) is provided for update
    if (isGrabbed === undefined && category === undefined && name === undefined) {
        context.log.warn('Invalid request body: No fields to update');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
            body: JSON.stringify({ error: "Please provide at least one field to update (isGrabbed, category, or name)." })
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
                headers: { "Content-Type": "application/json", ...corsHeaders },
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
        if (name !== undefined) {
            item.name = name;
        }

        // Replace the item in Cosmos DB
        const { resource } = await container.item(itemId, itemId).replace(item);
        context.log(`Successfully updated grocery item with ID: ${itemId}`);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
            body: resource
        };
    } catch (error) {
        context.log.error(`Failed to update grocery item: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
            body: JSON.stringify({ error: `Error updating grocery item: ${error.message}` })
        };
    }
};