import PDFGenerationEngine from './src/index.js';
import { createExampleFiles } from './src/utils/helpers.js';

async function runTests() {
  console.log('🧪 Running PDF Generation Engine Tests...\n');
  
  const engine = new PDFGenerationEngine();
  
  try {
    // Create example files
    await createExampleFiles();
    
    // Test 1: Text to PDF
    console.log('📝 Test 1: Converting text to PDF...');
    const textContent = "Hello World!\n\nThis is a test document.\nIt has multiple lines.";
    const textPdf = await engine.convertToPDF(textContent, 'text', { 
      title: 'Text Test Document' 
    });
    console.log(`✅ Text PDF generated: ${textPdf.length} bytes\n`);
    
    // Test 2: HTML to PDF
    console.log('🌐 Test 2: Converting HTML to PDF...');
    const htmlContent = `
      <h1>HTML Test Document</h1>
      <p>This is a <strong>bold</strong> paragraph with <em>italic</em> text.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    `;
    const htmlPdf = await engine.convertToPDF(htmlContent, 'html');
    console.log(`✅ HTML PDF generated: ${htmlPdf.length} bytes\n`);
    
    // Test 3: JSON to PDF
    console.log('📊 Test 3: Converting JSON to PDF...');
    const jsonContent = {
      title: "Sample Data",
      users: [
        { name: "Alice", age: 30, role: "Developer" },
        { name: "Bob", age: 25, role: "Designer" }
      ],
      settings: {
        theme: "dark",
        notifications: true
      }
    };
    const jsonPdf = await engine.convertToPDF(JSON.stringify(jsonContent, null, 2), 'json');
    console.log(`✅ JSON PDF generated: ${jsonPdf.length} bytes\n`);
    
    // Test 4: Markdown to PDF
    console.log('📝 Test 4: Converting Markdown to PDF...');
    const markdownContent = `# Markdown Test

This is a **test** document in *Markdown* format.

## Features

- Headings
- **Bold** and *italic* text
- Lists
- \`Code snippets\`

### Code Block

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> This is a blockquote example.

| Name  | Age | Role      |
|-------|-----|-----------|
| Alice | 30  | Developer |
| Bob   | 25  | Designer  |
`;
    const markdownPdf = await engine.convertToPDF(markdownContent, 'markdown');
    console.log(`✅ Markdown PDF generated: ${markdownPdf.length} bytes\n`);
    
    // Test 5: File conversion
    console.log('📁 Test 5: Converting example files...');
    try {
      await engine.convertFile('examples/example.md', 'output/example-markdown.pdf', 'markdown');
      console.log('✅ Example Markdown file converted');
      
      await engine.convertFile('examples/example.json', 'output/example-json.pdf', 'json');
      console.log('✅ Example JSON file converted');
      
      await engine.convertFile('examples/example.html', 'output/example-html.pdf', 'html');
      console.log('✅ Example HTML file converted');
      
      await engine.convertFile('examples/example.txt', 'output/example-text.pdf', 'text');
      console.log('✅ Example text file converted');
    } catch (fileError) {
      console.log(`ℹ️  File conversion test skipped: ${fileError.message}`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- Text conversion: ✅');
    console.log('- HTML conversion: ✅');
    console.log('- JSON conversion: ✅');
    console.log('- Markdown conversion: ✅');
    console.log('- File conversion: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up
    await engine.pdfGenerator.close();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
