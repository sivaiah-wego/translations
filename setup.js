const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    console.log("🏨 Hotel Amenities Translator Setup");
    console.log("=" * 50);

    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log("✅ .env file already exists");
    } else {
        console.log("📝 Creating .env file...");
        
        const apiKey = await question("Enter your OpenRouter API key: ");
        
        const envContent = `OPENROUTER_API_KEY=${apiKey}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log("✅ .env file created successfully");
    }

    // Check if data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log("✅ Created data directory");
    }

    // Check if output directory exists
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log("✅ Created output directory");
    }

    // Check if results.csv exists
    const csvPath = path.join(dataDir, 'results.csv');
    if (fs.existsSync(csvPath)) {
        console.log("✅ results.csv found in data directory");
    } else {
        console.log("⚠️  Warning: results.csv not found in data directory");
        console.log("   Please place your CSV file in the data/ directory");
    }

    console.log("\n🎉 Setup completed!");
    console.log("\nNext steps:");
    console.log("1. Run 'node test-api.js' to test your API key");
    console.log("2. Run 'node translator.js' to start translation");
    console.log("3. Or use 'npm start' to run the translator");

    rl.close();
}

if (require.main === module) {
    setup().catch(console.error);
}

module.exports = { setup }; 