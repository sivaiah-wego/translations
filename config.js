require('dotenv').config();

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = "openai/gpt-3.5-turbo";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 1000;

// Translation Configuration
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 1000; // milliseconds

// Language mapping for better prompts
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
    'zhTw': 'Taiwan Traditional Chinese',
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
    'ms': 'Malay'
};

module.exports = {
    OPENROUTER_API_KEY,
    MODEL_NAME,
    TEMPERATURE,
    MAX_TOKENS,
    BATCH_SIZE,
    DELAY_BETWEEN_BATCHES,
    LANGUAGE_NAMES
}; 