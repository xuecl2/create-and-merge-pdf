const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function extractContent(pdfPath) {
  try {
    console.log(`提取 PDF 内容: ${pdfPath}\n`);

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    console.log(`PDF版本: ${pdf.getCreator() || '未知'}`);
    console.log(`页数: ${pdf.getPageCount()}\n`);

    // 尝试重新保存PDF看是否能修复
    const newPdf = await PDFDocument.create();

    for (let i = 0; i < pdf.getPageCount(); i++) {
      console.log(`处理页 ${i + 1}...`);

      const page = pdf.getPage(i);
      const { width, height } = page.getSize();
      console.log(`  原始尺寸: ${width} x ${height}`);

      // 尝试嵌入页面
      try {
        const [embeddedPage] = await newPdf.embedPdf(pdfBytes, [i]);
        console.log(`  嵌入页面成功`);

        const newPage = newPdf.addPage([width, height]);
        newPage.drawPage(embeddedPage);

        console.log(`  绘制成功\n`);
      } catch (error) {
        console.error(`  处理失败: ${error.message}\n`);
      }
    }

    // 保存修复后的PDF
    const outputPath = pdfPath.replace('.pdf', '-fixed.pdf');
    const savedBytes = await newPdf.save();
    fs.writeFileSync(outputPath, savedBytes);

    console.log(`已保存修复后的PDF: ${outputPath}`);

  } catch (error) {
    console.error('提取内容时出错:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  const pdfPath = process.argv[2] || '京东发票.pdf';
  extractContent(pdfPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { extractContent };
