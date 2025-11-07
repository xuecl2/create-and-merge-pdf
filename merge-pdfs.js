const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * 合并多个 PDF 文件
 * @param {string[]} pdfPaths - PDF 文件路径数组
 * @param {string} outputPath - 输出文件路径
 */
async function mergePDFs(pdfPaths, outputPath) {
  console.log('开始合并 PDF...');

  // 创建新的 PDF 文档
  const mergedPdf = await PDFDocument.create();

  // 逐个加载并合并 PDF
  for (const pdfPath of pdfPaths) {
    console.log(`正在添加: ${path.basename(pdfPath)}`);

    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    // 复制所有页面
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

    // 添加到合并后的文档
    copiedPages.forEach(page => {
      mergedPdf.addPage(page);
    });
  }

  // 保存合并后的 PDF
  const mergedPdfBytes = await mergedPdf.save();
  await fs.writeFile(outputPath, mergedPdfBytes);

  console.log(`PDF 合并完成: ${outputPath}`);
  console.log(`总页数: ${mergedPdf.getPageCount()}`);
}

/**
 * 示例：合并报销单和发票
 */
async function main() {
  try {
    const receiptPath = path.join(__dirname, 'generated-receipt.pdf');
    const invoicePath = path.join(__dirname, 'invoice.pdf'); // 需要提供发票文件

    // 检查文件是否存在
    try {
      await fs.access(receiptPath);
    } catch (error) {
      console.error(`错误：找不到报销单文件 ${receiptPath}`);
      console.log('请先运行 generate-receipt.js 生成报销单');
      process.exit(1);
    }

    try {
      await fs.access(invoicePath);
    } catch (error) {
      console.warn(`警告：找不到发票文件 ${invoicePath}`);
      console.log('将只导出报销单...');

      // 只复制报销单
      const receiptBytes = await fs.readFile(receiptPath);
      await fs.writeFile(path.join(__dirname, 'final-output.pdf'), receiptBytes);
      console.log('已保存: final-output.pdf (仅包含报销单)');
      return;
    }

    // 合并报销单和发票
    const outputPath = path.join(__dirname, 'final-output.pdf');
    await mergePDFs([receiptPath, invoicePath], outputPath);
  } catch (error) {
    console.error('合并 PDF 失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { mergePDFs };
