# 🚀 PDF Generation Engine

> **A blazingly fast, feature-rich PDF generation engine built with modern Node.js**

Transform any content into beautiful PDFs with just one command. From simple text to complex JSON structures, this engine handles it all with precision and style.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-purple.svg)](https://render.com/)

---

## ✨ Why This Engine?

Built from the ground up with developer experience in mind, this isn't just another PDF converter. It's a **complete solution** that bridges the gap between content and presentation.

🎯 **Smart Auto-Detection** - Automatically detects content type  
⚡ **Lightning Fast** - Powered by Puppeteer's Chrome engine  
🎨 **Beautiful Output** - Professional styling out of the box  
🌐 **Web Ready** - Full REST API + Interactive web interface  
🐳 **Deploy Anywhere** - Docker-ready for instant deployment

## 🚀 Features That Set Us Apart

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Format Support** | Text, HTML, JSON, Markdown - we've got you covered | ✅ |
| **Intelligent JSON Rendering** | Structured, Table, or Raw display modes | ✅ |
| **Web Interface** | Drag-and-drop file conversion with live preview | ✅ |
| **REST API** | Full-featured API for integration | ✅ |
| **CLI Power** | Command-line interface for automation | ✅ |
| **Smart Templates** | Customizable HTML templates with CSS styling | ✅ |
| **Batch Processing** | Convert multiple files at once | ✅ |
| **Docker Ready** | One-command deployment anywhere | ✅ |
| **Auto-Detection** | Automatically detects input format | ✅ |
| **Production Ready** | Built for scale with proper error handling | ✅ |

## 📋 Supported Input Formats

### 📄 Plain Text
Perfect for documentation, notes, and simple content.
```
Simple text content that gets converted to a clean PDF format.
Multi-line support with automatic formatting.
```

### 🌐 HTML
Full HTML support with CSS styling and complex layouts.
```html
<h1>Rich Content</h1>
<p>Complete HTML support with <strong>styling</strong></p>
<table>
  <tr><td>Tables</td><td>✅ Supported</td></tr>
</table>
```

### 📊 JSON (3 Display Modes!)
- **Structured**: Clean, hierarchical view
- **Table**: Automatic table generation for arrays
- **Raw**: Pretty-printed JSON with syntax highlighting

```json
{
  "title": "Smart JSON Rendering",
  "features": ["Auto-formatting", "Multiple views", "Syntax highlighting"],
  "data": [
    {"name": "Alice", "role": "Developer"},
    {"name": "Bob", "role": "Designer"}
  ]
}
```

### 📝 Markdown
Full CommonMark support with extensions.
```markdown
# Professional Documents
## With **rich** formatting
- Lists and tables
- Code blocks with syntax highlighting
- Links and images
> Blockquotes and more!
```

## ⚡ Quick Start

### Installation
```bash
# Clone this masterpiece
git clone https://github.com/your-username/pdf-generation-engine.git
cd pdf-generation-engine

# Install dependencies
npm install

# Ready to rock! 🎸
```

### 🚀 Instant Usage

```bash
# Convert any file instantly
npm start -- --input document.md --output beautiful.pdf --type markdown

# Convert text on the fly
npm start -- --text "Transform this!" --output magic.pdf --type text

# Launch the web interface
npm start -- --server
# Visit http://localhost:3000 for the interactive interface
```

## 💻 Usage Examples

### 🖥️ Command Line Interface (CLI)

```bash
# Basic conversion
npm start -- --input README.md --output docs.pdf --type markdown

# Advanced options with JSON formatting
npm start -- --input data.json --output report.pdf --type json --format table

# Custom PDF settings
npm start -- --input content.html --output styled.pdf --type html --format A4

# Batch processing
npm start -- --input "*.md" --output batch/ --type markdown
```

### 🌐 Web Interface

The interactive web interface provides:
- 📁 **Drag & Drop** file upload
- 🎛️ **Live format selection** (JSON: Structured/Table/Raw)
- 👀 **Instant preview** before conversion
- ⬇️ **One-click download**

Start the server and visit `http://localhost:3000`:
```bash
npm start -- --server
```

### 🔌 REST API Integration

Our RESTful API is perfect for integrating into your applications:

#### Convert Content Directly
```javascript
const response = await fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '# Hello World\nThis is **markdown**!',
    type: 'markdown',
    options: {
      filename: 'awesome.pdf',
      format: 'A4'
    }
  })
});

const pdfBlob = await response.blob();
```

#### Upload & Convert Files
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'auto'); // Auto-detect format
formData.append('jsonFormat', 'table'); // For JSON files

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});
```

## ⚙️ Advanced Configuration

Customize every aspect of your PDF generation with `config.json`:

```json
{
  "pdf": {
    "format": "A4",           // A4, A3, A5, Legal, Letter, Tabloid
    "margin": {
      "top": "1cm",
      "right": "1cm", 
      "bottom": "1cm",
      "left": "1cm"
    },
    "printBackground": true,   // Include CSS backgrounds
    "preferCSSPageSize": true, // Respect CSS page sizes
    "displayHeaderFooter": false,
    "headerTemplate": "",
    "footerTemplate": ""
  },
  "server": {
    "port": 3000,
    "host": "0.0.0.0"         // Bind to all interfaces
  },
  "templates": {
    "default": "default.html", // Custom template path
    "style": {
      "theme": "professional", // professional, minimal, modern
      "fontFamily": "Arial, sans-serif",
      "fontSize": "12pt"
    }
  }
}
```

### 🎨 Custom Templates

Create your own HTML templates in `src/templates/`:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', sans-serif; }
        .header { border-bottom: 2px solid #007acc; }
        .content { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">{{title}}</div>
    <div class="content">{{content}}</div>
</body>
</html>
```

## 🏗️ Architecture & Project Structure

Built with modern Node.js and ES modules for maximum performance and maintainability.

```
📦 PDF Generation Engine
├── 🚀 src/
│   ├── 📄 index.js                 # Main application entry point
│   ├── 🔄 converters/              # Format-specific converters
│   │   ├── textConverter.js        # Plain text → HTML
│   │   ├── htmlConverter.js        # HTML processing & validation
│   │   ├── jsonConverter.js        # JSON → Formatted display
│   │   └── markdownConverter.js    # Markdown → HTML (CommonMark)
│   ├── ⚡ generators/              # PDF generation engine
│   │   └── pdfGenerator.js         # Puppeteer-powered PDF creation
│   ├── 🌐 server/                  # Web server & API
│   │   ├── app.js                  # Express server with REST API
│   │   └── public/                 # Web interface assets
│   ├── 🛠️  utils/                   # Utility functions
│   │   └── helpers.js              # Config, validation, file operations
│   └── 🎨 templates/               # HTML templates
│       └── default.html            # Professional default template
├── 📚 examples/                    # Sample files for testing
├── 📋 output/                      # Generated PDF files
├── 🐳 Dockerfile                   # Production deployment
├── ⚙️  config.json                 # Configuration file
└── 📖 README.md                    # This beautiful documentation
```

### 🧩 Core Components

- **🔧 Converters**: Modular design for easy extension
- **⚡ PDF Generator**: Puppeteer-based with Chrome rendering
- **🌐 Web Server**: Express.js with CORS and file upload
- **🛠️ Utilities**: Smart content detection and validation
- **🎨 Templates**: Customizable HTML/CSS for beautiful output

## 🎯 Example Gallery

Explore our `examples/` directory for ready-to-use sample files:

### 📄 `example.txt`
```
Clean, professional text formatting with automatic line breaks
and paragraph spacing. Perfect for documentation and reports.
```

### 🌐 `example.html` 
Rich HTML with tables, lists, and styling that renders beautifully in PDF format.

### 📊 `example.json`
```json
{
  "title": "Smart JSON Display",
  "users": [
    {"name": "Alice", "role": "Developer", "experience": "5 years"},
    {"name": "Bob", "role": "Designer", "experience": "3 years"}
  ]
}
```
*Renders as beautiful tables when using `--format table`*

### 📝 `example.md`
```markdown
---
title: Professional Markdown
author: Your Name
---

# Full CommonMark Support
## With syntax highlighting, tables, and more!

| Feature | Status |
|---------|--------|
| Headers | ✅ |
| Tables  | ✅ |
| Code    | ✅ |
```

## 🚀 Deployment Options

### 🐳 Docker Deployment
```bash
# Build the image
docker build -t pdf-engine .

# Run locally
docker run -p 3000:3000 pdf-engine

# Deploy to any cloud platform
```

### ☁️ Cloud Deployment (Render - Recommended)
1. Push to GitHub
2. Connect to Render
3. Deploy automatically with our Dockerfile
4. Get a live URL instantly!

**Why Render?**
- ✅ Free 750 hours/month
- ✅ Perfect Puppeteer support
- ✅ Auto-deploys from Git
- ✅ HTTPS by default

---

## 🎖️ Built With Pride

This engine represents hours of careful engineering, optimization, and attention to detail. Every component is designed for:

- **🚀 Performance** - Lightning-fast PDF generation
- **🔒 Reliability** - Production-ready error handling
- **🎨 Quality** - Beautiful, professional output
- **🔧 Extensibility** - Easy to customize and extend

---

## 📜 License

MIT License - Feel free to use this in your own projects!

---

<div align="center">

**⭐ Star this repo if it helped you create amazing PDFs! ⭐**

*Built with ❤️ and lots of ☕*

</div>
