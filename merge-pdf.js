const fs = require('fs');
const { PDFDocument, PageSizes } = require('pdf-lib');

// 纸张尺寸定义 (单位: points)
const PAPER_SIZES = {
  A4: PageSizes.A4,        // [595.28, 841.89]
  B4: [708.66, 1000.63],   // B4 (250mm x 353mm)
  ORIGINAL: null           // 保持原始尺寸
};

/**
 * 合并多个 PDF 文件
 * @param {string[]} pdfPaths - PDF 文件路径数组
 * @param {string} outputPath - 输出文件路径
 * @param {object} options - 合并选项
 * @param {string} options.pageSize - 目标纸张大小: 'A4', 'B4', 或 'ORIGINAL'
 * @param {boolean} options.center - 是否居中内容（仅在调整纸张大小时有效）
 */
async function mergePDFs(pdfPaths, outputPath, options = {}) {
  try {
    const { pageSize = 'ORIGINAL', center = true } = options;

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

      // 检查PDF页面是否有效，并修复缺少Contents的页面
      for (let i = 0; i < pdf.getPageCount(); i++) {
        const page = pdf.getPage(i);
        if (!page.node.Contents()) {
          console.warn(`  警告: ${pdfPath} 的页 ${i + 1} 缺少内容对象`);
          console.warn(`  这可能是pdf-lib解析问题，尝试从页面字典直接获取...`);

          // 尝试从页面字典直接获取Contents引用
          const context = pdf.context;
          const contentsRef = page.node.get('Contents');

          if (contentsRef) {
            console.warn(`  找到Contents引用: ${contentsRef.constructor.name}`);
            // 不需要修复，Contents引用存在
          } else {
            console.warn(`  确实缺少Contents，创建空内容流...`);
            // 为缺少Contents的页面创建一个空的内容流
            const contentStream = context.stream('');
            page.node.set(context.obj('Contents'), contentStream);
          }
        }
      }

      // 复制所有页面
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      for (let i = 0; i < copiedPages.length; i++) {
        const copiedPage = copiedPages[i];
        const originalSize = copiedPage.getSize();

        // 如果指定了纸张大小且不是ORIGINAL，则调整页面
        if (pageSize !== 'ORIGINAL' && PAPER_SIZES[pageSize]) {
          const [targetWidth, targetHeight] = PAPER_SIZES[pageSize];

          // 计算缩放比例，保持宽高比
          const scaleX = targetWidth / originalSize.width;
          const scaleY = targetHeight / originalSize.height;
          const scale = Math.min(scaleX, scaleY);

          // 计算缩放后的尺寸
          const scaledWidth = originalSize.width * scale;
          const scaledHeight = originalSize.height * scale;

          // 计算居中位置偏移
          const offsetX = center ? (targetWidth - scaledWidth) / 2 : 0;
          const offsetY = center ? (targetHeight - scaledHeight) / 2 : 0;

          // 调整页面大小为目标纸张大小
          copiedPage.setSize(targetWidth, targetHeight);

          // 缩放页面内容
          copiedPage.scaleContent(scale, scale);

          // 平移页面内容到居中位置
          copiedPage.translateContent(offsetX, offsetY);

          console.log(`  页 ${i + 1}: ${originalSize.width.toFixed(0)}x${originalSize.height.toFixed(0)} -> ${targetWidth}x${targetHeight} (${pageSize})`);
        } else {
          console.log(`  页 ${i + 1}: ${originalSize.width.toFixed(0)}x${originalSize.height.toFixed(0)} (原始尺寸)`);
        }

        mergedPdf.addPage(copiedPage);
      }

      console.log(`已添加: ${pdfPath} (${pdf.getPageCount()} 页)`);
    }

    // 保存合并后的 PDF
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);

    console.log(`\n合并成功！`);
    console.log(`总页数: ${mergedPdf.getPageCount()}`);
    if (pageSize !== 'ORIGINAL') {
      console.log(`纸张大小: ${pageSize}`);
    }
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
    console.log('  node merge-pdf.js [选项] <输出文件> <PDF1> <PDF2> [PDF3] ...');
    console.log('\n选项:');
    console.log('  --size=<SIZE>    指定纸张大小: A4, B4, 或 ORIGINAL (默认: ORIGINAL)');
    console.log('  --no-center      不居中内容（默认会居中）');
    console.log('\n示例:');
    console.log('  # 保持原始尺寸');
    console.log('  node merge-pdf.js merged.pdf 报销单.pdf 发票1.pdf 发票2.pdf');
    console.log('\n  # 统一调整为 A4 纸张');
    console.log('  node merge-pdf.js --size=A4 merged.pdf 报销单.pdf 发票1.pdf');
    console.log('\n  # 统一调整为 B4 纸张');
    console.log('  node merge-pdf.js --size=B4 merged.pdf 报销单.pdf 发票1.pdf');
    process.exit(1);
  }

  // 解析选项
  let pageSize = 'ORIGINAL';
  let center = true;
  let fileArgs = [];

  for (const arg of args) {
    if (arg.startsWith('--size=')) {
      pageSize = arg.split('=')[1].toUpperCase();
      if (!['A4', 'B4', 'ORIGINAL'].includes(pageSize)) {
        console.error(`错误: 无效的纸张大小 "${pageSize}". 请使用 A4, B4, 或 ORIGINAL`);
        process.exit(1);
      }
    } else if (arg === '--no-center') {
      center = false;
    } else {
      fileArgs.push(arg);
    }
  }

  if (fileArgs.length < 2) {
    console.error('错误: 需要至少指定输出文件和一个输入 PDF 文件');
    process.exit(1);
  }

  const outputPath = fileArgs[0];
  const pdfPaths = fileArgs.slice(1);

  console.log('开始合并 PDF 文件...');
  console.log(`输入文件: ${pdfPaths.length} 个`);
  console.log(`纸张大小: ${pageSize}`);
  if (pageSize !== 'ORIGINAL') {
    console.log(`居中内容: ${center ? '是' : '否'}`);
  }
  console.log('-------------------\n');

  mergePDFs(pdfPaths, outputPath, { pageSize, center })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

module.exports = { mergePDFs };
