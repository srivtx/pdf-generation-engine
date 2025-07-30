import { marked } from 'marked';
import { loadTemplate } from '../utils/helpers.js';

class MarkdownConverter {
  constructor() {
    this.configureMarked();
  }

  configureMarked() {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      mangle: false,
      sanitize: false,
      smartLists: true,
      smartypants: true,
      xhtml: false
    });

    // Custom renderer for better PDF output
    const renderer = new marked.Renderer();

    // Customize table rendering
    renderer.table = function(header, body) {
      return `<table class="markdown-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>`;
    };

    // Customize code block rendering
    renderer.code = function(code, language) {
      const validLang = language && language.match(/^[a-zA-Z0-9-_]+$/);
      const langClass = validLang ? ` class="language-${language}"` : '';
      const escapedCode = code.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[m]);
      return `<pre class="code-block"><code${langClass}>${escapedCode}</code></pre>`;
    };

    // Customize blockquote rendering
    renderer.blockquote = function(quote) {
      return `<blockquote class="markdown-blockquote">${quote}</blockquote>`;
    };

    // Customize list rendering
    renderer.list = function(body, ordered) {
      const type = ordered ? 'ol' : 'ul';
      return `<${type} class="markdown-list">${body}</${type}>`;
    };

    // Customize heading rendering with anchor links
    renderer.heading = function(text, level) {
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h${level} id="${id}" class="markdown-heading">${text}</h${level}>`;
    };

    marked.use({ renderer });
  }

  async convert(markdownContent, options = {}) {
    try {
      // Extract frontmatter if present
      const { content, metadata } = this.extractFrontmatter(markdownContent);
      
      // Convert markdown to HTML
      const htmlContent = marked(content);
      
      // Determine title
      const title = options.title || metadata.title || this.extractTitleFromContent(content) || '';
      
      const template = await loadTemplate('default.html');
      
      return template
        .replace(/\{\{title\}\}/g, this.escapeHtml(title))
        .replace(/\{\{content\}\}/g, htmlContent)
        .replace(/\{\{style\}\}/g, this.getDefaultStyles());
        
    } catch (error) {
      throw new Error(`Markdown conversion failed: ${error.message}`);
    }
  }

  extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { content, metadata: {} };
    }

    try {
      // Simple YAML parsing for basic key-value pairs
      const frontmatterText = match[1];
      const metadata = {};
      
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
          metadata[key] = value;
        }
      });

      return {
        content: match[2],
        metadata
      };
    } catch (error) {
      return { content, metadata: {} };
    }
  }

  extractTitleFromContent(content) {
    // Try to find the first heading
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    return headingMatch ? headingMatch[1] : null;
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        line-height: 1.6;
        color: #24292e;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
      }
      
      /* Headings */
      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
        color: #1a1a1a;
      }
      
      h1 {
        font-size: 2em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
      }
      
      h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
      }
      
      h3 {
        font-size: 1.25em;
      }
      
      h4 {
        font-size: 1em;
      }
      
      h5 {
        font-size: 0.875em;
      }
      
      h6 {
        font-size: 0.85em;
        color: #6a737d;
      }
      
      /* Paragraphs and text */
      p {
        margin-top: 0;
        margin-bottom: 16px;
        text-align: justify;
      }
      
      /* Links */
      a {
        color: #0366d6;
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      /* Lists */
      .markdown-list {
        padding-left: 2em;
        margin-top: 0;
        margin-bottom: 16px;
      }
      
      .markdown-list li {
        margin-bottom: 0.25em;
      }
      
      .markdown-list li > p {
        margin-bottom: 0;
      }
      
      /* Tables */
      .markdown-table {
        border-spacing: 0;
        border-collapse: collapse;
        width: 100%;
        margin-top: 0;
        margin-bottom: 16px;
      }
      
      .markdown-table th {
        font-weight: 600;
        background-color: #f6f8fa;
      }
      
      .markdown-table th,
      .markdown-table td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
      }
      
      .markdown-table tbody tr:nth-child(even) {
        background-color: #f6f8fa;
      }
      
      /* Code */
      code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      }
      
      .code-block {
        padding: 16px;
        overflow: auto;
        font-size: 85%;
        line-height: 1.45;
        background-color: #f6f8fa;
        border-radius: 6px;
        margin-bottom: 16px;
      }
      
      .code-block code {
        background: transparent;
        padding: 0;
        margin: 0;
        border-radius: 0;
        word-break: normal;
        white-space: pre;
        border: 0;
        font-size: inherit;
        line-height: inherit;
        overflow: visible;
      }
      
      /* Blockquotes */
      .markdown-blockquote {
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
        margin: 0 0 16px 0;
      }
      
      .markdown-blockquote > :first-child {
        margin-top: 0;
      }
      
      .markdown-blockquote > :last-child {
        margin-bottom: 0;
      }
      
      /* Horizontal rules */
      hr {
        height: 0.25em;
        padding: 0;
        margin: 24px 0;
        background-color: #e1e4e8;
        border: 0;
      }
      
      /* Images */
      img {
        max-width: 100%;
        height: auto;
        box-sizing: content-box;
      }
      
      /* Task lists */
      .task-list-item {
        list-style-type: none;
      }
      
      .task-list-item input[type="checkbox"] {
        margin: 0 0.2em 0.25em -1.6em;
        vertical-align: middle;
      }
      
      /* Print styles */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        .markdown-table th {
          background-color: #f6f8fa !important;
        }
        
        .markdown-table tbody tr:nth-child(even) {
          background-color: #f6f8fa !important;
        }
        
        .code-block {
          background-color: #f6f8fa !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        
        .markdown-table, .code-block {
          page-break-inside: avoid;
        }
      }
    `;
  }
}

export default MarkdownConverter;
