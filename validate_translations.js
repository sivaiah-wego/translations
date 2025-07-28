const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const VALIDATION_MODEL = "anthropic/claude-3-haiku"; // Different model for validation
const TEMPERATURE = 0.1; // Lower temperature for more consistent validation

// Language mapping for validation
const LANGUAGE_NAMES = {
    'ar': 'Arabic',
    'de': 'German', 
    'es': 'Spanish',
    'es419': 'Latin American Spanish',
    'fr': 'French',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'nl': 'Dutch',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'ptBr': 'Brazilian Portuguese',
    'ru': 'Russian',
    'sv': 'Swedish',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'zhCn': 'Simplified Chinese',
    'zhHk': 'Traditional Chinese',
    'gu': 'Gujarati',
    'hi': 'Hindi',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'mr': 'Marathi',
    'or': 'Odia',
    'pa': 'Punjabi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'fa': 'Persian',
    'ms': 'Malay',
    'zhTw': 'Taiwan Traditional Chinese'
};

class TranslationValidator {
    constructor() {
        if (!OPENROUTER_API_KEY) {
            throw new Error("Please set your OPENROUTER_API_KEY in .env file");
        }

        this.client = new OpenAI({
            apiKey: OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        this.validationResults = [];
        this.issues = [];
    }

    async loadData(filePath) {
        const csv = require('csv-parser');
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }

    async validateTranslation(english, translation, languageCode) {
        const languageName = LANGUAGE_NAMES[languageCode];
        
        const prompt = `You are a professional translation validator. Please validate the following translation:

English: "${english}"
${languageName} Translation: "${translation}"

Please provide a validation score from 1-10 (where 10 is perfect) and brief feedback.
Consider:
1. Accuracy of meaning
2. Cultural appropriateness for hotel amenities
3. Natural language flow
4. Technical correctness

Respond in this exact format:
Score: [1-10]
Feedback: [brief explanation]
Issues: [list any issues found, or "None" if perfect]`;

        try {
            const response = await this.client.chat.completions.create({
                model: VALIDATION_MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: TEMPERATURE,
                max_tokens: 200
            });

            const result = response.choices[0].message.content;
            
            // Parse the response
            const scoreMatch = result.match(/Score:\s*(\d+)/);
            const feedbackMatch = result.match(/Feedback:\s*(.+?)(?=\n|$)/);
            const issuesMatch = result.match(/Issues:\s*(.+?)(?=\n|$)/);

            return {
                score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
                feedback: feedbackMatch ? feedbackMatch[1].trim() : 'No feedback provided',
                issues: issuesMatch ? issuesMatch[1].trim() : 'No issues listed',
                rawResponse: result
            };
        } catch (error) {
            console.error(`❌ Validation error for "${english}": ${error.message}`);
            return {
                score: 0,
                feedback: 'Validation failed',
                issues: error.message,
                rawResponse: ''
            };
        }
    }

    async validateSample(data, languageCode, sampleSize = 10) {
        console.log(`🔍 Validating ${languageCode} (${LANGUAGE_NAMES[languageCode]}) translations...`);
        
        const languageData = data.filter(row => row[languageCode] && row[languageCode].trim() !== '');
        
        if (languageData.length === 0) {
            console.log(`⚠️  No translations found for ${languageCode}`);
            return;
        }

        // Take a random sample
        const shuffled = languageData.sort(() => 0.5 - Math.random());
        const sample = shuffled.slice(0, Math.min(sampleSize, languageData.length));
        
        console.log(`📊 Validating ${sample.length} random samples out of ${languageData.length} total translations`);

        const validations = [];
        let totalScore = 0;

        for (let i = 0; i < sample.length; i++) {
            const row = sample[i];
            const english = row.en;
            const translation = row[languageCode];
            
            console.log(`  ${i + 1}/${sample.length}: "${english}" → "${translation}"`);
            
            const validation = await this.validateTranslation(english, translation, languageCode);
            validations.push({
                id: row.id,
                english,
                translation,
                ...validation
            });
            
            totalScore += validation.score;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const averageScore = totalScore / sample.length;
        
        this.validationResults.push({
            language: languageCode,
            languageName: LANGUAGE_NAMES[languageCode],
            sampleSize: sample.length,
            totalTranslations: languageData.length,
            averageScore,
            validations
        });

        console.log(`✅ ${languageCode} validation complete - Average score: ${averageScore.toFixed(2)}/10\n`);
    }

    async runValidation(inputFile = 'data/results.csv') {
        console.log("🔍 Translation Validation Tool");
        console.log("=" * 50);
        
        try {
            const data = await this.loadData(inputFile);
            console.log(`📊 Loaded ${data.length} amenities from ${inputFile}`);
            
            const languageColumns = Object.keys(LANGUAGE_NAMES);
            console.log(`🌍 Found ${languageColumns.length} language columns to validate\n`);

            // Validate a sample of translations for each language
            for (const languageCode of languageColumns) {
                await this.validateSample(data, languageCode, 5); // Validate 5 samples per language
            }

            this.generateReport();
            
        } catch (error) {
            console.error(`❌ Validation failed: ${error.message}`);
        }
    }

    generateReport() {
        console.log("\n📊 VALIDATION REPORT");
        console.log("=" * 50);

        let overallAverage = 0;
        let totalValidations = 0;

        this.validationResults.forEach(result => {
            console.log(`\n🌍 ${result.languageName} (${result.language})`);
            console.log(`   Sample size: ${result.sampleSize}/${result.totalTranslations}`);
            console.log(`   Average score: ${result.averageScore.toFixed(2)}/10`);
            
            // Show issues for low-scoring translations
            const lowScores = result.validations.filter(v => v.score < 7);
            if (lowScores.length > 0) {
                console.log(`   ⚠️  ${lowScores.length} translations scored below 7:`);
                lowScores.forEach(v => {
                    console.log(`      "${v.english}" → "${v.translation}" (Score: ${v.score})`);
                    console.log(`      Issues: ${v.issues}`);
                });
            }

            overallAverage += result.averageScore * result.sampleSize;
            totalValidations += result.sampleSize;
        });

        overallAverage = overallAverage / totalValidations;

        console.log(`\n📈 OVERALL RESULTS`);
        console.log(`   Total validations: ${totalValidations}`);
        console.log(`   Overall average score: ${overallAverage.toFixed(2)}/10`);
        
        if (overallAverage >= 8) {
            console.log(`   🎉 Excellent translation quality!`);
        } else if (overallAverage >= 6) {
            console.log(`   ✅ Good translation quality`);
        } else {
            console.log(`   ⚠️  Translation quality needs improvement`);
        }

        // Save detailed report
        const reportPath = 'output/validation_report.json';
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            overallScore: overallAverage,
            totalValidations,
            results: this.validationResults
        }, null, 2));

        console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    }
}

async function main() {
    console.log("🔍 Starting translation validation...\n");

    let validator;
    try {
        validator = new TranslationValidator();
    } catch (error) {
        console.error(`❌ Configuration error: ${error.message}`);
        return;
    }

    try {
        await validator.runValidation();
    } catch (error) {
        console.error(`❌ Validation failed: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = TranslationValidator; 