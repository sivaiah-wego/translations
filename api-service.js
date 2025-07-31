const axios = require('axios');
require('dotenv').config();

/**
 * API Service for fetching room amenities data
 * This service handles communication with external APIs to get hotel amenities
 */
class ApiService {
    
    constructor() {
        // API Configuration - Replace with your actual API endpoint
        this.baseURL = process.env.AMENITIES_API_URL || 'https://api.example.com';
        this.endpoint = process.env.AMENITIES_ENDPOINT || '/amenities/rooms';
        this.timeout = 30000; // 30 seconds timeout
        
        // Initialize axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Fetch all room amenities from the API
     * @returns {Promise<Array>} Array of amenity objects
     */
    async fetchRoomAmenities() {
        try {
            console.log('🔗 Fetching room amenities from API...');
            console.log(`📡 API URL: ${this.baseURL}${this.endpoint}`);
            
            // Use configurable endpoint
            const response = await this.client.get(this.endpoint);
            
            console.log('📊 API Response received');
            
            // Handle the actual API response structure
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                console.log(`✅ Successfully fetched ${response.data.data.length} amenities from API`);
                return response.data.data; // Return the amenities array from the nested structure
            } else if (Array.isArray(response.data)) {
                console.log(`✅ Successfully fetched ${response.data.length} amenities from API`);
                return response.data; // Direct array response
            } else {
                console.error('❌ Unexpected API response format:', JSON.stringify(response.data).substring(0, 200));
                throw new Error('Unexpected API response format');
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch amenities from API:', error.message);
            
            // Fallback to sample data if API fails
            console.log('🔄 Using fallback sample data...');
            return this.getSampleAmenities();
        }
    }

    /**
     * Get sample amenities data for testing/fallback
     * @returns {Array} Sample amenity objects
     */
    getSampleAmenities() {
        return [
            {
                id: 1,
                en: "Free WiFi",
                category: "internet",
                priority: "high"
            },
            {
                id: 2, 
                en: "Air Conditioning",
                category: "comfort",
                priority: "high"
            },
            {
                id: 3,
                en: "Flat-screen TV",
                category: "entertainment", 
                priority: "medium"
            },
            {
                id: 4,
                en: "Mini Refrigerator",
                category: "convenience",
                priority: "medium"
            },
            {
                id: 5,
                en: "Coffee Maker",
                category: "convenience",
                priority: "low"
            },
            {
                id: 6,
                en: "Hair Dryer",
                category: "bathroom",
                priority: "medium"
            },
            {
                id: 7,
                en: "Iron and Ironing Board",
                category: "convenience",
                priority: "low"
            },
            {
                id: 8,
                en: "Safe",
                category: "security",
                priority: "medium"
            },
            {
                id: 9,
                en: "Balcony",
                category: "view",
                priority: "low"
            },
            {
                id: 10,
                en: "Room Service",
                category: "service",
                priority: "high"
            }
        ];
    }

    /**
     * Transform API response to standard format
     * @param {Array} apiData - Raw API response
     * @returns {Array} Standardized amenity objects
     */
    transformApiData(apiData) {
        // Return API data as-is, no transformation needed
        return apiData;
    }

    /**
     * Extract translations from nameAll object in API response
     * @param {Object} item - API item
     * @returns {Object} Existing translations
     */
    extractTranslationsFromNameAll(item) {
        const translations = {};
        
        // Check if nameAll object exists
        if (item.nameAll && typeof item.nameAll === 'object') {
            // Extract all translations from nameAll object
            Object.keys(item.nameAll).forEach(languageCode => {
                if (item.nameAll[languageCode] && item.nameAll[languageCode].trim() !== '') {
                    translations[languageCode] = item.nameAll[languageCode];
                }
            });
        } else {
            // Fallback to direct property extraction
            const languageCodes = [
                'ar', 'de', 'es', 'es419', 'fr', 'it', 'ja', 'ko', 'nl', 'pl', 
                'pt', 'ptBr', 'ru', 'sv', 'th', 'vi', 'zhCn', 'zhHk', 'gu', 'hi',
                'kn', 'ml', 'mr', 'or', 'pa', 'ta', 'te', 'bn', 'fa', 'ms', 'zhTw'
            ];

            languageCodes.forEach(code => {
                if (item[code] && item[code].trim() !== '') {
                    translations[code] = item[code];
                }
            });
        }

        return translations;
    }

    /**
     * Save amenities data to JSON file
     * @param {Array} amenities - Amenities data
     * @param {string} filePath - Output file path
     */
    saveAmenitiesToJson(amenities, filePath = 'data/amenities.json') {
        const fs = require('fs');
        const path = require('path');
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(amenities, null, 2));
        console.log(`💾 Amenities saved to: ${filePath}`);
    }
}

module.exports = ApiService;

// Main execution block
if (require.main === module) {
    (async () => {
        try {
            const apiService = new ApiService();
            const amenities = await apiService.fetchRoomAmenities();
            apiService.saveAmenitiesToJson(amenities);
            console.log(`✅ API service completed. Fetched ${amenities.length} amenities.`);
        } catch (error) {
            console.error('❌ API service failed:', error.message);
            process.exit(1);
        }
    })();
} 