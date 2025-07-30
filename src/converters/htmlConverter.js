import { loadTemplate } from '../utils/helpers.js';

class HtmlConverter {
  async convert(htmlContent, options = {}) {
    // Check if it's a complete HTML document
    if (htmlContent.toLowerCase().includes('<!doctype') || 
        htmlContent.toLowerCase().includes('<html')) {
      // It's already a complete HTML document
      return this.addPdfStyles(htmlContent);
    }

    // It's just HTML content, wrap it in a template
    const title = options.title || '';
    const template = await loadTemplate('default.html');
    
    return template
      .replace(/\{\{title\}\}/g, this.escapeHtml(title))
      .replace(/\{\{content\}\}/g, htmlContent)
      .replace(/\{\{style\}\}/g, this.getDefaultStyles());
  }

  addPdfStyles(fullHtmlContent) {
    // Add PDF-friendly styles to existing HTML document
    const pdfStyles = `
    <style>
      ${this.getPdfOptimizedStyles()}
    </style>
    `;

    // Insert styles before </head> tag
    if (fullHtmlContent.includes('</head>')) {
      return fullHtmlContent.replace('</head>', `${pdfStyles}</head>`);
    } else {
      // If no head tag, add it
      const headSection = `<head><title>PDF Document</title>${pdfStyles}</head>`;
      if (fullHtmlContent.includes('<html>')) {
        return fullHtmlContent.replace('<html>', `<html>${headSection}`);
      } else {
        return `<!DOCTYPE html><html>${headSection}<body>${fullHtmlContent}</body></html>`;
      }
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  getDefaultStyles() {
    return `
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      
      h1 {
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }
      
      p {
        margin-bottom: 1em;
        text-align: justify;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      
      blockquote {
        border-left: 4px solid #3498db;
        margin: 1em 0;
        padding: 0.5em 1em;
        background-color: #f9f9f9;
      }
      
      code {
        background-color: #f4f4f4;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      
      pre {
        background-color: #f4f4f4;
        padding: 1em;
        border-radius: 5px;
        overflow-x: auto;
      }
      
      ${this.getPdfOptimizedStyles()}
    `;
  }

  getPdfOptimizedStyles() {
    return `
      /* PDF-specific optimizations */
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        
        .no-print {
          display: none;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .page-break-avoid {
          page-break-inside: avoid;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        
        table, figure, img {
          page-break-inside: avoid;
        }
      }
      
      /* Ensure consistent rendering */
      * {
        box-sizing: border-box;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
    `;
  }
}

export default HtmlConverter;
