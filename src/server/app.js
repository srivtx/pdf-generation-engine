import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeFilename, detectContentType, validatePdfOptions, logProgress } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

class PDFServer {
  constructor(pdfEngine, config = {}) {
    this.pdfEngine = pdfEngine;
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Serve static files from public directory
    const publicDir = path.join(process.cwd(), 'public');
    this.app.use(express.static(publicDir));
    
    // Request logging
    this.app.use((req, res, next) => {
      logProgress(`${req.method} ${req.path}`, 'info');
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API routes
    this.app.post('/api/convert', this.handleConvert.bind(this));
    this.app.post('/api/upload', upload.single('file'), this.handleUpload.bind(this));
    this.app.get('/api/formats', this.handleGetFormats.bind(this));
    this.app.post('/api/batch', this.handleBatch.bind(this));

    // Web interface
    this.app.get('/', this.handleHome.bind(this));
    
    // Error handling
    this.app.use(this.handleError.bind(this));
  }

  async handleConvert(req, res) {
    try {
      const { content, type, options = {} } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Auto-detect content type if not provided
      const contentType = type || detectContentType(content);
      
      // Validate PDF options (excluding converter-specific options like format)
      const { format, title, ...pdfOnlyOptions } = options;
      const validationErrors = validatePdfOptions(pdfOnlyOptions);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid PDF options',
          details: validationErrors
        });
      }

      logProgress(`Converting ${contentType} content to PDF${format ? ` (format: ${format})` : ''}`, 'info');
      
      // Generate PDF with all options
      const pdfBuffer = await this.pdfEngine.convertToPDF(content, contentType, options);
      
      // Set response headers
      const filename = sanitizeFilename(options.filename || `document-${Date.now()}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      logProgress(`PDF generated successfully: ${filename}`, 'success');
      res.send(pdfBuffer);

    } catch (error) {
      logProgress(`Conversion error: ${error.message}`, 'error');
      res.status(500).json({ 
        error: 'PDF generation failed',
        message: error.message
      });
    }
  }

  async handleUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type, ...options } = req.body;
      const content = req.file.buffer.toString('utf-8');
      
      // Auto-detect content type from file extension or content
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const detectedType = this.getTypeFromExtension(fileExt) || detectContentType(content);
      const contentType = type || detectedType;

      logProgress(`Processing uploaded file: ${req.file.originalname} (${contentType})`, 'info');
      
      // Generate PDF
      const pdfBuffer = await this.pdfEngine.convertToPDF(content, contentType, options);
      
      // Generate filename
      const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const filename = sanitizeFilename(`${baseName}.pdf`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      logProgress(`File converted successfully: ${filename}`, 'success');
      res.send(pdfBuffer);

    } catch (error) {
      logProgress(`Upload conversion error: ${error.message}`, 'error');
      res.status(500).json({ 
        error: 'File conversion failed',
        message: error.message
      });
    }
  }

  async handleBatch(req, res) {
    try {
      const { files, options = {} } = req.body;

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'Files array is required' });
      }

      logProgress(`Processing batch of ${files.length} files`, 'info');
      
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const { content, type, filename } = file;
          const contentType = type || detectContentType(content);
          
          const pdfBuffer = await this.pdfEngine.convertToPDF(content, contentType, options);
          
          results.push({
            index: i,
            filename: filename || `document-${i + 1}.pdf`,
            success: true,
            size: pdfBuffer.length,
            pdf: pdfBuffer.toString('base64')
          });
          
        } catch (error) {
          results.push({
            index: i,
            filename: file.filename || `document-${i + 1}.pdf`,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      logProgress(`Batch processing complete: ${successCount}/${files.length} successful`, 'success');
      
      res.json({
        success: true,
        totalFiles: files.length,
        successCount,
        results
      });

    } catch (error) {
      logProgress(`Batch processing error: ${error.message}`, 'error');
      res.status(500).json({ 
        error: 'Batch processing failed',
        message: error.message
      });
    }
  }

  handleGetFormats(req, res) {
    res.json({
      supportedTypes: ['text', 'html', 'json', 'markdown'],
      pdfFormats: ['A4', 'A3', 'A5', 'Legal', 'Letter', 'Tabloid'],
      defaultOptions: {
        format: 'A4',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: true
      }
    });
  }

  async handleHome(req, res) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Generation Engine</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { color: #2c3e50; margin-bottom: 1rem; }
            .section { margin: 2rem 0; padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; }
            .form-group { margin: 1rem 0; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
            input, select, textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
            textarea { height: 150px; resize: vertical; }
            button { background: #007acc; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; position: relative; }
            button:hover { background: #005a9a; }
            button:disabled { background: #ccc; cursor: not-allowed; }
            .spinner { display: none; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #007acc; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .example { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 0.5rem 0; }
            .tabs { display: flex; margin-bottom: 1rem; }
            .tab { padding: 0.5rem 1rem; background: #f8f9fa; border: 1px solid #ddd; cursor: pointer; }
            .tab.active { background: #007acc; color: white; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📄 PDF Generation Engine</h1>
            <p>Convert text, HTML, JSON, and Markdown to PDF files.</p>
            
            <div class="tabs">
                <div class="tab active" onclick="showTab('convert')">Convert Text</div>
                <div class="tab" onclick="showTab('upload')">Upload File</div>
                <div class="tab" onclick="showTab('api')">API Docs</div>
            </div>
            
            <div id="convert" class="tab-content active">
                <div class="section">
                    <h2>Convert Content to PDF</h2>
                    <form id="convertForm">
                        <div class="form-group">
                            <label for="contentType">Content Type:</label>
                            <select id="contentType" name="type" onchange="toggleFormatOptions()">
                                <option value="text">Plain Text</option>
                                <option value="html">HTML</option>
                                <option value="json">JSON</option>
                                <option value="markdown">Markdown</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="formatGroup" style="display: none;">
                            <label for="format">JSON Display Format:</label>
                            <select id="format" name="format">
                                <option value="structured">Structured (Color-coded hierarchy)</option>
                                <option value="table">Table (Clean tables for arrays)</option>
                                <option value="raw">Raw (Plain JSON code)</option>
                            </select>
                            <small>Choose how JSON data should be displayed in the PDF</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="content">Content:</label>
                            <textarea id="content" name="content" placeholder="Enter your content here..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="filename">Filename (optional):</label>
                            <input type="text" id="filename" name="filename" placeholder="document.pdf">
                        </div>
                        
                        <div class="form-group">
                            <label for="title">Document Title (optional):</label>
                            <input type="text" id="title" name="title" placeholder="My Document">
                        </div>
                        
                        <button type="submit" id="convertBtn">
                            <span class="spinner" id="convertSpinner"></span>
                            <span id="convertText">Generate PDF</span>
                        </button>
                    </form>
                </div>
            </div>
            
            <div id="upload" class="tab-content">
                <div class="section">
                    <h2>Upload File to Convert</h2>
                    <form id="uploadForm" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="file">Select File:</label>
                            <input type="file" id="file" name="file" accept=".txt,.html,.json,.md,.markdown">
                        </div>
                        
                        <div class="form-group">
                            <label for="uploadType">Force Content Type (optional):</label>
                            <select id="uploadType" name="type">
                                <option value="">Auto-detect</option>
                                <option value="text">Plain Text</option>
                                <option value="html">HTML</option>
                                <option value="json">JSON</option>
                                <option value="markdown">Markdown</option>
                            </select>
                        </div>
                        
                        <button type="submit" id="uploadBtn">
                            <span class="spinner" id="uploadSpinner"></span>
                            <span id="uploadText">Upload & Convert</span>
                        </button>
                    </form>
                </div>
            </div>
            
            <div id="api" class="tab-content">
                <div class="section">
                    <h2>API Documentation</h2>
                    
                    <h3>POST /api/convert</h3>
                    <div class="example">
                        <pre>{
  "content": "Your content here",
  "type": "json",
  "options": {
    "filename": "output.pdf",
    "title": "My Document",
    "format": "table",
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    }
  }
}</pre>
                    </div>
                    
                    <h4>JSON Format Options:</h4>
                    <ul>
                        <li><strong>structured</strong>: Color-coded hierarchical view (default)</li>
                        <li><strong>table</strong>: Clean HTML tables for arrays and objects</li>
                        <li><strong>raw</strong>: Plain JSON with syntax highlighting</li>
                    </ul>
                    
                    <h3>POST /api/upload</h3>
                    <p>Upload a file with form data. Include 'file' field and optional 'type' field.</p>
                    
                    <h3>GET /api/formats</h3>
                    <p>Get supported formats and default options.</p>
                </div>
            </div>
        </div>
        
        <script>
            function showTab(tabName) {
                document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                event.target.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            }
            
            function toggleFormatOptions() {
                const contentType = document.getElementById('contentType').value;
                const formatGroup = document.getElementById('formatGroup');
                
                if (contentType === 'json') {
                    formatGroup.style.display = 'block';
                } else {
                    formatGroup.style.display = 'none';
                }
            }
            
            document.getElementById('convertForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Show spinner
                const btn = document.getElementById('convertBtn');
                const spinner = document.getElementById('convertSpinner');
                const text = document.getElementById('convertText');
                btn.disabled = true;
                spinner.style.display = 'inline-block';
                text.textContent = 'Generating...';
                
                const formData = new FormData(e.target);
                const data = {
                    content: formData.get('content'),
                    type: formData.get('type'),
                    options: {
                        filename: formData.get('filename') || 'document.pdf',
                        title: formData.get('title') || undefined,
                        format: formData.get('format') || undefined
                    }
                };
                
                // Remove undefined values
                Object.keys(data.options).forEach(key => {
                    if (data.options[key] === undefined || data.options[key] === '') {
                        delete data.options[key];
                    }
                });
                
                try {
                    const response = await fetch('/api/convert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = data.options.filename || 'document.pdf';
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } else {
                        const error = await response.json();
                        alert('Error: ' + error.message);
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                } finally {
                    // Hide spinner
                    btn.disabled = false;
                    spinner.style.display = 'none';
                    text.textContent = 'Generate PDF';
                }
            });
            
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Show spinner
                const btn = document.getElementById('uploadBtn');
                const spinner = document.getElementById('uploadSpinner');
                const text = document.getElementById('uploadText');
                btn.disabled = true;
                spinner.style.display = 'inline-block';
                text.textContent = 'Converting...';
                
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'converted.pdf';
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } else {
                        const error = await response.json();
                        alert('Error: ' + error.message);
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                } finally {
                    // Hide spinner
                    btn.disabled = false;
                    spinner.style.display = 'none';
                    text.textContent = 'Upload & Convert';
                }
            });
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
  }

  getTypeFromExtension(ext) {
    const typeMap = {
      '.txt': 'text',
      '.html': 'html',
      '.htm': 'html',
      '.json': 'json',
      '.md': 'markdown',
      '.markdown': 'markdown'
    };
    return typeMap[ext];
  }

  handleError(error, req, res, next) {
    logProgress(`Server error: ${error.message}`, 'error');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }

  start(port = 3000, host = '0.0.0.0') {
    // Use environment port if available
    const serverPort = process.env.PORT || port;
    const serverHost = process.env.HOST || host;
    
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(serverPort, serverHost, (error) => {
        if (error) {
          reject(error);
        } else {
          logProgress(`Server running at http://${serverHost}:${serverPort}`, 'success');
          console.log(`✅ Server bound to ${serverHost}:${serverPort} for Render`);
          resolve({ port: serverPort, host: serverHost });
        }
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logProgress('Server stopped', 'info');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export async function startServer(pdfEngine, config = {}) {
  const server = new PDFServer(pdfEngine, config);
  const port = config.port || 3000;
  const host = config.host || '0.0.0.0';
  
  await server.start(port, host);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await server.stop();
    process.exit(0);
  });
  
  return server;
}
