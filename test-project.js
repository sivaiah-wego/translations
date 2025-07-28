const fs = require('fs');
const path = require('path');

function testProjectStructure() {
    console.log("🧪 Testing Project Structure");
    console.log("=" * 50);

    const requiredFiles = [
        'package.json',
        'config.js',
        'translator.js',
        'test-api.js',
        'setup.js',
        'analyze-costs.js',
        '.env'
    ];

    const requiredDirs = [
        'data',
        'output'
    ];

    let allGood = true;

    // Test required files
    console.log("\n📁 Checking required files:");
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${file}`);
        } else {
            console.log(`  ❌ ${file} - Missing`);
            allGood = false;
        }
    }

    // Test required directories
    console.log("\n📂 Checking required directories:");
    for (const dir of requiredDirs) {
        const dirPath = path.join(__dirname, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`  ✅ ${dir}/`);
        } else {
            console.log(`  ❌ ${dir}/ - Missing`);
            allGood = false;
        }
    }

    // Test data file
    const csvPath = path.join(__dirname, 'data', 'results.csv');
    if (fs.existsSync(csvPath)) {
        console.log(`  ✅ data/results.csv`);
    } else {
        console.log(`  ❌ data/results.csv - Missing`);
        allGood = false;
    }

    return allGood;
}

function testImports() {
    console.log("\n📦 Testing module imports:");
    
    try {
        require('./config');
        console.log("  ✅ config.js");
    } catch (error) {
        console.log(`  ❌ config.js - ${error.message}`);
        return false;
    }

    try {
        require('./translator');
        console.log("  ✅ translator.js");
    } catch (error) {
        console.log(`  ❌ translator.js - ${error.message}`);
        return false;
    }

    try {
        require('./test-api');
        console.log("  ✅ test-api.js");
    } catch (error) {
        console.log(`  ❌ test-api.js - ${error.message}`);
        return false;
    }

    return true;
}

function testConfiguration() {
    console.log("\n⚙️  Testing configuration:");
    
    try {
        const { OPENROUTER_API_KEY, MODEL_NAME, LANGUAGE_NAMES } = require('./config');
        
        if (OPENROUTER_API_KEY) {
            console.log(`  ✅ API Key configured (${OPENROUTER_API_KEY.length} characters)`);
        } else {
            console.log("  ❌ API Key not configured");
            return false;
        }

        if (MODEL_NAME) {
            console.log(`  ✅ Model configured: ${MODEL_NAME}`);
        } else {
            console.log("  ❌ Model not configured");
            return false;
        }

        if (LANGUAGE_NAMES && Object.keys(LANGUAGE_NAMES).length > 0) {
            console.log(`  ✅ Language names configured (${Object.keys(LANGUAGE_NAMES).length} languages)`);
        } else {
            console.log("  ❌ Language names not configured");
            return false;
        }

        return true;
    } catch (error) {
        console.log(`  ❌ Configuration error: ${error.message}`);
        return false;
    }
}

async function testDataLoading() {
    console.log("\n📊 Testing data loading:");
    
    try {
        const csvPath = path.join(__dirname, 'data', 'results.csv');
        if (!fs.existsSync(csvPath)) {
            console.log("  ❌ results.csv not found");
            return false;
        }

        const csv = require('csv-parser');
        const results = [];
        
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    console.log(`  ✅ Loaded ${results.length} rows from results.csv`);
                    if (results.length > 0) {
                        console.log(`  ✅ Columns: ${Object.keys(results[0]).join(', ')}`);
                    }
                    resolve();
                })
                .on('error', reject);
        });

        return true;
    } catch (error) {
        console.log(`  ❌ Data loading error: ${error.message}`);
        return false;
    }
}

async function testTranslatorClass() {
    console.log("\n🔧 Testing translator class:");
    
    try {
        const HotelAmenitiesTranslator = require('./translator');
        
        // Test if we can create an instance (this will fail if API key is missing, which is expected)
        try {
            const translator = new HotelAmenitiesTranslator();
            console.log("  ✅ Translator class instantiated successfully");
            return true;
        } catch (error) {
            if (error.message.includes("OPENROUTER_API_KEY")) {
                console.log("  ⚠️  Translator class works (API key not configured - expected)");
                return true;
            } else {
                console.log(`  ❌ Translator class error: ${error.message}`);
                return false;
            }
        }
    } catch (error) {
        console.log(`  ❌ Translator class import error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log("🏨 Hotel Amenities Translator - Project Test");
    console.log("=" * 60);

    const tests = [
        { name: "Project Structure", test: testProjectStructure },
        { name: "Module Imports", test: testImports },
        { name: "Configuration", test: testConfiguration },
        { name: "Data Loading", test: testDataLoading },
        { name: "Translator Class", test: testTranslatorClass }
    ];

    let allPassed = true;

    for (const test of tests) {
        try {
            const result = await test.test();
            if (!result) {
                allPassed = false;
            }
        } catch (error) {
            console.log(`  ❌ ${test.name} failed: ${error.message}`);
            allPassed = false;
        }
    }

    console.log("\n" + "=" * 60);
    if (allPassed) {
        console.log("🎉 All tests passed! Project is ready to use.");
        console.log("\nNext steps:");
        console.log("1. Run 'node test-api.js' to test your API key");
        console.log("2. Run 'node translator.js' to start translation");
    } else {
        console.log("❌ Some tests failed. Please fix the issues above.");
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests }; 