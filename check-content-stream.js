const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function checkContentStream(pdfPath) {
  try {
    console.log(`\n检查 PDF 内容流: ${pdfPath}`);
    console.log('='.repeat(60));

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    for (let i = 0; i < pdf.getPageCount(); i++) {
      const page = pdf.getPage(i);
      const { width, height } = page.getSize();

      console.log(`\n页 ${i + 1}: ${width.toFixed(0)} x ${height.toFixed(0)}`);

      // 获取内容流
      try {
        const contentStream = page.node.Contents();
        if (!contentStream) {
          console.log('  ✗ 没有内容流');
          continue;
        }

        // 尝试解码内容
        const context = pdf.context;
        let totalBytes = 0;
        let hasRealContent = false;

        // 检查是否是数组
        if (contentStream.constructor.name === 'PDFArray') {
          console.log(`  内容流数组，长度: ${contentStream.size()}`);
          for (let j = 0; j < contentStream.size(); j++) {
            const stream = contentStream.lookup(j);
            if (stream && stream.sizeInBytes) {
              const size = stream.sizeInBytes();
              totalBytes += size;
              if (size > 50) hasRealContent = true;
              console.log(`    流 ${j + 1}: ${size} 字节`);
            }
          }
        } else if (contentStream.sizeInBytes) {
          totalBytes = contentStream.sizeInBytes();
          hasRealContent = totalBytes > 50;
          console.log(`  内容流大小: ${totalBytes} 字节`);
        }

        // 尝试获取解码后的内容
        if (contentStream.decode && typeof contentStream.decode === 'function') {
          try {
            const decoded = contentStream.decode();
            console.log(`  解码后长度: ${decoded.length} 字节`);

            // 检查是否有实际的绘制命令
            const decodedStr = new TextDecoder('utf-8', { fatal: false }).decode(decoded);
            const hasDrawCommands = /[A-Za-z]{1,2}(\s|\n|$)/.test(decodedStr);
            console.log(`  包含绘制命令: ${hasDrawCommands ? '是' : '否'}`);

            // 显示前200个字符
            const preview = decodedStr.substring(0, 200).replace(/\n/g, '\\n');
            console.log(`  内容预览: ${preview}...`);
          } catch (e) {
            console.log(`  无法解码内容: ${e.message}`);
          }
        }

        console.log(`  ${hasRealContent ? '✓ 有实际内容' : '✗ 内容可能为空'}`);

      } catch (error) {
        console.log(`  检查失败: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

if (require.main === module) {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.log('使用方法: node check-content-stream.js <PDF文件>');
    process.exit(1);
  }

  checkContentStream(pdfPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { checkContentStream };
