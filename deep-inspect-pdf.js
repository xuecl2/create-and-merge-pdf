const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function deepInspect(pdfPath) {
  try {
    console.log(`\n深度检查 PDF: ${pdfPath}`);
    console.log('='.repeat(60));

    const pdfBytes = fs.readFileSync(pdfPath);
    console.log(`文件大小: ${(pdfBytes.length / 1024).toFixed(2)} KB`);

    const pdf = await PDFDocument.load(pdfBytes);
    console.log(`PDF 页数: ${pdf.getPageCount()}`);

    for (let i = 0; i < pdf.getPageCount(); i++) {
      const page = pdf.getPage(i);
      const { width, height } = page.getSize();

      console.log(`\n页 ${i + 1}:`);
      console.log(`  尺寸: ${width.toFixed(2)} x ${height.toFixed(2)}`);

      // 获取页面字典
      const pageDict = page.node;
      const context = page.doc.context;

      // 检查 Contents
      const contents = pageDict.Contents();
      console.log(`  Contents: ${contents ? '存在' : '不存在'}`);

      if (contents) {
        // 尝试获取内容流的原始数据
        try {
          const contentsRef = pageDict.get('Contents');
          console.log(`  Contents类型: ${contentsRef?.constructor.name}`);

          if (contentsRef) {
            // 解引用获取实际对象
            const actualContents = context.lookup(contentsRef);
            console.log(`  实际Contents类型: ${actualContents?.constructor.name}`);

            // 如果是数组
            if (actualContents?.constructor.name === 'PDFArray') {
              console.log(`  Contents数组长度: ${actualContents.size()}`);
            }

            // 尝试获取内容
            if (typeof actualContents?.sizeInBytes === 'function') {
              console.log(`  内容大小: ${actualContents.sizeInBytes()} 字节`);
            }
          }
        } catch (e) {
          console.log(`  检查Contents详情失败: ${e.message}`);
        }
      }

      // 检查 Resources
      const resources = pageDict.Resources();
      if (resources) {
        console.log(`  Resources: 存在`);

        try {
          // 检查 XObject (可能包含图像)
          const xobjects = resources.lookup('XObject');
          if (xobjects) {
            console.log(`  XObject: 存在`);
            const keys = xobjects.entries ? xobjects.entries() : [];
            console.log(`  XObject数量: ${keys.length}`);
            keys.forEach(([key, value]) => {
              console.log(`    - ${key}: ${value?.constructor.name}`);
            });
          }

          // 检查 Font
          const fonts = resources.lookup('Font');
          if (fonts) {
            console.log(`  Font: 存在`);
            const fontKeys = fonts.entries ? fonts.entries() : [];
            console.log(`  Font数量: ${fontKeys.length}`);
          }

          // 检查 ExtGState
          const extGState = resources.lookup('ExtGState');
          if (extGState) {
            console.log(`  ExtGState: 存在`);
          }
        } catch (e) {
          console.log(`  检查Resources详情失败: ${e.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('深度检查失败:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  const pdfPath = process.argv[2] || '京东发票.pdf';
  deepInspect(pdfPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { deepInspect };
