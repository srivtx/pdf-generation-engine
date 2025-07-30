import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseArgs(args) {
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[i + 1];
        i++; // Skip next argument as it's the value
      } else {
        parsed[key] = true; // Flag without value
      }
    }
  }
  
  return parsed;
}

export async function loadConfig() {
  const configPath = path.join(process.cwd(), 'config.json');
  
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    // Return default configuration if config file doesn't exist
    return {
      pdf: {
        format: 'A4',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: true,
        preferCSSPageSize: true
      },
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0'
      }
    };
  }
}

export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export async function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    // Return default template if template file doesn't exist
    return getDefaultTemplate();
  }
}

function getDefaultTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        {{style}}
    </style>
</head>
<body>
    <div class="content">
        <h1>{{title}}</h1>
        <div class="document-content">
            {{content}}
        </div>
    </div>
</body>
</html>`;
}

export function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function sanitizeFilename(filename) {
  // Remove or replace invalid characters for file names
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function detectContentType(content) {
  const trimmed = content.trim();
  
  // Check for JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // Check for HTML
  if (trimmed.includes('<') && trimmed.includes('>')) {
    const htmlPattern = /<\/?[a-z][\s\S]*>/i;
    if (htmlPattern.test(trimmed)) {
      return 'html';
    }
  }
  
  // Check for Markdown
  const markdownPatterns = [
    /^#{1,6}\s+/, // Headers
    /^\*\s+/, // Unordered lists
    /^\d+\.\s+/, // Ordered lists
    /\*\*.*\*\*/, // Bold
    /\*.*\*/, // Italic
    /\[.*\]\(.*\)/, // Links
    /```/, // Code blocks
    /^>/, // Blockquotes
  ];
  
  if (markdownPatterns.some(pattern => pattern.test(trimmed))) {
    return 'markdown';
  }
  
  // Default to text
  return 'text';
}

export function validatePdfOptions(options) {
  const validFormats = ['A4', 'A3', 'A5', 'Legal', 'Letter', 'Tabloid'];
  const errors = [];
  
  if (options.format && !validFormats.includes(options.format)) {
    errors.push(`Invalid format: ${options.format}. Valid formats: ${validFormats.join(', ')}`);
  }
  
  if (options.margin) {
    const marginKeys = ['top', 'right', 'bottom', 'left'];
    if (typeof options.margin === 'object') {
      Object.keys(options.margin).forEach(key => {
        if (!marginKeys.includes(key)) {
          errors.push(`Invalid margin key: ${key}. Valid keys: ${marginKeys.join(', ')}`);
        }
      });
    }
  }
  
  return errors;
}

export async function createExampleFiles() {
  const examplesDir = path.join(process.cwd(), 'examples');
  await ensureDirectoryExists(examplesDir);
  
  const examples = {
    'example.txt': `This is a simple text document.

It contains multiple paragraphs to demonstrate
how plain text is converted to PDF format.

The converter will automatically format line breaks
and create a clean, readable document.`,

    'example.html': `<h1>HTML Document Example</h1>
<h2>Features</h2>
<p>This HTML document demonstrates various HTML elements:</p>
<ul>
    <li><strong>Bold text</strong></li>
    <li><em>Italic text</em></li>
    <li><a href="https://example.com">Links</a></li>
</ul>
<h3>Table Example</h3>
<table>
    <thead>
        <tr><th>Name</th><th>Age</th><th>City</th></tr>
    </thead>
    <tbody>
        <tr><td>John</td><td>30</td><td>New York</td></tr>
        <tr><td>Jane</td><td>25</td><td>London</td></tr>
    </tbody>
</table>`,

    'example.json': JSON.stringify({
      title: "Sample JSON Document",
      author: "PDF Generator",
      data: {
        users: [
          { name: "Alice", age: 30, role: "Developer" },
          { name: "Bob", age: 25, role: "Designer" },
          { name: "Charlie", age: 35, role: "Manager" }
        ],
        settings: {
          theme: "dark",
          language: "en",
          notifications: true
        }
      },
      metadata: {
        created: "2024-01-01",
        version: "1.0.0"
      }
    }, null, 2),

    'example.md': `---
title: Markdown Example Document
author: PDF Generator
date: 2024-01-01
---

# Markdown Document Example

This is a comprehensive example of **Markdown** formatting.

## Text Formatting

- **Bold text**
- *Italic text*
- ~~Strikethrough text~~
- \`Inline code\`

## Lists

### Unordered List
- Item 1
- Item 2
  - Nested item
  - Another nested item

### Ordered List
1. First item
2. Second item
3. Third item

## Code Block

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

## Table

| Name    | Age | City      |
|---------|-----|-----------|
| Alice   | 30  | New York  |
| Bob     | 25  | London    |
| Charlie | 35  | Paris     |

## Blockquote

> This is a blockquote example.
> It can span multiple lines.

## Links and Images

[Visit Example.com](https://example.com)

## Horizontal Rule

---

That's all for this example!`
  };
  
  for (const [filename, content] of Object.entries(examples)) {
    const filePath = path.join(examplesDir, filename);
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, content, 'utf-8');
      }
    }
  }
  
  console.log(`📁 Example files created in: ${examplesDir}`);
}

export function logProgress(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const prefix = {
    info: '📄',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📄';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}
