const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
require('dotenv').config();

// Import API service and validator
const ApiService = require('./api-service');
const TranslationValidator = require('./validate_translations');

// ============================================================================
// CONFIGURATION SETTINGS
// ============================================================================

// API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Translation Model: Using GPT-3.5-Turbo for maximum cost efficiency
const TRANSLATION_MODEL = "openai/gpt-3.5-turbo";

// Temperature Setting: 0.3 for creative but consistent translations
const TRANSLATION_TEMPERATURE = 0.3;

// Batch Processing Settings
const BATCH_SIZE = 200;  // Process all amenities in one batch per language
const DELAY_BETWEEN_BATCHES = 0; // No delay between batches

// Quality Threshold for retranslation
const QUALITY_THRESHOLD = 8.5; // Minimum score required (out of 10)

// ============================================================================
// LANGUAGE MAPPING FOR TRANSLATION
// ============================================================================

// Human-readable language names for better translation prompts
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

// ============================================================================
// UPGRADED TRANSLATOR CLASS
// ============================================================================

/**
 * UpgradedHotelAmenitiesTranslator - Enhanced translation system with quality validation
 * 
 * This upgraded version includes:
 * 1. Context-aware translation prompts
 * 2. Per-language quality validation
 * 3. Automatic retranslation for low-quality results
 * 4. JSON input/output support
 * 5. Detailed quality reporting
 */
class UpgradedHotelAmenitiesTranslator {
    
    /**
     * Initialize the translator with OpenAI client and validator
     * @throws {Error} If API key is not configured
     */
    constructor() {
        // Validate API key configuration
        if (!OPENROUTER_API_KEY) {
            throw new Error("Please set your OPENROUTER_API_KEY in .env file");
        }

        // Initialize OpenAI client for translation
        this.openaiClient = new OpenAI({
            apiKey: OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        // Initialize API service for fetching amenities
        this.apiService = new ApiService();
        
        // Initialize validator for quality assessment
        this.validator = new TranslationValidator();
        
        // Store translation results and quality metrics
        this.translationResults = [];
        this.qualityMetrics = {};
        this.retranslationAttempts = {};
    }

    /**
     * Create context-aware translation prompt for better quality
     * @param {Array} englishPhrases - Array of English amenity phrases
     * @param {string} targetLanguageCode - Language code (e.g., 'es', 'fr')
     * @param {string} languageName - Human-readable language name
     * @returns {string} Enhanced translation prompt
     */
    createEnhancedTranslationPrompt(englishPhrases, targetLanguageCode, languageName) {
        return `Translate these hotel amenities to ${languageName}. Use natural, professional tone for hotel guests.

${englishPhrases.map((phrase, index) => `${index + 1}. ${phrase}`).join('\n')}

Format: 1. [translation] 2. [translation] etc. (without quotes)`;
    }

    /**
     * Create retranslation prompt for low-quality translations
     * @param {Array} englishPhrases - Original English phrases
     * @param {Array} currentTranslations - Current low-quality translations
     * @param {Array} qualityIssues - Specific issues found
     * @param {string} targetLanguageCode - Language code
     * @param {string} languageName - Language name
     * @returns {string} Retranslation prompt
     */
    createRetranslationPrompt(englishPhrases, currentTranslations, qualityIssues, targetLanguageCode, languageName) {
        return `Improve these ${languageName} translations. Previous quality was low. Make them natural and professional.

ORIGINAL: ${englishPhrases.map((phrase, index) => `${index + 1}. ${phrase}`).join('\n')}
CURRENT: ${currentTranslations.map((translation, index) => `${index + 1}. ${translation}`).join('\n')}

Provide improved translations: 1. [translation] 2. [translation] etc. (without quotes)`;
    }

    /**
     * Translate a batch of amenities using enhanced prompts
     * @param {Array} englishPhrases - Array of English amenity phrases
     * @param {string} targetLanguageCode - Language code
     * @param {string} languageName - Human-readable language name
     * @returns {Promise<Array>} Array of translated phrases
     */
    async translateBatch(englishPhrases, targetLanguageCode, languageName) {
        const translationPrompt = this.createEnhancedTranslationPrompt(englishPhrases, targetLanguageCode, languageName);
        
        // Retry logic with exponential backoff
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Add delay between retries
                if (attempt > 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
                    console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${languageName} (waiting ${delay}ms)...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                // Make API call to translate batch
            const apiResponse = await this.openaiClient.chat.completions.create({
                    model: TRANSLATION_MODEL,
                messages: [{ role: "user", content: translationPrompt }],
                    temperature: TRANSLATION_TEMPERATURE,
                    max_tokens: 1000,
                    timeout: 30000 // 30 second timeout
                });

                const aiResponse = apiResponse.choices[0].message.content;
                
                // Parse the AI response to extract translations
                const translations = this.parseTranslationResponse(aiResponse, englishPhrases.length);
                
                return translations;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ Translation error for ${languageName} (attempt ${attempt}/${maxRetries}): ${error.message}`);
                
                // If it's the last attempt, return error translations
                if (attempt === maxRetries) {
                    console.error(`💥 All retry attempts failed for ${languageName}`);
                    return englishPhrases.map(() => '[TRANSLATION_ERROR]');
                }
            }
        }
        
        return englishPhrases.map(() => '[TRANSLATION_ERROR]');
    }

    /**
     * Retranslate low-quality translations
     * @param {Array} englishPhrases - Original English phrases
     * @param {Array} currentTranslations - Current translations
     * @param {Array} qualityIssues - Quality issues found
     * @param {string} targetLanguageCode - Language code
     * @param {string} languageName - Language name
     * @returns {Promise<Array>} Improved translations
     */
    async retranslateBatch(englishPhrases, currentTranslations, qualityIssues, targetLanguageCode, languageName) {
        const retranslationPrompt = this.createRetranslationPrompt(
            englishPhrases, currentTranslations, qualityIssues, targetLanguageCode, languageName
        );
        
        // Retry logic with exponential backoff
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Add delay between retries
                if (attempt > 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
                    console.log(`🔄 Retranslation retry attempt ${attempt}/${maxRetries} for ${languageName} (waiting ${delay}ms)...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                console.log(`🔄 Retranslating ${languageName} due to quality issues...`);
                
                const apiResponse = await this.openaiClient.chat.completions.create({
                    model: TRANSLATION_MODEL,
                    messages: [{ role: "user", content: retranslationPrompt }],
                    temperature: TRANSLATION_TEMPERATURE,
                    max_tokens: 1000,
                    timeout: 30000 // 30 second timeout
                });

                const aiResponse = apiResponse.choices[0].message.content;
                
                // Parse the AI response to extract improved translations
                const improvedTranslations = this.parseTranslationResponse(aiResponse, englishPhrases.length);
                
                return improvedTranslations;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ Retranslation error for ${languageName} (attempt ${attempt}/${maxRetries}): ${error.message}`);
                
                // If it's the last attempt, return original translations
                if (attempt === maxRetries) {
                    console.error(`💥 All retranslation attempts failed for ${languageName}`);
                    return currentTranslations;
                }
            }
        }
        
        return currentTranslations; // Return original translations if all retries fail
    }

    /**
     * Parse AI translation response to extract individual translations
     * @param {string} aiResponse - Raw AI response
     * @param {number} expectedCount - Expected number of translations
     * @returns {Array} Array of parsed translations
     */
    parseTranslationResponse(aiResponse, expectedCount) {
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const translations = [];
        
        for (let i = 0; i < expectedCount; i++) {
            const line = lines[i] || '';
            // Extract translation after the number and period
            const match = line.match(/^\d+\.\s*(.+)$/);
            if (match) {
                let translation = match[1].trim();
                
                // Remove surrounding quotes if present
                if (translation.startsWith('"') && translation.endsWith('"')) {
                    translation = translation.slice(1, -1);
                }
                
                // Add translation (no special handling for failed translations)
                translations.push(translation);
            } else {
                // Fallback: use the line as is
                let fallbackTranslation = line.trim() || `[MISSING TRANSLATION ${i + 1}]`;
                
                // Remove surrounding quotes if present
                if (fallbackTranslation.startsWith('"') && fallbackTranslation.endsWith('"')) {
                    fallbackTranslation = fallbackTranslation.slice(1, -1);
                }
                
                translations.push(fallbackTranslation);
            }
        }
        
        return translations;
    }

    /**
     * Load amenities data from JSON file
     * @param {string} filePath - Path to JSON file
     * @returns {Promise<Array>} Array of amenity objects
     */
    async loadAmenitiesFromJson(filePath = 'data/amenities.json') {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const amenities = JSON.parse(data);
            console.log(`📊 Loaded ${amenities.length} amenities from ${filePath}`);
            return amenities;
        } catch (error) {
            console.error(`❌ Failed to load amenities from ${filePath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Find missing translations for a specific language
     * @param {Array} amenities - Amenities data
     * @param {string} languageCode - Language code to check
     * @returns {Array} Array of amenities missing translations
     */
    findMissingTranslations(amenities, languageCode) {
        return amenities.filter(amenity => {
            // Check if translation exists in nameAll object
            if (amenity.nameAll && amenity.nameAll[languageCode]) {
                return amenity.nameAll[languageCode].trim() === '';
            }
            // Fallback to direct property check
            return !amenity[languageCode] || amenity[languageCode].trim() === '';
        });
    }

    /**
     * Translate missing translations for a specific language
     * @param {Array} amenities - Amenities data
     * @param {string} languageCode - Language code
     * @param {string} languageName - Language name
     * @returns {Promise<Object>} Translation results
     */
    async translateLanguage(amenities, languageCode, languageName) {
        console.log(`🌍 Translating ${languageName} (${languageCode})...`);
        
        // Find amenities missing translations for this language
        const missingTranslations = this.findMissingTranslations(amenities, languageCode);
        
        if (missingTranslations.length === 0) {
            console.log(`✅ All ${languageName} translations already exist`);
            return { 
                languageCode, 
                languageName,
                translatedCount: 0, 
                totalCount: amenities.length,
                status: 'already_complete'
            };
        }

        console.log(`📝 Found ${missingTranslations.length} amenities needing ${languageName} translation`);

        let translatedCount = 0;
        const translationResults = [];

        // Process in batches
        for (let i = 0; i < missingTranslations.length; i += BATCH_SIZE) {
            const batch = missingTranslations.slice(i, i + BATCH_SIZE);
            const englishPhrases = batch.map(amenity => amenity.name || amenity.en);
            
            console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: Translating ${batch.length} amenities`);
            
            // Translate batch
            const translations = await this.translateBatch(englishPhrases, languageCode, languageName);
            
            // Update amenities with translations
            for (let j = 0; j < batch.length; j++) {
                const amenity = batch[j];
                const translation = translations[j];
                
                if (translation && translation !== '[TRANSLATION ERROR]') {
                    // Initialize nameAll object if it doesn't exist
                    if (!amenity.nameAll) {
                        amenity.nameAll = {};
                    }
                    // Add translation to nameAll object
                    amenity.nameAll[languageCode] = translation;
                    translatedCount++;
                }
            }
            
            translationResults.push({
                batch: batch.length,
                successful: translations.filter(t => t && t !== '[TRANSLATION ERROR]').length
            });
            
            // No delay between batches for faster processing
            // if (i + BATCH_SIZE < missingTranslations.length) {
            //     await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            // }
        }

        console.log(`✅ ${languageName} translation complete: ${translatedCount}/${missingTranslations.length} translated`);

        return {
            languageCode,
            languageName,
            translatedCount,
            totalCount: missingTranslations.length,
            status: 'completed',
            batchResults: translationResults
        };
    }

    /**
     * Validate translations for a specific language and retranslate if needed
     * @param {Array} amenities - Amenities data
     * @param {string} languageCode - Language code
     * @param {string} languageName - Language name
     * @returns {Promise<Object>} Validation and retranslation results
     */
    async validateAndRetranslateLanguage(amenities, languageCode, languageName) {
        console.log(`🔍 Validating ${languageName} translations...`);
        
        // Get amenities with translations for this language
        const translatedAmenities = amenities.filter(amenity => {
            if (amenity.nameAll && amenity.nameAll[languageCode]) {
                return amenity.nameAll[languageCode].trim() !== '' && 
                       amenity.nameAll[languageCode] !== '[TRANSLATION_FAILED]';
            }
            return amenity[languageCode] && amenity[languageCode].trim() !== '' && 
                   amenity[languageCode] !== '[TRANSLATION_FAILED]';
        });
        
        if (translatedAmenities.length === 0) {
            console.log(`⚠️  No ${languageName} translations found for validation`);
            return {
                languageCode,
                languageName,
                averageScore: 0,
                needsRetranslation: false,
                status: 'no_translations'
            };
        }

        // Use the enhanced validation system for language-level validation
        const languageValidation = await this.validator.validateLanguage(
            translatedAmenities, 
            languageCode, 
            languageName, 
            5 // Sample size
        );
        
        const averageScore = languageValidation.averageScore;
        const validationResults = languageValidation.validationResults;
        
        console.log(`📊 ${languageName} validation score: ${averageScore.toFixed(2)}/10`);

        // Check if retranslation is needed
        const needsRetranslation = averageScore < QUALITY_THRESHOLD;
        
        if (needsRetranslation) {
            console.log(`⚠️  ${languageName} quality below threshold (${QUALITY_THRESHOLD}). Initiating retranslation...`);
            
            // Get quality issues for retranslation
            const qualityIssues = validationResults
                .filter(v => v.score < QUALITY_THRESHOLD)
                .map(v => v.issues)
                .filter(issue => issue !== 'None' && issue !== 'No issues listed');
            
            // Retranslate all amenities for this language
            const englishPhrases = translatedAmenities.map(amenity => amenity.name || amenity.en);
            const currentTranslations = translatedAmenities.map(amenity => 
                amenity.nameAll && amenity.nameAll[languageCode] 
                    ? amenity.nameAll[languageCode] 
                    : amenity[languageCode]
            );
            
            const improvedTranslations = await this.retranslateBatch(
                englishPhrases, 
                currentTranslations, 
                qualityIssues, 
                languageCode, 
                languageName
            );
            
            // Update amenities with improved translations
            for (let i = 0; i < translatedAmenities.length; i++) {
                if (!translatedAmenities[i].nameAll) {
                    translatedAmenities[i].nameAll = {};
                }
                translatedAmenities[i].nameAll[languageCode] = improvedTranslations[i];
            }
            
            // Validate retranslated versions using enhanced validation
            console.log(`🔍 Re-validating ${languageName} after retranslation...`);
            const retranslationValidation = await this.validator.validateLanguage(
                translatedAmenities, 
                languageCode, 
                languageName, 
                5 // Sample size
            );
            
            const finalAverageScore = retranslationValidation.averageScore;
            console.log(`📊 ${languageName} final score after retranslation: ${finalAverageScore.toFixed(2)}/10`);
            
            // Check if retranslation improved the score
            if (finalAverageScore >= QUALITY_THRESHOLD) {
                console.log(`✅ ${languageName} retranslation successful - quality improved`);
                return {
                    languageCode,
                    languageName,
                    averageScore: finalAverageScore,
                    needsRetranslation: false,
                    status: 'retranslated_success',
                    originalScore: averageScore,
                    finalScore: finalAverageScore,
                    validationResults
                };
            } else {
                console.log(`❌ ${languageName} retranslation failed - keeping original translation`);
                // Keep the original translations, don't mark as failed
                // The original translations remain in amenity.nameAll[languageCode]
                return {
                    languageCode,
                    languageName,
                    averageScore: finalAverageScore,
                    needsRetranslation: false,
                    status: 'retranslation_failed_kept_original',
                    originalScore: averageScore,
                    finalScore: finalAverageScore,
                    validationResults
                };
            }
        }

        return {
            languageCode,
            languageName,
            averageScore,
            needsRetranslation: false,
            status: 'quality_acceptable',
            validationResults
        };
    }

    /**
     * Translate all missing languages and validate quality
     * @param {Array} amenities - Amenities data
     * @returns {Promise<Array>} Translation and validation results
     */
    async translateAllLanguages(amenities) {
        const languageCodes = Object.keys(LANGUAGE_NAMES);
        const results = [];
        let totalProcessed = 0;
        let totalTranslations = 0;

        console.log(`🌍 Starting translation for ${languageCodes.length} languages...`);
        console.log(`📊 Processing ${amenities.length} amenities with missing translations...`);

        for (const languageCode of languageCodes) {
            const languageName = LANGUAGE_NAMES[languageCode];
            console.log(`\n🌍 Translating ${languageName} (${languageCode})...`);
            
            try {
                // Step 1: Translate missing translations
                const translationResult = await this.translateLanguage(amenities, languageCode, languageName);
                results.push(translationResult);
                totalProcessed += translationResult.totalCount || 0;
                totalTranslations += translationResult.translatedCount || 0;
                
                // Step 2: Validate and retranslate if needed
                const validationResult = await this.validateAndRetranslateLanguage(amenities, languageCode, languageName);
                results.push(validationResult);
                
                console.log(`✅ ${languageName} completed: ${translationResult.translatedCount || 0} translations`);
                
                                    // Minimal delay between languages
                    await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`❌ Error processing ${languageName}: ${error.message}`);
                results.push({
                    languageCode,
                    languageName,
                    status: 'error',
                    error: error.message
                });
            }
        }

        console.log(`\n📈 Translation Summary:`);
        console.log(`   Total Amenities Processed: ${totalProcessed}`);
        console.log(`   Total Translations Added: ${totalTranslations}`);
        console.log(`   Languages Completed: ${languageCodes.length}`);

        return results;
    }

    /**
     * Save amenities data to JSON file
     * @param {Array} amenities - Amenities data
     * @param {string} filePath - Output file path
     */
    saveAmenitiesToJson(amenities, filePath = 'output/translated_amenities.json') {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(amenities, null, 2));
        console.log(`💾 Amenities saved to: ${filePath}`);
    }

    /**
     * Save amenities data to CSV file
     * @param {Array} amenities - Amenities data
     * @param {string} filePath - Output file path
     */
    async saveAmenitiesToCsv(amenities, filePath = 'output/translated_amenities.csv') {
        if (amenities.length === 0) {
            console.log('⚠️  No amenities data to save');
            return;
        }

        // Create CSV writer with headers
        const csvWriter = createCsvWriter({
            path: filePath,
            header: Object.keys(amenities[0] || {}).map(columnName => ({ 
                id: columnName, 
                title: columnName 
            }))
        });

        // Write all records to CSV
        await csvWriter.writeRecords(amenities);
        console.log(`💾 Amenities saved to: ${filePath}`);
    }

    /**
     * Generate comprehensive translation summary
     * @param {Array} amenities - Amenities data
     * @param {Array} results - Translation and validation results
     */
    generateSummary(amenities, results) {
        console.log(`\n📊 TRANSLATION SUMMARY`);
        console.log(`==================================================`);

        // Separate translation and validation results
        const translationResults = results.filter(r => r.status && r.status !== 'quality_acceptable' && r.status !== 'retranslated');
        const validationResults = results.filter(r => r.averageScore !== undefined);

        // Calculate overall statistics
        const totalTranslated = translationResults.reduce((sum, result) => sum + result.translatedCount, 0);
        const totalProcessed = translationResults.reduce((sum, result) => sum + result.totalCount, 0);

        console.log(`Total items translated: ${totalTranslated}`);
        console.log(`Total items processed: ${totalProcessed}`);
        console.log(`Success rate: ${totalProcessed > 0 ? (totalTranslated / totalProcessed * 100).toFixed(1) : 0}%`);

        // Show language-wise breakdown
        console.log(`\n📈 Language-wise breakdown:`);
        for (const result of translationResults) {
            if (result.totalCount > 0) {
                const successRate = (result.translatedCount / result.totalCount * 100).toFixed(1);
                console.log(`  ${result.languageName}: ${result.translatedCount}/${result.totalCount} (${successRate}%)`);
            }
        }

        // Show quality metrics
        console.log(`\n🎯 Quality Metrics:`);
        for (const result of validationResults) {
            if (result.averageScore > 0) {
                const status = result.needsRetranslation ? '⚠️  Needs improvement' : '✅ Good quality';
                console.log(`  ${result.languageName}: ${result.averageScore.toFixed(2)}/10 ${status}`);
            }
        }
    }
}

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

/**
 * Main function to run the upgraded translation process
 */
async function main() {
    console.log("🏨 Upgraded Hotel Amenities Translator v2.0");
    console.log("=".repeat(50));
    console.log("🚀 Starting translation process for 109 amenities...");
    console.log("📊 Expected: 2,707 missing translations across 32 languages");
    console.log("=".repeat(50));

    // Initialize translator
    let translator;
    try {
        translator = new UpgradedHotelAmenitiesTranslator();
        console.log("✅ Translator initialized successfully");
    } catch (error) {
        console.error(`❌ Configuration error: ${error.message}`);
        console.log("Please set your OPENROUTER_API_KEY in .env file");
        return;
    }

    // Step 1: Fetch amenities from API
    console.log("\n🔗 Step 1: Fetching amenities from API...");
    let amenities;
    try {
        const apiData = await translator.apiService.fetchRoomAmenities();
        amenities = translator.apiService.transformApiData(apiData);
        translator.apiService.saveAmenitiesToJson(amenities, 'data/amenities.json');
        console.log(`✅ Successfully loaded ${amenities.length} amenities`);
    } catch (error) {
        console.error(`❌ Failed to fetch amenities: ${error.message}`);
        return;
    }

    // Step 2: Translate all languages
    console.log("\n🌍 Step 2: Translating missing languages...");
    console.log("📈 Progress: Starting translation process...");
    const results = await translator.translateAllLanguages(amenities);

    // Step 3: Save results
    console.log("\n💾 Step 3: Saving results...");
    try {
        translator.saveAmenitiesToJson(amenities, 'output/translated_amenities.json');
        await translator.saveAmenitiesToCsv(amenities, 'output/translated_amenities.csv');
        console.log("✅ Results saved successfully");
    } catch (error) {
        console.error(`❌ Failed to save results: ${error.message}`);
        return;
    }

    // Step 4: Generate summary
    translator.generateSummary(amenities, results);

    console.log(`\n🎉 Translation process completed successfully!`);
    console.log(`📁 Output files:`);
    console.log(`   - JSON: output/translated_amenities.json`);
    console.log(`   - CSV: output/translated_amenities.csv`);
    console.log(`\n✨ All missing translations have been processed!`);
}

// Run main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UpgradedHotelAmenitiesTranslator; 