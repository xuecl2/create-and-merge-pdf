const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function inspectPDF(pdfPath) {
  try {
    console.log(`\n检查 PDF: ${pdfPath}`);
    console.log('='.repeat(60));

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    const pageCount = pdf.getPageCount();
    console.log(`总页数: ${pageCount}`);

    for (let i = 0; i < pageCount; i++) {
      const page = pdf.getPage(i);
      const { width, height } = page.getSize();

      // 获取页面内容
      const pageDict = page.node;
      const contents = pageDict.Contents();

      console.log(`\n页 ${i + 1}:`);
      console.log(`  尺寸: ${width.toFixed(2)} x ${height.toFixed(2)}`);
      console.log(`  内容对象: ${contents ? '存在' : '不存在'}`);

      if (contents) {
        // 检查是否有实际内容
        const contentStream = contents.toString();
        const hasContent = contentStream && contentStream.length > 100;
        console.log(`  有内容: ${hasContent ? '是' : '否'}`);
        console.log(`  内容长度: ${contentStream ? contentStream.length : 0} 字节`);
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('检查 PDF 时出错:', error.message);
    throw error;
  }
}

// 命令行参数处理
if (require.main === module) {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.log('使用方法: node inspect-pdf.js <PDF文件路径>');
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`错误: 文件不存在 - ${pdfPath}`);
    process.exit(1);
  }

  inspectPDF(pdfPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { inspectPDF };
