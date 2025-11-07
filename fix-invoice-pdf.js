const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function fixInvoicePDF() {
  try {
    console.log('尝试修复京东发票.pdf...\n');

    const pdfBytes = fs.readFileSync('京东发票.pdf');
    console.log(`原始文件大小: ${(pdfBytes.length / 1024).toFixed(2)} KB`);

    // 方法1: 使用embedPdf
    try {
      console.log('\n方法1: 使用 embedPdf...');
      const newPdf = await PDFDocument.create();
      const [embeddedPage] = await newPdf.embedPdf(pdfBytes, [0]);

      const { width, height } = embeddedPage;
      console.log(`  嵌入页面尺寸: ${width} x ${height}`);

      const page = newPdf.addPage([width, height]);
      page.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      const fixedBytes = await newPdf.save();
      fs.writeFileSync('京东发票-fixed.pdf', fixedBytes);
      console.log(`  ✓ 已保存: 京东发票-fixed.pdf (${(fixedBytes.length / 1024).toFixed(2)} KB)`);

      // 验证修复后的文件
      const verifyPdf = await PDFDocument.load(fixedBytes);
      const verifyPage = verifyPdf.getPage(0);
      console.log(`  验证: Contents存在 = ${verifyPage.node.Contents() ? '是' : '否'}`);

      return '京东发票-fixed.pdf';
    } catch (error) {
      console.log(`  ✗ embedPdf失败: ${error.message}`);
    }

    // 方法2: 直接复制
    try {
      console.log('\n方法2: 直接load和save...');
      const pdf = await PDFDocument.load(pdfBytes);
      const savedBytes = await pdf.save();
      fs.writeFileSync('京东发票-resaved.pdf', savedBytes);
      console.log(`  ✓ 已保存: 京东发票-resaved.pdf (${(savedBytes.length / 1024).toFixed(2)} KB)`);

      return '京东发票-resaved.pdf';
    } catch (error) {
      console.log(`  ✗ 直接保存失败: ${error.message}`);
    }

    throw new Error('所有修复方法都失败了');

  } catch (error) {
    console.error('\n修复失败:', error.message);
    throw error;
  }
}

if (require.main === module) {
  fixInvoicePDF()
    .then((fixedPath) => {
      console.log(`\n成功！请使用修复后的文件: ${fixedPath}`);
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { fixInvoicePDF };
