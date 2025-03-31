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

    if (!req.body || !req.body.itemId || !req.body.direction) {
        context.log.warn('Invalid request body: Missing required fields');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Please provide an itemId and direction (up or down)." })
        };
        return;
    }

    const itemId = req.body.itemId;
    const direction = req.body.direction.toLowerCase();

    if (direction !== 'up' && direction !== 'down') {
        context.log.warn('Invalid direction: Must be "up" or "down"');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Direction must be 'up' or 'down'." })
        };
        return;
    }

    try {
        // Fetch all items sorted by order
        const querySpec = {
            query: 'SELECT * FROM c ORDER BY c["order"] ASC'
        };
        const { resources: items } = await container.items.query(querySpec).fetchAll();

        // Find the item to move
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            context.log.warn(`Item with ID ${itemId} not found`);
            context.res = {
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: `Item with ID ${itemId} not found.` })
            };
            return;
        }

        // Determine the adjacent item to swap with
        let swapIndex;
        if (direction === 'up') {
            swapIndex = itemIndex - 1;
            if (swapIndex < 0) {
                context.res = {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Item is already at the top of the list." })
                };
                return;
            }
        } else {
            swapIndex = itemIndex + 1;
            if (swapIndex >= items.length) {
                context.res = {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Item is already at the bottom of the list." })
                };
                return;
            }
        }

        // Swap the order values
        const itemToMove = items[itemIndex];
        const itemToSwap = items[swapIndex];

        const tempOrder = itemToMove.order;
        itemToMove.order = itemToSwap.order;
        itemToSwap.order = tempOrder;

        // Update both items in Cosmos DB
        await container.item(itemToMove.id, itemToMove.id).replace(itemToMove);
        await container.item(itemToSwap.id, itemToSwap.id).replace(itemToSwap);

        context.log(`Successfully reordered item with ID: ${itemId}`);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Item reordered successfully" })
        };
    } catch (error) {
        context.log.error(`Failed to reorder grocery item: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error reordering grocery item: ${error.message}` })
        };
    }
};