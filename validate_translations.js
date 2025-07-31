const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// ============================================================================
// CONFIGURATION SETTINGS
// ============================================================================

// API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Validation Model: Using GPT-3.5-Turbo for cost-effective validation
const VALIDATION_MODEL = "openai/gpt-3.5-turbo";

// Temperature Setting: 0.1 for consistent validation results
const VALIDATION_TEMPERATURE = 0.1;

// Validation Settings
const DEFAULT_SAMPLE_SIZE = 5;  // Number of translations to validate per language
const DELAY_BETWEEN_VALIDATIONS = 1000; // Milliseconds to avoid rate limiting

// Quality Thresholds
const EXCELLENT_THRESHOLD = 9.0;
const GOOD_THRESHOLD = 7.5;
const ACCEPTABLE_THRESHOLD = 6.0;

// ============================================================================
// LANGUAGE MAPPING FOR VALIDATION
// ============================================================================

// Human-readable language names for better validation prompts
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
// ENHANCED TRANSLATION VALIDATOR CLASS
// ============================================================================

/**
 * EnhancedTranslationValidator - Advanced validation with per-language scoring
 * 
 * This enhanced version includes:
 * 1. Per-language quality scoring
 * 2. Detailed quality analysis
 * 3. Specific improvement recommendations
 * 4. Quality trend analysis
 * 5. Export capabilities for quality reports
 */
class EnhancedTranslationValidator {
    
    /**
     * Initialize the validator with OpenAI client
     * @throws {Error} If API key is not configured
     */
    constructor() {
        // Validate API key configuration
        if (!OPENROUTER_API_KEY) {
            throw new Error("Please set your OPENROUTER_API_KEY in .env file");
        }

        // Initialize OpenAI client for validation
        this.openaiClient = new OpenAI({
            apiKey: OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        // Store validation results and quality metrics
        this.validationResults = [];
        this.qualityMetrics = {};
        this.languageScores = {};
        this.improvementRecommendations = {};
    }

    /**
     * Load JSON data from file
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise<Array>} Array of amenity objects
     */
    async loadAmenitiesFromJson(filePath = 'output/translated_amenities.json') {
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
     * Create enhanced validation prompt for detailed assessment
     * @param {string} englishText - Original English text
     * @param {string} translatedText - Translated text to validate
     * @param {string} languageCode - Language code (e.g., 'es', 'fr')
     * @returns {string} Enhanced validation prompt
     */
    createEnhancedValidationPrompt(englishText, translatedText, languageCode) {
        const languageName = LANGUAGE_NAMES[languageCode];
        
        return `You are a professional translation validator specializing in hotel and hospitality terminology.

Please validate the following translation for a hotel booking website:

ORIGINAL ENGLISH: "${englishText}"
TRANSLATED ${languageName.toUpperCase()}: "${translatedText}"

VALIDATION CRITERIA:
1. Accuracy (30%): Does the translation convey the same meaning as the original?
2. Cultural Appropriateness (25%): Is the translation suitable for hotel amenities and culturally appropriate?
3. Natural Flow (25%): Does the translation sound natural and native in the target language?
4. Technical Correctness (20%): Are grammar, spelling, and terminology correct?

Please provide your assessment in this exact format:
Score: [1-10] (where 10 is perfect)
Accuracy: [brief assessment]
Cultural: [brief assessment]
Natural: [brief assessment]
Technical: [brief assessment]
Issues: [list any specific issues found, or "None" if perfect]
Recommendation: [specific improvement suggestion, or "Excellent" if perfect]

Guidelines:
- Score 9-10: Excellent translation, minor issues at most
- Score 7-8: Good translation with some room for improvement
- Score 5-6: Acceptable but needs improvement
- Score 1-4: Poor translation with significant issues`;
    }

    /**
     * Validate a single translation using enhanced prompts
     * @param {string} englishText - Original English text
     * @param {string} translatedText - Translated text to validate
     * @param {string} languageCode - Language code
     * @returns {Promise<Object>} Enhanced validation result
     */
    async validateSingleTranslation(englishText, translatedText, languageCode) {
        const validationPrompt = this.createEnhancedValidationPrompt(englishText, translatedText, languageCode);
        
        try {
            // Make API call to validate translation
            const apiResponse = await this.openaiClient.chat.completions.create({
                model: VALIDATION_MODEL,
                messages: [{ role: "user", content: validationPrompt }],
                temperature: VALIDATION_TEMPERATURE,
                max_tokens: 300
            });

            const aiResponse = apiResponse.choices[0].message.content;
            
            // Parse the enhanced AI response
            const validationResult = this.parseEnhancedValidationResponse(aiResponse);
            
            return {
                score: validationResult.score,
                accuracy: validationResult.accuracy,
                cultural: validationResult.cultural,
                natural: validationResult.natural,
                technical: validationResult.technical,
                issues: validationResult.issues,
                recommendation: validationResult.recommendation,
                rawResponse: aiResponse
            };
            
        } catch (error) {
            console.error(`❌ Validation error for "${englishText}": ${error.message}`);
            
            // Return error result
            return {
                score: 0,
                accuracy: 'Validation failed',
                cultural: 'Validation failed',
                natural: 'Validation failed',
                technical: 'Validation failed',
                issues: error.message,
                recommendation: 'Check API configuration',
                rawResponse: ''
            };
        }
    }

    /**
     * Parse enhanced AI validation response
     * @param {string} aiResponse - Raw AI response
     * @returns {Object} Parsed validation result
     */
    parseEnhancedValidationResponse(aiResponse) {
        // Extract score using regex
        const scoreMatch = aiResponse.match(/Score:\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        
        // Extract accuracy assessment
        const accuracyMatch = aiResponse.match(/Accuracy:\s*(.+?)(?=\n|$)/);
        const accuracy = accuracyMatch ? accuracyMatch[1].trim() : 'No accuracy assessment';
        
        // Extract cultural assessment
        const culturalMatch = aiResponse.match(/Cultural:\s*(.+?)(?=\n|$)/);
        const cultural = culturalMatch ? culturalMatch[1].trim() : 'No cultural assessment';
        
        // Extract natural flow assessment
        const naturalMatch = aiResponse.match(/Natural:\s*(.+?)(?=\n|$)/);
        const natural = naturalMatch ? naturalMatch[1].trim() : 'No natural flow assessment';
        
        // Extract technical assessment
        const technicalMatch = aiResponse.match(/Technical:\s*(.+?)(?=\n|$)/);
        const technical = technicalMatch ? technicalMatch[1].trim() : 'No technical assessment';
        
        // Extract issues
        const issuesMatch = aiResponse.match(/Issues:\s*(.+?)(?=\n|$)/);
        const issues = issuesMatch ? issuesMatch[1].trim() : 'No issues listed';
        
        // Extract recommendation
        const recommendationMatch = aiResponse.match(/Recommendation:\s*(.+?)(?=\n|$)/);
        const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'No recommendation provided';
        
        return { 
            score, 
            accuracy, 
            cultural, 
            natural, 
            technical, 
            issues, 
            recommendation 
        };
    }

    /**
     * Validate translations for a specific language with detailed analysis
     * @param {Array} amenities - Amenities data
     * @param {string} languageCode - Language code
     * @param {string} languageName - Language name
     * @param {number} sampleSize - Number of translations to validate
     * @returns {Promise<Object>} Detailed validation results
     */
    async validateLanguage(amenities, languageCode, languageName, sampleSize = DEFAULT_SAMPLE_SIZE) {
        console.log(`🔍 Validating ${languageName} (${languageCode}) translations...`);
        
        // Get amenities with translations for this language
        const translatedAmenities = amenities.filter(amenity => {
            if (amenity.nameAll && amenity.nameAll[languageCode]) {
                return amenity.nameAll[languageCode].trim() !== '';
            }
            return amenity[languageCode] && amenity[languageCode].trim() !== '';
        });
        
        if (translatedAmenities.length === 0) {
            console.log(`⚠️  No ${languageName} translations found for validation`);
            return {
                languageCode,
                languageName,
                sampleSize: 0,
                totalTranslations: 0,
                averageScore: 0,
                qualityLevel: 'NO_TRANSLATIONS',
                validationResults: [],
                qualityBreakdown: {
                    accuracy: 0,
                    cultural: 0,
                    natural: 0,
                    technical: 0
                }
            };
        }

        // Select random sample for validation
        const shuffledData = translatedAmenities.sort(() => 0.5 - Math.random());
        const sampleData = shuffledData.slice(0, Math.min(sampleSize, translatedAmenities.length));
        
        console.log(`📊 Validating ${sampleData.length} random samples out of ${translatedAmenities.length} total translations`);

        const validationResults = [];
        let totalScore = 0;
        let totalAccuracy = 0;
        let totalCultural = 0;
        let totalNatural = 0;
        let totalTechnical = 0;

        // Validate each sample translation
        for (let i = 0; i < sampleData.length; i++) {
            const currentRow = sampleData[i];
            const englishText = currentRow.name || currentRow.en;
            const translatedText = currentRow.nameAll && currentRow.nameAll[languageCode] 
                ? currentRow.nameAll[languageCode] 
                : currentRow[languageCode];
            
            console.log(`  ${i + 1}/${sampleData.length}: "${englishText}" → "${translatedText}"`);
            
            // Validate this translation
            const validationResult = await this.validateSingleTranslation(
                englishText, 
                translatedText, 
                languageCode
            );
            
            // Store validation result
            validationResults.push({
                id: currentRow.id,
                englishText,
                translatedText,
                score: validationResult.score,
                accuracy: validationResult.accuracy,
                cultural: validationResult.cultural,
                natural: validationResult.natural,
                technical: validationResult.technical,
                issues: validationResult.issues,
                recommendation: validationResult.recommendation
            });
            
            totalScore += validationResult.score;
            totalAccuracy += this.extractScoreFromAssessment(validationResult.accuracy);
            totalCultural += this.extractScoreFromAssessment(validationResult.cultural);
            totalNatural += this.extractScoreFromAssessment(validationResult.natural);
            totalTechnical += this.extractScoreFromAssessment(validationResult.technical);
            
            // Add delay to avoid API rate limiting
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VALIDATIONS));
        }

        // Calculate average scores
        const averageScore = totalScore / sampleData.length;
        const averageAccuracy = totalAccuracy / sampleData.length;
        const averageCultural = totalCultural / sampleData.length;
        const averageNatural = totalNatural / sampleData.length;
        const averageTechnical = totalTechnical / sampleData.length;

        // Determine quality level
        const qualityLevel = this.determineQualityLevel(averageScore);

        // Store language validation results
        const languageResult = {
            languageCode,
            languageName,
            sampleSize: sampleData.length,
            totalTranslations: translatedAmenities.length,
            averageScore,
            qualityLevel,
            validationResults,
            qualityBreakdown: {
                accuracy: averageAccuracy,
                cultural: averageCultural,
                natural: averageNatural,
                technical: averageTechnical
            }
        };

        this.validationResults.push(languageResult);
        this.languageScores[languageCode] = averageScore;

        console.log(`✅ ${languageName} validation complete - Average score: ${averageScore.toFixed(2)}/10 (${qualityLevel})\n`);

        return languageResult;
    }

    /**
     * Extract numerical score from assessment text
     * @param {string} assessment - Assessment text
     * @returns {number} Numerical score (0-10)
     */
    extractScoreFromAssessment(assessment) {
        const lowerAssessment = assessment.toLowerCase();
        
        if (lowerAssessment.includes('excellent') || lowerAssessment.includes('perfect')) return 9.5;
        if (lowerAssessment.includes('very good') || lowerAssessment.includes('good')) return 8.0;
        if (lowerAssessment.includes('acceptable') || lowerAssessment.includes('adequate')) return 6.5;
        if (lowerAssessment.includes('poor') || lowerAssessment.includes('bad')) return 3.0;
        if (lowerAssessment.includes('failed') || lowerAssessment.includes('error')) return 0;
        
        return 5.0; // Default score
    }

    /**
     * Determine quality level based on score
     * @param {number} score - Average score
     * @returns {string} Quality level
     */
    determineQualityLevel(score) {
        if (score >= EXCELLENT_THRESHOLD) return 'EXCELLENT';
        if (score >= GOOD_THRESHOLD) return 'GOOD';
        if (score >= ACCEPTABLE_THRESHOLD) return 'ACCEPTABLE';
        return 'NEEDS_IMPROVEMENT';
    }

    /**
     * Run validation for all languages in the dataset
     * @param {string} inputFilePath - Path to JSON file (default: 'output/translated_amenities.json')
     */
    async runValidation(inputFilePath = 'output/translated_amenities.json') {
        console.log("🔍 Enhanced Translation Validation Tool");
        console.log("=" * 50);
        
        try {
            // Load JSON data
            const amenities = await this.loadAmenitiesFromJson(inputFilePath);
            console.log(`📊 Loaded ${amenities.length} amenities from ${inputFilePath}`);
            
            // Get all language codes to validate
            const languageCodes = Object.keys(LANGUAGE_NAMES);
            console.log(`🌍 Found ${languageCodes.length} language columns to validate\n`);

            // Validate translations for each language
            for (const languageCode of languageCodes) {
                const languageName = LANGUAGE_NAMES[languageCode];
                await this.validateLanguage(amenities, languageCode, languageName, 5);
            }

            // Generate and display enhanced validation report
            this.generateEnhancedValidationReport();
            
        } catch (error) {
            console.error(`❌ Validation failed: ${error.message}`);
        }
    }

    /**
     * Generate comprehensive enhanced validation report
     */
    generateEnhancedValidationReport() {
        console.log("\n📊 ENHANCED VALIDATION REPORT");
        console.log("=" * 50);

        let overallAverageScore = 0;
        let totalValidations = 0;
        let excellentCount = 0;
        let goodCount = 0;
        let acceptableCount = 0;
        let needsImprovementCount = 0;

        // Process results for each language
        this.validationResults.forEach(languageResult => {
            console.log(`\n🌍 ${languageResult.languageName} (${languageResult.languageCode})`);
            console.log(`   Sample size: ${languageResult.sampleSize}/${languageResult.totalTranslations}`);
            console.log(`   Average score: ${languageResult.averageScore.toFixed(2)}/10`);
            console.log(`   Quality level: ${languageResult.qualityLevel}`);
            
            // Show quality breakdown
            const breakdown = languageResult.qualityBreakdown;
            console.log(`   Quality breakdown:`);
            console.log(`     Accuracy: ${breakdown.accuracy.toFixed(2)}/10`);
            console.log(`     Cultural: ${breakdown.cultural.toFixed(2)}/10`);
            console.log(`     Natural: ${breakdown.natural.toFixed(2)}/10`);
            console.log(`     Technical: ${breakdown.technical.toFixed(2)}/10`);
            
            // Show issues for low-scoring translations
            const lowQualityTranslations = languageResult.validationResults.filter(v => v.score < 7);
            if (lowQualityTranslations.length > 0) {
                console.log(`   ⚠️  ${lowQualityTranslations.length} translations scored below 7:`);
                lowQualityTranslations.forEach(translation => {
                    console.log(`      "${translation.englishText}" → "${translation.translatedText}" (Score: ${translation.score})`);
                    console.log(`      Issues: ${translation.issues}`);
                    console.log(`      Recommendation: ${translation.recommendation}`);
                });
            }

            // Accumulate scores for overall statistics
            overallAverageScore += languageResult.averageScore * languageResult.sampleSize;
            totalValidations += languageResult.sampleSize;
            
            // Count quality levels
            switch (languageResult.qualityLevel) {
                case 'EXCELLENT': excellentCount++; break;
                case 'GOOD': goodCount++; break;
                case 'ACCEPTABLE': acceptableCount++; break;
                case 'NEEDS_IMPROVEMENT': needsImprovementCount++; break;
            }
        });

        // Calculate overall average
        overallAverageScore = overallAverageScore / totalValidations;

        // Display overall results
        console.log(`\n📈 OVERALL RESULTS`);
        console.log(`   Total validations: ${totalValidations}`);
        console.log(`   Overall average score: ${overallAverageScore.toFixed(2)}/10`);
        console.log(`   Quality distribution:`);
        console.log(`     Excellent (≥${EXCELLENT_THRESHOLD}): ${excellentCount} languages`);
        console.log(`     Good (≥${GOOD_THRESHOLD}): ${goodCount} languages`);
        console.log(`     Acceptable (≥${ACCEPTABLE_THRESHOLD}): ${acceptableCount} languages`);
        console.log(`     Needs Improvement (<${ACCEPTABLE_THRESHOLD}): ${needsImprovementCount} languages`);
        
        // Provide quality assessment
        if (overallAverageScore >= EXCELLENT_THRESHOLD) {
            console.log(`   🎉 Excellent overall translation quality!`);
        } else if (overallAverageScore >= GOOD_THRESHOLD) {
            console.log(`   ✅ Good overall translation quality`);
        } else if (overallAverageScore >= ACCEPTABLE_THRESHOLD) {
            console.log(`   ⚠️  Acceptable translation quality, some improvements needed`);
        } else {
            console.log(`   ❌ Translation quality needs significant improvement`);
        }

        // Save detailed report to JSON file
        this.saveDetailedReport(overallAverageScore, totalValidations, {
            excellent: excellentCount,
            good: goodCount,
            acceptable: acceptableCount,
            needsImprovement: needsImprovementCount
        });
    }

    /**
     * Save detailed validation report to JSON file
     * @param {number} overallScore - Overall average score
     * @param {number} totalValidations - Total number of validations
     * @param {Object} qualityDistribution - Quality level distribution
     */
    saveDetailedReport(overallScore, totalValidations, qualityDistribution) {
        const reportData = {
            timestamp: new Date().toISOString(),
            overallScore,
            totalValidations,
            qualityDistribution,
            languageResults: this.validationResults
        };

        const reportPath = 'output/enhanced_validation_report.json';
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    }
}

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

/**
 * Main function to run enhanced translation validation
 */
async function main() {
    console.log("🔍 Starting enhanced translation validation...\n");

    let validator;
    try {
        validator = new EnhancedTranslationValidator();
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

// Run main function if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = EnhancedTranslationValidator; 