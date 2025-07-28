# Hotel Amenities Translator

A JavaScript-based translation system for hotel amenities using OpenAI's GPT-3.5-turbo/GPT-4 models via OpenRouter API.

## Features

- **AI-Powered Translation**: Uses OpenAI's GPT-3.5-turbo or GPT-4 for high-quality translations
- **Batch Processing**: Processes multiple translations in a single API call to optimize costs
- **CSV Support**: Reads from and writes to CSV files
- **Multiple Languages**: Supports 30+ languages including Asian languages
- **Cost Optimization**: Batch processing reduces API calls and costs
- **Progress Tracking**: Real-time progress updates during translation
- **Error Handling**: Robust error handling with retry mechanisms
- **Pure JavaScript**: No Python dependencies required

## Prerequisites

- Node.js 16 or higher
- OpenRouter API key
- Internet connection for API calls

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/hotel-amenities-translator.git
   cd hotel-amenities-translator
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Set up your API key**:
   Copy the example environment file and add your API key:
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

## Usage

### Quick Start

1. **Test your API key**:
   ```bash
   npm test
   # or
   node test-api.js
   ```

2. **Run the translator**:
   ```bash
   npm start
   # or
   node translator.js
   ```

### Advanced Usage

1. **Analyze costs before translation**:
   ```bash
   npm run analyze
   # or
   node analyze-costs.js
   ```

2. **Test project setup**:
   ```bash
   npm run test-project
   # or
   node test-project.js
   ```

3. **Run setup wizard**:
   ```bash
   npm run setup
   # or
   node setup.js
   ```

## Project Structure

```
hotel-amenities-translator/
├── data/
│   ├── results.csv          # Input CSV file
│   └── results.csv.example  # Example input format
├── output/                  # Generated CSV files
├── config.js               # Configuration settings
├── translator.js           # Main translation script
├── test-api.js            # API testing script
├── analyze-costs.js       # Cost analysis script
├── test-project.js        # Project testing script
├── setup.js               # Setup wizard
├── validate_translations.js # Translation validation
├── package.json           # Node.js dependencies
├── env.example            # Example environment file
├── .env                   # API key (create this)
├── .gitignore            # Git ignore rules
├── LICENSE               # MIT License
├── CONTRIBUTING.md       # Contributing guidelines
├── CHANGELOG.md          # Version history
└── README.md             # This file
```

## Configuration

Edit `config.js` to customize:

- **Model**: Choose between `openai/gpt-3.5-turbo` (faster, cheaper) or `openai/gpt-4` (better quality)
- **Batch Size**: Number of translations per API call (default: 10)
- **Temperature**: Controls translation creativity (default: 0.3)
- **Languages**: Add or modify supported languages

## Input Format

The `data/results.csv` file should have:
- `id`: Unique identifier
- `en`: English text to translate
- Language columns: `ar`, `de`, `es`, `fr`, etc.

Example:
```csv
id,en,ar,de,es
1,Free WiFi,WiFi مجاني,Kostenloses WLAN,WiFi gratuito
2,Air Conditioning,تكييف الهواء,Klimaanlage,Aire acondicionado
```

## Output

The translator generates `output/translated_amenities_js.csv` with all translations completed.

## Cost Estimation

- **GPT-3.5-turbo**: ~$0.0015 per 1K input tokens, ~$0.002 per 1K output tokens
- **GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens

Use `npm run analyze` to estimate costs before running translations.

## Troubleshooting

### Common Issues

1. **API Key Error (401)**:
   - Ensure your OpenRouter API key is correct
   - Check that the key has sufficient balance
   - Verify the key format starts with `sk-or-v1-`

2. **Module Not Found**:
   - Run `npm install`
   - Ensure you're in the correct directory

3. **CSV File Not Found**:
   - Place your `results.csv` file in the `data/` directory
   - Check file permissions

### Getting Help

1. Run `npm run test-project` to diagnose issues
2. Check the console output for specific error messages
3. Verify your API key with `npm test`

## API Key Setup

1. **Get OpenRouter API Key**:
   - Visit [OpenRouter](https://openrouter.ai/)
   - Sign up and get your API key
   - Add funds to your account

2. **Configure the Key**:
   - Create `.env` file: `OPENROUTER_API_KEY=sk-or-v1-your-key-here`
   - Test with: `npm test`

## Available Scripts

- `npm start` - Run the translator
- `npm test` - Test API key
- `npm run setup` - Setup wizard
- `npm run analyze` - Cost analysis
- `npm run test-project` - Project diagnostics

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes and releases. 