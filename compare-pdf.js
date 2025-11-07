const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs').promises;
const path = require('path');

async function convertPdfToImage(pdfPath, outputPrefix) {
  console.log(`正在转换 ${pdfPath} 为图片...`);

  const pdfBuffer = await fs.readFile(pdfPath);
  const pngPages = await pdfToPng(pdfBuffer, {
    disableFontFace: false,
    useSystemFonts: false,
    viewportScale: 2.0,
  });

  console.log(`共 ${pngPages.length} 页`);

  for (let i = 0; i < pngPages.length; i++) {
    const page = pngPages[i];
    const outputPath = path.join(__dirname, `${outputPrefix}-page${i + 1}.png`);
    await fs.writeFile(outputPath, page.content);
    console.log(`已保存: ${outputPath}`);
  }
}

async function main() {
  try {
    // 转换原始 PDF
    await convertPdfToImage(
      path.join(__dirname, '费用报销单_2025-11-07_08-31-27.pdf'),
      'original'
    );

    // 转换生成的 PDF
    await convertPdfToImage(
      path.join(__dirname, 'generated-receipt.pdf'),
      'generated'
    );

    console.log('\n转换完成！请对比以下文件：');
    console.log('- original-page1.png (原始报销单)');
    console.log('- generated-page1.png (生成的报销单)');
  } catch (error) {
    console.error('转换失败:', error);
    process.exit(1);
  }
}

main();
