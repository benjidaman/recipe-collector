const { CosmosClient } = require("@azure/cosmos");

async function updateRecipes() {
    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;

    if (!endpoint || !key) {
        console.error("Error: COSMOSDB_ENDPOINT and COSMOSDB_KEY environment variables must be set.");
        process.exit(1);
    }

    const client = new CosmosClient({ endpoint, key });

    const databaseId = "RecipesDB";
    const containerId = "Recipes";

    const database = client.database(databaseId);
    const container = database.container(containerId);

    try {
        // Fetch all recipes
        const { resources: recipes } = await container.items.readAll().fetchAll();
        console.log(`Found ${recipes.length} recipes to update.`);

        // Update each recipe
        for (const recipe of recipes) {
            let needsUpdate = false;
            const updatedRecipe = { ...recipe };

            // Add ingredients if missing
            if (!updatedRecipe.ingredients) {
                updatedRecipe.ingredients = [];
                needsUpdate = true;
            }

            // Add comment if missing
            if (!updatedRecipe.comment) {
                updatedRecipe.comment = "";
                needsUpdate = true;
            }

            // Add dateAdded if missing (use the recipe's id as a fallback date)
            if (!updatedRecipe.dateAdded) {
                updatedRecipe.dateAdded = new Date(parseInt(recipe.id)).toISOString();
                needsUpdate = true;
            }

            // Update the recipe in the database if changes were made
            if (needsUpdate) {
                await container.items.upsert(updatedRecipe);
                console.log(`Updated recipe with ID: ${recipe.id}`);
            }
        }

        console.log("All recipes updated successfully.");
    } catch (error) {
        console.error("Error updating recipes:", error.message);
    }
}

// Run the script
updateRecipes().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});