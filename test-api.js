const OpenAI = require('openai');
const { OPENROUTER_API_KEY } = require('./config');

async function testApiKey() {
    console.log("🔑 Testing OpenRouter API Key...");
    console.log(`API Key starts with: ${OPENROUTER_API_KEY.substring(0, 20)}...`);

    try {
        const client = new OpenAI({
            apiKey: OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        // Simple test request
        const response = await client.chat.completions.create({
            model: "openai/gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say 'Hello World'" }],
            max_tokens: 10
        });

        const result = response.choices[0].message.content;
        console.log("✅ API Test Successful!");
        console.log(`Response: ${result}`);
        return true;

    } catch (error) {
        console.log("❌ API Test Failed:", error.message);
        return false;
    }
}

if (require.main === module) {
    testApiKey();
}

module.exports = { testApiKey }; 