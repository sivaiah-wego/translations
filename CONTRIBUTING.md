# Contributing to Hotel Amenities Translator

Thank you for your interest in contributing to the Hotel Amenities Translator project! This document provides guidelines for contributing.

## How to Contribute

### Reporting Issues

1. **Check existing issues** - Before creating a new issue, search the existing issues to see if your problem has already been reported.

2. **Create a detailed issue** - When reporting an issue, please include:
   - A clear description of the problem
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Your operating system and Node.js version
   - Any error messages or logs

### Suggesting Features

1. **Check existing feature requests** - Search existing issues to see if your feature has already been suggested.

2. **Create a feature request** - When suggesting a new feature, please include:
   - A clear description of the feature
   - Use cases and benefits
   - Any implementation ideas you might have

### Code Contributions

1. **Fork the repository** - Create your own fork of the project.

2. **Create a feature branch** - Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** - Write your code following the coding standards below.

4. **Test your changes** - Ensure your changes work correctly:
   ```bash
   npm test
   npm run test-project
   ```

5. **Commit your changes** - Write clear, descriptive commit messages:
   ```bash
   git commit -m "Add feature: brief description of changes"
   ```

6. **Push to your fork** - Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** - Submit a pull request with a clear description of your changes.

## Coding Standards

### JavaScript Style Guide

- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **camelCase** for variable and function names
- Use **PascalCase** for class names
- Add **semicolons** at the end of statements
- Use **const** and **let** instead of **var**
- Use **arrow functions** when appropriate
- Add **JSDoc comments** for functions and classes

### Code Example

```javascript
/**
 * Translates a batch of English phrases to the target language
 * @param {string[]} englishPhrases - Array of English phrases to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} languageName - Human-readable language name
 * @returns {Promise<string[]>} Array of translated phrases
 */
async function translateBatch(englishPhrases, targetLanguage, languageName) {
  const prompt = createTranslationPrompt(englishPhrases, targetLanguage, languageName);
  
  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature,
      max_tokens: maxTokens
    });
    
    return processTranslations(response);
  } catch (error) {
    console.error(`Error translating to ${targetLanguage}:`, error.message);
    return new Array(englishPhrases.length).fill('');
  }
}
```

### File Organization

- Keep related functionality in the same file
- Use descriptive file names
- Group imports at the top of files
- Export classes and functions clearly

### Testing

- Test your changes thoroughly
- Include error handling
- Test with different input scenarios
- Verify API integration works correctly

## Pull Request Guidelines

### Before Submitting

1. **Test thoroughly** - Ensure all tests pass and your changes work as expected
2. **Update documentation** - Update README.md if you've added new features
3. **Check formatting** - Ensure your code follows the style guide
4. **Squash commits** - Combine related commits into logical units

### Pull Request Template

When creating a pull request, please include:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] API integration tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console errors
- [ ] Error handling included
```

## Getting Help

If you need help with contributing:

1. **Check the documentation** - Read the README.md and code comments
2. **Search existing issues** - Your question might already be answered
3. **Create a discussion** - Use GitHub Discussions for questions
4. **Join the community** - Connect with other contributors

## Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the project's coding standards

Thank you for contributing to Hotel Amenities Translator! 