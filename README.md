# PDF Generation Engine

A simple yet powerful PDF generation engine that converts various input formats to PDF files.

## Features

- ✅ Convert **Text** to PDF
- ✅ Convert **HTML** to PDF  
- ✅ Convert **JSON** to formatted PDF
- ✅ Convert **Markdown** to PDF
- ✅ Web API interface
- ✅ Command-line interface
- ✅ Customizable styling
- ✅ Batch processing support

## Supported Input Formats

### 1. Plain Text
```
Simple text content that gets converted to a clean PDF format.
```

### 2. HTML
```html
<h1>Title</h1>
<p>Your HTML content here</p>
```

### 3. JSON
```json
{
  "title": "Document Title",
  "content": "Document content",
  "data": [...]
}
```

### 4. Markdown
```markdown
# Title
## Subtitle
- List item 1
- List item 2
```

## Installation

```bash
npm install
```

## Usage

### Command Line Interface

```bash
# Convert a file to PDF
npm start -- --input input.md --output output.pdf --type markdown

# Convert text directly
npm start -- --text "Hello World" --output hello.pdf --type text

# Start web server
npm start -- --server
```

### Web API

Start the server:
```bash
npm start -- --server
```

Then use the API endpoints:

#### POST /api/convert
Convert content to PDF:

```javascript
fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Your content here',
    type: 'markdown', // text, html, json, markdown
    options: {
      filename: 'output.pdf',
      format: 'A4',
      margin: '1cm'
    }
  })
})
```

#### POST /api/upload
Upload a file to convert:

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'markdown');

fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
})
```

## Configuration

Create a `config.json` file to customize default settings:

```json
{
  "pdf": {
    "format": "A4",
    "margin": {
      "top": "1cm",
      "right": "1cm", 
      "bottom": "1cm",
      "left": "1cm"
    },
    "printBackground": true,
    "preferCSSPageSize": true
  },
  "server": {
    "port": 3000,
    "host": "localhost"
  }
}
```

## Project Structure

```
├── src/
│   ├── index.js           # Main entry point
│   ├── converters/        # Format-specific converters
│   │   ├── textConverter.js
│   │   ├── htmlConverter.js
│   │   ├── jsonConverter.js
│   │   └── markdownConverter.js
│   ├── generators/        # PDF generation logic
│   │   └── pdfGenerator.js
│   ├── server/           # Web server
│   │   └── app.js
│   ├── utils/            # Utility functions
│   │   └── helpers.js
│   └── templates/        # HTML templates
│       └── default.html
├── examples/             # Example input files
├── output/              # Generated PDF files
└── config.json         # Configuration file
```

## Examples

See the `examples/` directory for sample input files in different formats.

## License

MIT License
