import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PdfGenerator {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async generateFromHTML(htmlContent, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set default PDF options
      const pdfOptions = {
        format: options.format || 'A4',
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: options.printBackground !== false,
        preferCSSPageSize: options.preferCSSPageSize !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || ''
      };

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return pdfBuffer;

    } finally {
      await page.close();
    }
  }

  async generateFromUrl(url, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      const pdfOptions = {
        format: options.format || 'A4',
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: options.printBackground !== false,
        preferCSSPageSize: options.preferCSSPageSize !== false
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;

    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Static method for one-off PDF generation
  static async generatePDF(htmlContent, options = {}) {
    const generator = new PdfGenerator();
    try {
      const pdfBuffer = await generator.generateFromHTML(htmlContent, options);
      return pdfBuffer;
    } finally {
      await generator.close();
    }
  }
}

export default PdfGenerator;
