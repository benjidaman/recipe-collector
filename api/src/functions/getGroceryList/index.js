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

    try {
        const querySpec = {
            query: "SELECT * FROM c ORDER BY c.[order] ASC"
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        context.log(`Successfully fetched ${resources.length} grocery items`);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: resources
        };
    } catch (error) {
        context.log.error(`Failed to fetch grocery items: ${error.message}`);
        context.log.error(`Error stack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error fetching grocery items: ${error.message}` })
        };
    }
};