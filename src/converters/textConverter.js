import { loadTemplate } from '../utils/helpers.js';

class TextConverter {
  async convert(textContent, options = {}) {
    // Escape HTML characters
    const escapedText = this.escapeHtml(textContent);
    
    // Convert line breaks to paragraphs
    const paragraphs = escapedText
      .split(/\n\s*\n/)
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('\n');

    const title = options.title || '';
    
    const template = await loadTemplate('default.html');
    
    return template
      .replace(/\{\{title\}\}/g, this.escapeHtml(title))
      .replace(/\{\{content\}\}/g, paragraphs)
      .replace(/\{\{style\}\}/g, this.getDefaultStyles());
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
      
      h1 {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }
      
      p {
        margin-bottom: 1em;
        text-align: justify;
      }
      
      .text-content {
        font-size: 14px;
        white-space: pre-wrap;
      }
    `;
  }
}

export default TextConverter;
