import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import PdfGenerator from './generators/pdfGenerator.js';
import TextConverter from './converters/textConverter.js';
import HtmlConverter from './converters/htmlConverter.js';
import JsonConverter from './converters/jsonConverter.js';
import MarkdownConverter from './converters/markdownConverter.js';
import { parseArgs, loadConfig, ensureDirectoryExists } from './utils/helpers.js';
import { startServer } from './server/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerationEngine {
  constructor() {
    this.converters = {
      text: new TextConverter(),
      html: new HtmlConverter(),
      json: new JsonConverter(),
      markdown: new MarkdownConverter()
    };
    this.pdfGenerator = new PdfGenerator();
  }

  async convertToPDF(content, type, options = {}) {
    try {
      // Validate input type
      if (!this.converters[type]) {
        throw new Error(`Unsupported content type: ${type}`);
      }

      // Separate converter options from PDF options
      const { format, ...pdfOptions } = options;
      const converterOptions = { format, ...options };

      // Convert content to HTML
      const htmlContent = await this.converters[type].convert(content, converterOptions);
      
      // Generate PDF from HTML (only pass PDF-specific options)
      const pdfBuffer = await this.pdfGenerator.generateFromHTML(htmlContent, pdfOptions);
      
      return pdfBuffer;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  async convertFile(inputPath, outputPath, type, options = {}) {
    try {
      // Read input file
      const content = await fs.readFile(inputPath, 'utf-8');
      
      // Convert to PDF
      const pdfBuffer = await this.convertToPDF(content, type, options);
      
      // Ensure output directory exists
      await ensureDirectoryExists(path.dirname(outputPath));
      
      // Write PDF file
      await fs.writeFile(outputPath, pdfBuffer);
      
      console.log(`✅ PDF generated successfully: ${outputPath}`);
      return outputPath;
    } catch (error) {
      throw new Error(`File conversion failed: ${error.message}`);
    }
  }

  async batchConvert(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.convertFile(file.input, file.output, file.type, options);
        results.push({ success: true, file: result });
      } catch (error) {
        results.push({ success: false, file: file.input, error: error.message });
      }
    }
    
    return results;
  }
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const config = await loadConfig();
    
    const engine = new PDFGenerationEngine();

    // Start server mode
    if (args.server) {
      console.log('🚀 Starting PDF Generation Engine Server...');
      await startServer(engine, config.server);
      return;
    }

    // Command line conversion mode
    if (args.text) {
      // Convert text directly
      const outputPath = args.output || 'output/text-output.pdf';
      
      // Merge config with command-line options
      const options = { ...config.pdf };
      if (args.title) {
        options.title = args.title;
      }
      
      const pdfBuffer = await engine.convertToPDF(args.text, 'text', options);
      
      await ensureDirectoryExists(path.dirname(outputPath));
      await fs.writeFile(outputPath, pdfBuffer);
      console.log(`✅ Text converted to PDF: ${outputPath}`);
      
    } else if (args.input) {
      // Convert file
      const inputPath = args.input;
      const outputPath = args.output || `output/${path.basename(inputPath, path.extname(inputPath))}.pdf`;
      const type = args.type || detectFileType(inputPath);
      
      // Merge config with command-line options
      const options = { ...config.pdf };
      
      // Add format-specific options
      if (args.format) {
        options.format = args.format; // This will be used by converters
      }
      if (args.title) {
        options.title = args.title;
      }
      
      await engine.convertFile(inputPath, outputPath, type, options);
      
    } else if (args.batch) {
      // Batch conversion
      const batchConfig = JSON.parse(await fs.readFile(args.batch, 'utf-8'));
      const results = await engine.batchConvert(batchConfig.files, config.pdf);
      
      console.log('📊 Batch conversion results:');
      results.forEach(result => {
        if (result.success) {
          console.log(`✅ ${result.file}`);
        } else {
          console.log(`❌ ${result.file}: ${result.error}`);
        }
      });
      
    } else {
      // Show usage
      console.log(`
📄 PDF Generation Engine

Usage:
  npm start -- --input <file> --output <output.pdf> --type <type> [options]
  npm start -- --text "content" --output <output.pdf> [options]
  npm start -- --batch <batch-config.json>
  npm start -- --server

Options:
  --input     Input file path
  --output    Output PDF file path
  --type      Content type (text, html, json, markdown)
  --text      Text content to convert
  --batch     Batch configuration file
  --server    Start web server mode
  --format    Display format (for JSON: structured, table, raw)
  --title     Document title

Examples:
  npm start -- --input example.md --output doc.pdf --type markdown
  npm start -- --text "Hello World" --output hello.pdf --title "My Document"
  npm start -- --input data.json --output report.pdf --format table
  npm start -- --input data.json --output raw.pdf --format raw
  npm start -- --server

JSON Format Options:
  --format structured   Color-coded hierarchical view (default)
  --format table        Clean HTML tables for arrays/objects
  --format raw          Plain JSON with syntax highlighting
      `);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.txt': 'text',
    '.html': 'html',
    '.htm': 'html',
    '.json': 'json',
    '.md': 'markdown',
    '.markdown': 'markdown'
  };
  
  return typeMap[ext] || 'text';
}

// Run if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { PDFGenerationEngine };
export default PDFGenerationEngine;
