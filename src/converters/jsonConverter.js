import { loadTemplate } from '../utils/helpers.js';

class JsonConverter {
  async convert(jsonContent, options = {}) {
    let data;
    
    try {
      // Parse JSON if it's a string
      data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }

    const title = options.title || data.title || '';
    const template = await loadTemplate('default.html');
    
    const htmlContent = this.jsonToHtml(data, options);
    
    return template
      .replace(/\{\{title\}\}/g, this.escapeHtml(title))
      .replace(/\{\{content\}\}/g, htmlContent)
      .replace(/\{\{style\}\}/g, this.getDefaultStyles());
  }

  jsonToHtml(data, options = {}) {
    const format = options.format || 'structured'; // 'structured', 'table', 'raw'
    
    switch (format) {
      case 'table':
        return this.jsonToTable(data);
      case 'raw':
        return this.jsonToRaw(data);
      case 'structured':
      default:
        return this.jsonToStructured(data);
    }
  }

  jsonToStructured(data, level = 0) {
    if (data === null || data === undefined) {
      return '<span class="json-null">null</span>';
    }

    if (typeof data === 'string') {
      return `<span class="json-string">"${this.escapeHtml(data)}"</span>`;
    }

    if (typeof data === 'number') {
      return `<span class="json-number">${data}</span>`;
    }

    if (typeof data === 'boolean') {
      return `<span class="json-boolean">${data}</span>`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '<span class="json-empty">[]</span>';
      }

      const items = data.map((item, index) => 
        `<div class="json-array-item">
          <span class="json-index">[${index}]</span>
          ${this.jsonToStructured(item, level + 1)}
        </div>`
      ).join('');

      return `<div class="json-array" style="margin-left: ${level * 20}px;">
        <div class="json-bracket">[</div>
        ${items}
        <div class="json-bracket">]</div>
      </div>`;
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return '<span class="json-empty">{}</span>';
      }

      const items = keys.map(key => 
        `<div class="json-object-item">
          <span class="json-key">"${this.escapeHtml(key)}":</span>
          <div class="json-value">${this.jsonToStructured(data[key], level + 1)}</div>
        </div>`
      ).join('');

      return `<div class="json-object" style="margin-left: ${level * 20}px;">
        <div class="json-bracket">{</div>
        ${items}
        <div class="json-bracket">}</div>
      </div>`;
    }

    return this.escapeHtml(String(data));
  }

  jsonToTable(data) {
    if (Array.isArray(data)) {
      return this.arrayToTable(data);
    } else if (typeof data === 'object' && data !== null) {
      return this.objectToTable(data);
    } else {
      return `<div class="json-simple-value">${this.jsonToStructured(data)}</div>`;
    }
  }

  arrayToTable(array) {
    if (array.length === 0) {
      return '<p class="json-empty">Empty array</p>';
    }

    // Check if all items are objects with similar keys
    if (array.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      const allKeys = new Set();
      array.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
      const keys = Array.from(allKeys);

      const headerRow = keys.map(key => `<th>${this.escapeHtml(key)}</th>`).join('');
      const dataRows = array.map(item => 
        `<tr>${keys.map(key => 
          `<td>${item.hasOwnProperty(key) ? this.formatTableCell(item[key]) : ''}</td>`
        ).join('')}</tr>`
      ).join('');

      return `
        <table class="json-table">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
      `;
    }

    // Simple array table
    const rows = array.map((item, index) => 
      `<tr>
        <td class="json-index">${index}</td>
        <td>${this.formatTableCell(item)}</td>
      </tr>`
    ).join('');

    return `
      <table class="json-table">
        <thead>
          <tr><th>Index</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  objectToTable(obj) {
    const rows = Object.entries(obj).map(([key, value]) => 
      `<tr>
        <td class="json-key">${this.escapeHtml(key)}</td>
        <td>${this.formatTableCell(value)}</td>
      </tr>`
    ).join('');

    return `
      <table class="json-table">
        <thead>
          <tr><th>Key</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  formatTableCell(value) {
    if (typeof value === 'object' && value !== null) {
      return `<pre class="json-nested">${JSON.stringify(value, null, 2)}</pre>`;
    }
    return this.jsonToStructured(value);
  }

  jsonToRaw(data) {
    const jsonString = JSON.stringify(data, null, 2);
    return `<pre class="json-raw"><code>${this.escapeHtml(jsonString)}</code></pre>`;
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
      
      .json-object, .json-array {
        margin: 0.5em 0;
      }
      
      .json-object-item, .json-array-item {
        margin: 0.25em 0;
        padding: 2px 0;
      }
      
      .json-key {
        font-weight: bold;
        color: #8b5cf6;
        margin-right: 0.5em;
      }
      
      .json-string {
        color: #059669;
      }
      
      .json-number {
        color: #dc2626;
      }
      
      .json-boolean {
        color: #0891b2;
        font-weight: bold;
      }
      
      .json-null {
        color: #6b7280;
        font-style: italic;
      }
      
      .json-bracket {
        color: #374151;
        font-weight: bold;
        margin: 0.25em 0;
      }
      
      .json-index {
        color: #7c3aed;
        font-weight: bold;
        margin-right: 0.5em;
      }
      
      .json-empty {
        color: #9ca3af;
        font-style: italic;
      }
      
      .json-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        font-size: 14px;
      }
      
      .json-table th,
      .json-table td {
        border: 1px solid #d1d5db;
        padding: 8px 12px;
        text-align: left;
        vertical-align: top;
      }
      
      .json-table th {
        background-color: #f3f4f6;
        font-weight: bold;
        color: #374151;
      }
      
      .json-table tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }
      
      .json-nested {
        background-color: #f3f4f6;
        padding: 0.5em;
        border-radius: 4px;
        font-size: 12px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .json-raw {
        background-color: #1f2937;
        color: #f9fafb;
        padding: 1em;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 13px;
        line-height: 1.4;
      }
      
      .json-raw code {
        color: inherit;
        background: none;
      }
      
      .json-simple-value {
        padding: 1em;
        background-color: #f9fafb;
        border-left: 4px solid #3b82f6;
        margin: 1em 0;
      }
    `;
  }
}

export default JsonConverter;
