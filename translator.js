const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {
    OPENROUTER_API_KEY,
    MODEL_NAME,
    TEMPERATURE,
    MAX_TOKENS,
    BATCH_SIZE,
    DELAY_BETWEEN_BATCHES,
    LANGUAGE_NAMES
} = require('./config');

class HotelAmenitiesTranslator {
    constructor() {
        if (!OPENROUTER_API_KEY) {
            throw new Error("Please set your OPENROUTER_API_KEY in .env file");
        }

        console.log(`🔑 DEBUG: API Key length: ${OPENROUTER_API_KEY.length}`);
        console.log(`🔑 DEBUG: API Key starts with: ${OPENROUTER_API_KEY.substring(0, 20)}...`);
        console.log(`🔑 DEBUG: API Key ends with: ...${OPENROUTER_API_KEY.substring(OPENROUTER_API_KEY.length - 10)}`);

        this.client = new OpenAI({
            apiKey: OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        this.model = MODEL_NAME;
        this.temperature = TEMPERATURE;
        this.maxTokens = MAX_TOKENS;
    }

    createTranslationPrompt(englishPhrases, targetLanguage, languageName) {
        return `You are a professional translator specializing in hotel and hospitality terminology. 
Translate the following hotel room amenities from English to ${languageName} (${targetLanguage}).

IMPORTANT GUIDELINES:
- Use natural, context-appropriate translations for a hotel booking website
- Maintain the same meaning and tone as the original
- Use proper terminology for hotel amenities
- Keep translations concise and user-friendly
- For items with "(surcharge)" or "(on request)", maintain that context
- Return ONLY the translated list, one translation per line, in the same order

English phrases:
${englishPhrases.map((phrase, i) => `${i + 1}. ${phrase}`).join('\n')}

${languageName} translations:
`;
    }

    async translateBatch(englishPhrases, targetLanguage, languageName) {
        if (!englishPhrases.length) return [];

        const prompt = this.createTranslationPrompt(englishPhrases, targetLanguage, languageName);

        try {
            console.log(`🔑 DEBUG: Making API call with model: ${this.model}`);
            console.log(`🔑 DEBUG: Using client with key: ${this.client.apiKey.substring(0, 10)}...${this.client.apiKey.substring(this.client.apiKey.length - 10)}`);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: "user", content: prompt }],
                temperature: this.temperature,
                max_tokens: this.maxTokens
            });

            const content = response.choices[0].message.content.trim();
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);

            // Clean up translations (remove numbers, extra text)
            const translations = [];
            for (const line of lines) {
                let cleanLine = line;
                if (cleanLine && /^\d/.test(cleanLine)) {
                    // Remove leading numbers and dots
                    cleanLine = cleanLine.replace(/^\d+\.?\s*/, '');
                }
                if (cleanLine) {
                    translations.push(cleanLine);
                }
            }

            // Ensure we have the right number of translations
            if (translations.length >= englishPhrases.length) {
                return translations.slice(0, englishPhrases.length);
            } else {
                // Pad with empty strings if we don't have enough translations
                while (translations.length < englishPhrases.length) {
                    translations.push("");
                }
                return translations;
            }

        } catch (error) {
            console.error(`Error translating to ${targetLanguage}:`, error.message);
            return new Array(englishPhrases.length).fill("");
        }
    }

    async loadData(csvPath) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    console.log(`✅ Loaded ${results.length} amenities from ${csvPath}`);
                    console.log(`📊 Columns: ${Object.keys(results[0] || {})}`);
                    resolve(results);
                })
                .on('error', reject);
        });
    }

    identifyLanguages(data) {
        const languageColumns = Object.keys(data[0] || {}).filter(col => !['id', 'en'].includes(col));
        console.log(`🌍 Found ${languageColumns.length} language columns: ${languageColumns}`);
        return languageColumns;
    }

    findMissingTranslations(data, language) {
        return data.filter(row => !row[language] || row[language].trim() === '');
    }

    async translateLanguage(data, language) {
        const languageName = LANGUAGE_NAMES[language] || language;
        console.log(`\n🔄 Processing ${language} (${languageName})...`);

        const missingRows = this.findMissingTranslations(data, language);
        const missingCount = missingRows.length;

        if (missingCount === 0) {
            console.log(`✅ ${language} already complete!`);
            return { language, translated: 0, total: 0 };
        }

        console.log(`📝 Missing: ${missingCount} translations`);

        const englishTexts = missingRows.map(row => row.en);
        const allTranslations = [];
        const totalBatches = Math.ceil(englishTexts.length / BATCH_SIZE);

        for (let i = 0; i < englishTexts.length; i += BATCH_SIZE) {
            const batch = englishTexts.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`  📦 Batch ${batchNum}/${totalBatches}: ${batch.length} items`);

            const translations = await this.translateBatch(batch, language, languageName);
            allTranslations.push(...translations);

            // Show sample translations
            for (let j = 0; j < batch.length; j++) {
                const original = batch[j];
                const translation = translations[j];
                if (translation) {
                    console.log(`    ✅ ${original} → ${translation}`);
                } else {
                    console.log(`    ❌ ${original} → Failed`);
                }
            }

            // Add delay between batches
            if (i + BATCH_SIZE < englishTexts.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }

        // Update the data
        let translationIndex = 0;
        for (let i = 0; i < data.length; i++) {
            if (!data[i][language] || data[i][language].trim() === '') {
                data[i][language] = allTranslations[translationIndex] || '';
                translationIndex++;
            }
        }

        const successfulTranslations = allTranslations.filter(t => t.trim()).length;
        console.log(`✅ ${language}: ${successfulTranslations}/${missingCount} translated successfully`);

        return {
            language,
            translated: successfulTranslations,
            total: missingCount
        };
    }

    async translateAllLanguages(data) {
        const languages = this.identifyLanguages(data);
        const results = [];

        for (const language of languages) {
            const result = await this.translateLanguage(data, language);
            results.push(result);
        }

        return results;
    }

    async saveResults(data, outputPath) {
        const csvWriter = createCsvWriter({
            path: outputPath,
            header: Object.keys(data[0] || {}).map(key => ({ id: key, title: key }))
        });

        await csvWriter.writeRecords(data);
        console.log(`💾 Results saved to: ${outputPath}`);
    }

    generateSummary(data, results) {
        console.log(`\n📊 TRANSLATION SUMMARY`);
        console.log(`==================================================`);

        const totalTranslated = results.reduce((sum, r) => sum + r.translated, 0);
        const totalMissing = results.reduce((sum, r) => sum + r.total, 0);

        console.log(`Total items translated: ${totalTranslated}`);
        console.log(`Total items processed: ${totalMissing}`);
        console.log(`Success rate: ${totalMissing > 0 ? (totalTranslated / totalMissing * 100).toFixed(1) : 0}%`);

        console.log(`\n📈 Language-wise breakdown:`);
        for (const result of results) {
            if (result.total > 0) {
                const successRate = (result.translated / result.total * 100).toFixed(1);
                console.log(`  ${result.language}: ${result.translated}/${result.total} (${successRate}%)`);
            }
        }
    }
}

async function main() {
    console.log("🏨 Hotel Amenities Translator (JavaScript)");
    console.log("=" * 50);

    let translator;
    try {
        translator = new HotelAmenitiesTranslator();
    } catch (error) {
        console.error(`❌ Configuration error: ${error.message}`);
        console.log("Please set your OPENROUTER_API_KEY in .env file");
        return;
    }

    const inputFile = "data/results.csv";
    const outputFile = "output/translated_amenities_js.csv";

    let data;
    try {
        data = await translator.loadData(inputFile);
    } catch (error) {
        console.error(`❌ Failed to load data: ${error.message}`);
        return;
    }

    console.log(`\n🚀 Starting translation process...`);
    const results = await translator.translateAllLanguages(data);

    try {
        await translator.saveResults(data, outputFile);
    } catch (error) {
        console.error(`❌ Failed to save results: ${error.message}`);
        return;
    }

    translator.generateSummary(data, results);

    console.log(`\n🎉 Translation process completed!`);
    console.log(`📁 Output file: ${outputFile}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = HotelAmenitiesTranslator; 