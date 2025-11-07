const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

/**
 * 检查PDF文件的页面尺寸
 */
async function checkPDFSize(pdfPath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    console.log(`\n文件: ${pdfPath}`);
    console.log(`总页数: ${pdf.getPageCount()}`);

    pdf.getPages().forEach((page, index) => {
      const { width, height } = page.getSize();
      console.log(`  页 ${index + 1}: ${width.toFixed(2)} x ${height.toFixed(2)} points`);

      // 判断纸张类型
      if (Math.abs(width - 595.28) < 10 && Math.abs(height - 841.89) < 10) {
        console.log(`         (A4 纵向)`);
      } else if (Math.abs(width - 841.89) < 10 && Math.abs(height - 595.28) < 10) {
        console.log(`         (A4 横向)`);
      } else if (Math.abs(width - 708.66) < 10 && Math.abs(height - 1000.63) < 10) {
        console.log(`         (B4 纵向)`);
      } else if (Math.abs(width - 1000.63) < 10 && Math.abs(height - 708.66) < 10) {
        console.log(`         (B4 横向)`);
      } else {
        console.log(`         (自定义尺寸)`);
      }
    });
  } catch (error) {
    console.error(`检查文件失败: ${pdfPath}`, error.message);
  }
}

// 命令行参数处理
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node check-pdf-size.js <PDF1> [PDF2] [PDF3] ...');
    process.exit(1);
  }

  (async () => {
    for (const pdfPath of args) {
      if (fs.existsSync(pdfPath)) {
        await checkPDFSize(pdfPath);
      } else {
        console.error(`文件不存在: ${pdfPath}`);
      }
    }
  })();
}

module.exports = { checkPDFSize };
