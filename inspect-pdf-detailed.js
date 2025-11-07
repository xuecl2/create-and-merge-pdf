const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function inspectPDFDetailed(pdfPath) {
  try {
    console.log(`\n详细检查 PDF: ${pdfPath}`);
    console.log('='.repeat(60));

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    const pageCount = pdf.getPageCount();
    console.log(`总页数: ${pageCount}`);

    for (let i = 0; i < pageCount; i++) {
      const page = pdf.getPage(i);
      const { width, height } = page.getSize();

      console.log(`\n页 ${i + 1}:`);
      console.log(`  尺寸: ${width.toFixed(2)} x ${height.toFixed(2)}`);

      // 获取页面字典
      const pageDict = page.node;

      // 检查各种内容
      console.log(`  Resources: ${pageDict.Resources() ? '存在' : '不存在'}`);
      console.log(`  Contents: ${pageDict.Contents() ? '存在' : '不存在'}`);

      // 尝试获取资源
      if (pageDict.Resources()) {
        const resources = pageDict.Resources();
        console.log(`  XObject: ${resources.XObject ? '存在' : '不存在'}`);
        console.log(`  Font: ${resources.Font ? '存在' : '不存在'}`);

        // 检查是否有图像
        if (resources.XObject) {
          const xobject = resources.XObject();
          const keys = xobject.keys ? xobject.keys() : [];
          console.log(`  图像/表单对象数量: ${keys.length}`);
        }
      }

      // 尝试获取内容流
      if (pageDict.Contents()) {
        const contents = pageDict.Contents();
        try {
          // 尝试获取内容流的信息
          if (typeof contents.sizeInBytes === 'function') {
            console.log(`  内容流大小: ${contents.sizeInBytes()} 字节`);
          }
        } catch (e) {
          console.log(`  无法获取内容流详情: ${e.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('检查 PDF 时出错:', error.message);
    console.error(error.stack);
  }
}

// 命令行参数处理
if (require.main === module) {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.log('使用方法: node inspect-pdf-detailed.js <PDF文件路径>');
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`错误: 文件不存在 - ${pdfPath}`);
    process.exit(1);
  }

  inspectPDFDetailed(pdfPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { inspectPDFDetailed };
