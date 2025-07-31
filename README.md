# 🏨 Upgraded Hotel Amenities Translator v2.0

A comprehensive translation system for hotel amenities with advanced quality validation, API integration, and automatic retranslation capabilities.

## ✨ New Features in v2.0

### 🔗 API Integration
- **External API Support**: Fetch room amenities from external APIs
- **Fallback System**: Automatic fallback to sample data if API fails
- **JSON Input/Output**: Native JSON support for better data handling

### 🌍 Enhanced Translation
- **Context-Aware Prompts**: Specialized prompts for hotel/hospitality context
- **Native Language Focus**: Emphasis on natural, native-sounding translations
- **Batch Processing**: Efficient batch translation with rate limiting
- **Missing Translation Detection**: Only translates missing languages

### 🎯 Quality Validation
- **Per-Language Scoring**: Individual quality scores for each language
- **Detailed Analysis**: Breakdown of accuracy, cultural appropriateness, natural flow, and technical correctness
- **Automatic Retranslation**: Re-translates languages scoring below 8.5/10
- **Quality Thresholds**: Configurable quality thresholds for different standards

### 📊 Advanced Reporting
- **Enhanced Validation Reports**: Detailed quality analysis per language
- **Quality Distribution**: Track excellent, good, acceptable, and needs-improvement languages
- **Export Capabilities**: JSON and CSV export with comprehensive data

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file with your API keys:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
AMENITIES_API_URL=https://srv.wego.com
AMENITIES_ENDPOINT=/hotels/room_amenities?per_page=200
```

### 3. Run the Translator
```bash
npm start
```

### 4. Validate Translations
```bash
npm run validate
```

## 📁 Project Structure

```
translations/
├── translator.js               # Main translator with quality validation
├── api-service.js             # API integration for fetching amenities
├── validate_translations.js   # Enhanced validation with per-language scoring
├── data/
│   └── amenities.json         # Fetched amenities data
├── output/
│   ├── translated_amenities.json    # Final translated amenities
│   └── translated_amenities.csv     # CSV export
└── package.json
```

## 🔧 Configuration

### API Configuration
- **AMENITIES_API_URL**: Your external API base URL for fetching amenities
- **AMENITIES_ENDPOINT**: The specific endpoint path (default: `/amenities/rooms`)
- **OPENROUTER_API_KEY**: OpenRouter API key for translation and validation

### Quality Thresholds
- **EXCELLENT_THRESHOLD**: 9.0 (Excellent quality)
- **GOOD_THRESHOLD**: 7.5 (Good quality)
- **ACCEPTABLE_THRESHOLD**: 6.0 (Acceptable quality)
- **RETRANSLATION_THRESHOLD**: 8.5 (Triggers retranslation)

## 🌍 Supported Languages

The system supports 31 languages:

| Code | Language | Code | Language |
|------|----------|------|----------|
| `ar` | Arabic | `gu` | Gujarati |
| `de` | German | `hi` | Hindi |
| `es` | Spanish | `kn` | Kannada |
| `es419` | Latin American Spanish | `ml` | Malayalam |
| `fr` | French | `mr` | Marathi |
| `it` | Italian | `or` | Odia |
| `ja` | Japanese | `pa` | Punjabi |
| `ko` | Korean | `ta` | Tamil |
| `nl` | Dutch | `te` | Telugu |
| `pl` | Polish | `bn` | Bengali |
| `pt` | Portuguese | `fa` | Persian |
| `ptBr` | Brazilian Portuguese | `ms` | Malay |
| `ru` | Russian | `zhTw` | Taiwan Traditional Chinese |
| `sv` | Swedish | | |
| `th` | Thai | | |
| `vi` | Vietnamese | | |
| `zhCn` | Simplified Chinese | | |
| `zhHk` | Traditional Chinese | | |

## 🔄 Workflow

### 1. API Data Fetching
```javascript
// Fetch amenities from external API
const apiData = await translator.apiService.fetchRoomAmenities();
const amenities = translator.apiService.transformApiData(apiData);
```

### 2. Translation Process
```javascript
// Translate missing languages with quality validation
const results = await translator.translateAllLanguages(amenities);
```

### 3. Quality Validation
```javascript
// Validate each language and retranslate if needed
const validationResult = await translator.validateAndRetranslateLanguage(
    amenities, languageCode, languageName
);
```

### 4. Output Generation
```javascript
// Save results in multiple formats
translator.saveAmenitiesToJson(amenities, 'output/translated_amenities.json');
await translator.saveAmenitiesToCsv(amenities, 'output/translated_amenities.csv');
```

## 📊 Quality Validation

### Validation Criteria
1. **Accuracy (30%)**: Does the translation convey the same meaning?
2. **Cultural Appropriateness (25%)**: Is it suitable for hotel context?
3. **Natural Flow (25%)**: Does it sound native in the target language?
4. **Technical Correctness (20%)**: Are grammar and spelling correct?

### Quality Levels
- **EXCELLENT (≥9.0)**: Perfect or near-perfect translations
- **GOOD (≥7.5)**: High-quality translations with minor issues
- **ACCEPTABLE (≥6.0)**: Adequate translations needing some improvement
- **NEEDS_IMPROVEMENT (<6.0)**: Poor translations requiring significant work

### Automatic Retranslation
Languages scoring below 8.5/10 are automatically retranslated with:
- Specific quality issue feedback
- Enhanced prompts addressing identified problems
- Re-validation after retranslation

## 🛠️ Available Scripts

```bash
# Run the upgraded translator
npm start

# Run legacy translator
npm run start:legacy

# Run enhanced validation
npm run validate:enhanced

# Run legacy validation
npm run validate

# Test API connection
npm test

# Setup project
npm run setup

# Analyze costs
npm run analyze
```

## 📈 Output Files

### JSON Output
```json
{
  "id": "amenity_001",
  "en": "Free WiFi",
  "category": "internet",
  "priority": "high",
  "es": "WiFi gratuito",
  "fr": "WiFi gratuit",
  "de": "Kostenloses WLAN"
}
```

### CSV Output
```csv
id,en,category,priority,es,fr,de
amenity_001,Free WiFi,internet,high,WiFi gratuito,WiFi gratuit,Kostenloses WLAN
```

### Validation Report
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "overallScore": 8.7,
  "totalValidations": 155,
  "qualityDistribution": {
    "excellent": 12,
    "good": 15,
    "acceptable": 3,
    "needsImprovement": 1
  },
  "languageResults": [...]
}
```

## 🔧 Customization

### Adding New Languages
1. Add language code and name to `LANGUAGE_NAMES` object
2. Update API service to handle new language codes
3. Test with sample translations

### Modifying Quality Thresholds
```javascript
// In translator-v2.js
const QUALITY_THRESHOLD = 8.5; // Adjust retranslation threshold
const EXCELLENT_THRESHOLD = 9.0; // Adjust quality levels
const GOOD_THRESHOLD = 7.5;
const ACCEPTABLE_THRESHOLD = 6.0;
```

### Custom API Integration
```javascript
// In api-service.js
async fetchRoomAmenities() {
    // Replace with your API endpoint
    const response = await this.client.get('/your-api-endpoint');
    return response.data;
}
```

## 🚨 Error Handling

### API Failures
- Automatic fallback to sample data
- Detailed error logging
- Graceful degradation

### Translation Errors
- Individual translation error handling
- Batch processing continues despite individual failures
- Error reporting in output files

### Validation Errors
- Retry mechanism for failed validations
- Detailed error logging
- Fallback validation methods

## 📝 Logging

The system provides comprehensive logging:
- 🔗 API connection status
- 🌍 Translation progress per language
- 🔍 Validation results and scores
- ⚠️ Quality issues and recommendations
- 💾 File save confirmations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆚 Version Comparison

| Feature | v1.0 | v2.0 |
|---------|------|------|
| API Integration | ❌ | ✅ |
| JSON Support | ❌ | ✅ |
| Per-Language Validation | ❌ | ✅ |
| Automatic Retranslation | ❌ | ✅ |
| Enhanced Prompts | ❌ | ✅ |
| Quality Thresholds | ❌ | ✅ |
| Detailed Reporting | ❌ | ✅ |
| Error Handling | Basic | Advanced |

## 🎯 Next Steps

- [ ] Add support for more languages
- [ ] Implement translation memory
- [ ] Add web interface
- [ ] Integrate with translation management systems
- [ ] Add machine learning quality prediction 