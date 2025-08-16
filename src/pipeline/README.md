# Question Processing Pipeline

A simple data pipeline that processes German citizenship test questions using OpenAI's API to enhance them with correct answers, hints, explanations, and English translations.

## Architecture

This pipeline follows SOLID principles and onion architecture:

- **Domain Layer**: Core types and business logic
- **Interface Layer**: Contracts and abstractions
- **Service Layer**: Business logic implementation
- **Infrastructure Layer**: External dependencies (OpenAI API, File System)

## Pipeline Steps

1. **Load Questions**: Read raw questions from JSON file
2. **Find Correct Answer**: Use OpenAI to identify the correct option index
3. **Generate Hint**: Create helpful hints for each question
4. **Generate Explanation**: Provide explanations for correct answers
5. **Schema Mapping**: Map to the target schema format
6. **Translate**: Convert all content to English
7. **Save**: Write processed files to the postprocess directory

## Usage

1. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. Run the pipeline:
   ```bash
   npm run pipeline
   ```

## Output

The pipeline generates two files in the `data/postprocess/` directory:
- `questions_de.json` - Processed German questions
- `questions_en.json` - Translated English questions

## Rate Limiting

The pipeline includes a 500ms delay between OpenAI API calls to respect rate limits and avoid overwhelming the service.
