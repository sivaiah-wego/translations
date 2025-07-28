const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { LANGUAGE_NAMES } = require('./config');

async function loadData(csvPath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

function countMissingTranslations(data, language) {
    return data.filter(row => !row[language] || row[language].trim() === '').length;
}

function estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English
    if (!text || typeof text !== 'string') return 5;
    return Math.ceil(text.length / 4);
}

function calculateCost(tokens, model) {
    const rates = {
        'gpt-3.5-turbo': {
            input: 0.0015,  // per 1K tokens
            output: 0.002   // per 1K tokens
        },
        'gpt-4': {
            input: 0.03,    // per 1K tokens
            output: 0.06    // per 1K tokens
        }
    };

    const rate = rates[model];
    if (!rate) {
        console.log(`⚠️  Unknown model: ${model}, using GPT-3.5 rates`);
        return calculateCost(tokens, 'gpt-3.5-turbo');
    }

    const inputCost = (tokens * rate.input) / 1000;
    const outputCost = (tokens * rate.output) / 1000;
    return inputCost + outputCost;
}

async function analyzeCosts() {
    console.log("💰 Translation Cost Analysis");
    console.log("=" * 50);

    const csvPath = path.join(__dirname, 'data', 'results.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.log("❌ results.csv not found in data directory");
        return;
    }

    try {
        const data = await loadData(csvPath);
        console.log(`📊 Loaded ${data.length} amenities from results.csv`);

        const languages = Object.keys(data[0] || {}).filter(col => !['id', 'en'].includes(col));
        console.log(`🌍 Found ${languages.length} language columns`);

        let totalMissing = 0;
        const languageStats = [];

        for (const language of languages) {
            const missing = countMissingTranslations(data, language);
            totalMissing += missing;
            languageStats.push({ language, missing });
        }

        console.log(`\n📈 Missing Translations Summary:`);
        console.log(`Total missing translations: ${totalMissing}`);

        for (const stat of languageStats) {
            if (stat.missing > 0) {
                const languageName = LANGUAGE_NAMES[stat.language] || stat.language;
                console.log(`  ${stat.language} (${languageName}): ${stat.missing} missing`);
            }
        }

        if (totalMissing === 0) {
            console.log("\n🎉 All translations are complete! No cost analysis needed.");
            return;
        }

        // Estimate tokens for prompts
        const sampleTexts = data.slice(0, 10).map(row => row.en).filter(text => text && text.trim());
        const avgTextLength = sampleTexts.length > 0 ? 
            sampleTexts.reduce((sum, text) => sum + text.length, 0) / sampleTexts.length : 20;
        
        // Estimate prompt tokens (including system prompt and formatting)
        const basePromptTokens = 200; // System prompt + formatting
        const perItemTokens = estimateTokens(avgTextLength) + 50; // English text + some overhead
        const batchSize = 10;
        
        const totalBatches = Math.ceil(totalMissing / batchSize);
        const tokensPerBatch = basePromptTokens + (perItemTokens * batchSize);
        const totalTokens = tokensPerBatch * totalBatches;

        console.log(`\n💡 Cost Estimation:`);
        console.log(`Estimated total tokens: ${totalTokens.toLocaleString()}`);
        console.log(`Number of API calls: ${totalBatches}`);

        // Calculate costs for different models
        const models = ['gpt-3.5-turbo', 'gpt-4'];
        
        for (const model of models) {
            const cost = calculateCost(totalTokens, model);
            console.log(`\n💰 ${model.toUpperCase()}:`);
            console.log(`  Estimated cost: $${cost.toFixed(4)}`);
            console.log(`  Cost per translation: $${(cost / totalMissing).toFixed(6)}`);
        }

        console.log(`\n📝 Notes:`);
        console.log(`- Costs are estimates based on average text length`);
        console.log(`- Actual costs may vary based on translation complexity`);
        console.log(`- Using batch processing to minimize API calls`);
        console.log(`- Consider using GPT-3.5-turbo for cost efficiency`);

    } catch (error) {
        console.error("❌ Error analyzing costs:", error.message);
    }
}

if (require.main === module) {
    analyzeCosts();
}

module.exports = { analyzeCosts }; 