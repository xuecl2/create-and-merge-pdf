const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

/**
 * 坐标查找工具
 * 在模板上绘制网格和坐标，帮助确定文本位置
 */
async function createCoordinateHelper() {
  const pdfDoc = await PDFDocument.create();

  // 注册fontkit以支持自定义字体
  pdfDoc.registerFontkit(fontkit);

  // 读取模板图片
  const templateImageBytes = fs.readFileSync('./template.png');
  const templateImage = await pdfDoc.embedPng(templateImageBytes);

  const { width: imgWidth, height: imgHeight } = templateImage.scale(1);
  const page = pdfDoc.addPage([imgWidth, imgHeight]);

  // 嵌入中文字体
  let font;
  try {
    let fontPath = './fonts/NotoSansSC-Regular.ttf';
    if (!fs.existsSync(fontPath)) {
      fontPath = './fonts/SourceHanSansCN-Normal.otf';
    }

    if (fs.existsSync(fontPath)) {
      const fontBytes = fs.readFileSync(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
    } else {
      font = await pdfDoc.embedFont('Helvetica');
    }
  } catch (error) {
    font = await pdfDoc.embedFont('Helvetica');
  }

  // 绘制模板图片
  page.drawImage(templateImage, {
    x: 0,
    y: 0,
    width: imgWidth,
    height: imgHeight,
  });

  // 使用半透明的背景，使网格可见
  const gridColor = rgb(1, 0, 0); // 红色网格
  const labelColor = rgb(1, 0, 0); // 红色标签

  // 绘制垂直网格线（每50像素一条）
  for (let x = 0; x <= imgWidth; x += 50) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: imgHeight },
      thickness: x % 100 === 0 ? 1 : 0.5,
      color: gridColor,
      opacity: x % 100 === 0 ? 0.7 : 0.3,
    });

    // 每100像素显示X坐标
    if (x % 100 === 0 && x > 0) {
      page.drawText(String(x), {
        x: x + 2,
        y: imgHeight - 15,
        size: 10,
        font,
        color: labelColor,
      });
    }
  }

  // 绘制水平网格线（每50像素一条）
  for (let y = 0; y <= imgHeight; y += 50) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: imgWidth, y },
      thickness: y % 100 === 0 ? 1 : 0.5,
      color: gridColor,
      opacity: y % 100 === 0 ? 0.7 : 0.3,
    });

    // 每100像素显示Y坐标
    if (y % 100 === 0 && y > 0) {
      page.drawText(String(y), {
        x: 5,
        y: y + 2,
        size: 10,
        font,
        color: labelColor,
      });
    }
  }

  // 标注关键信息
  page.drawText(`Size: ${imgWidth.toFixed(0)} x ${imgHeight.toFixed(0)}`, {
    x: imgWidth / 2 - 80,
    y: imgHeight - 30,
    size: 12,
    font,
    color: rgb(1, 0, 0),
  });

  page.drawText('Origin (0,0) at bottom-left', {
    x: 10,
    y: 10,
    size: 10,
    font,
    color: rgb(1, 0, 0),
  });

  // 保存PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('template-with-grid.pdf', pdfBytes);
  console.log('✓ 已生成带网格的模板: template-with-grid.pdf');
  console.log(`✓ 模板尺寸: ${imgWidth.toFixed(2)} x ${imgHeight.toFixed(2)} points`);
  console.log('\n使用说明：');
  console.log('1. 打开 template-with-grid.pdf');
  console.log('2. 找到你想放置文本的位置');
  console.log('3. 根据红色网格线读取坐标（每条粗线间隔100，细线间隔50）');
  console.log('4. 在 generate-receipt-template.js 中使用这些坐标');
  console.log('\n提示：PDF坐标系统：');
  console.log('- 原点(0, 0)在左下角');
  console.log('- X轴向右递增');
  console.log('- Y轴向上递增');
  console.log('- 如果你想在"距离顶部60像素"的位置，使用：y = imgHeight - 60');
}

if (require.main === module) {
  createCoordinateHelper()
    .then(() => console.log('\n完成！'))
    .catch(err => {
      console.error('生成失败:', err);
      process.exit(1);
    });
}

module.exports = { createCoordinateHelper };
