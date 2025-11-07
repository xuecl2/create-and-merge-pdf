const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

/**
 * 合并多个 PDF 文件
 * @param {string[]} pdfPaths - PDF 文件路径数组
 * @param {string} outputPath - 输出文件路径
 */
async function mergePDFs(pdfPaths, outputPath) {
  try {
    // 创建一个新的 PDF 文档
    const mergedPdf = await PDFDocument.create();

    // 遍历所有输入的 PDF 文件
    for (const pdfPath of pdfPaths) {
      // 检查文件是否存在
      if (!fs.existsSync(pdfPath)) {
        console.error(`错误: 文件不存在 - ${pdfPath}`);
        continue;
      }

      // 读取 PDF 文件
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);

      // 复制所有页面
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });

      console.log(`已添加: ${pdfPath} (${pdf.getPageCount()} 页)`);
    }

    // 保存合并后的 PDF
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);

    console.log(`\n合并成功！`);
    console.log(`总页数: ${mergedPdf.getPageCount()}`);
    console.log(`输出文件: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('合并 PDF 时出错:', error.message);
    throw error;
  }
}

// 命令行参数处理
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('使用方法:');
    console.log('  node merge-pdf.js <输出文件> <PDF1> <PDF2> [PDF3] ...');
    console.log('\n示例:');
    console.log('  node merge-pdf.js merged.pdf 报销单.pdf 发票1.pdf 发票2.pdf');
    process.exit(1);
  }

  const outputPath = args[0];
  const pdfPaths = args.slice(1);

  console.log('开始合并 PDF 文件...');
  console.log(`输入文件: ${pdfPaths.length} 个`);
  console.log('-------------------\n');

  mergePDFs(pdfPaths, outputPath)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

module.exports = { mergePDFs };
