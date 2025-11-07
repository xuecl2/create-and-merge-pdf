const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

/**
 * 使用PDF模板生成报销单
 * 方案1：基于图片模板，在指定坐标位置填充文本
 */
async function generateReceiptFromTemplate(data, outputPath) {
  // 创建PDF文档
  const pdfDoc = await PDFDocument.create();

  // 注册fontkit以支持自定义字体
  pdfDoc.registerFontkit(fontkit);

  // 读取模板图片
  const templateImageBytes = fs.readFileSync('./template.png');
  const templateImage = await pdfDoc.embedPng(templateImageBytes);

  // 获取图片尺寸
  const { width: imgWidth, height: imgHeight } = templateImage.scale(1);

  // 创建页面，尺寸与模板图片一致
  const page = pdfDoc.addPage([imgWidth, imgHeight]);

  // 绘制模板图片作为背景
  page.drawImage(templateImage, {
    x: 0,
    y: 0,
    width: imgWidth,
    height: imgHeight,
  });

  // 嵌入中文字体
  let font;
  try {
    // 优先尝试已有的字体
    let fontPath = './fonts/NotoSansSC-Regular.ttf';
    if (!fs.existsSync(fontPath)) {
      fontPath = './fonts/SourceHanSansCN-Normal.otf';
    }

    if (fs.existsSync(fontPath)) {
      const fontBytes = fs.readFileSync(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
      console.log(`✓ 已加载字体: ${fontPath}`);
    } else {
      throw new Error('未找到中文字体文件');
    }
  } catch (error) {
    console.error('字体加载失败:', error.message);
    throw error;
  }

  // 定义文本样式
  const textColor = rgb(0, 0, 0);
  const fontSize = 10;
  const smallFontSize = 8;

  /**
   * 辅助函数：在指定位置绘制文本
   * @param {string} text - 要绘制的文本
   * @param {number} x - X坐标（从左边开始）
   * @param {number} y - Y坐标（从底部开始）
   * @param {number} size - 字体大小
   */
  const drawText = (text, x, y, size = fontSize) => {
    page.drawText(String(text || ''), {
      x,
      y,
      size,
      font,
      color: textColor,
    });
  };

  // === 填充数据 ===
  // 注意：PDF坐标系原点在左下角，Y轴向上递增
  // 需要根据template.png的实际布局调整坐标

  // 右上角信息
  drawText(data.department || '', 740, imgHeight - 60, smallFontSize); // 部门
  drawText(data.date || '', 740, imgHeight - 75, smallFontSize); // 日期
  drawText(data.totalAmount || '', 760, imgHeight - 90, smallFontSize); // 金额

  // 表头信息
  drawText(data.traveler || '', 100, imgHeight - 135, fontSize); // 出差人
  drawText(data.reason || '', 350, imgHeight - 135, fontSize); // 出差事由
  drawText(data.projectName || '', 620, imgHeight - 135, fontSize); // 项目名称

  // 行程明细
  let rowY = imgHeight - 200; // 第一行数据的Y坐标
  const rowHeight = 30; // 每行高度

  if (data.trips && data.trips.length > 0) {
    data.trips.forEach((trip, index) => {
      const y = rowY - (index * rowHeight);

      // 出发
      drawText(trip.departDate || '', 40, y, smallFontSize);
      drawText(trip.departPlace || '', 110, y, smallFontSize);

      // 到达
      drawText(trip.arriveDate || '', 210, y, smallFontSize);
      drawText(trip.arrivePlace || '', 280, y, smallFontSize);

      // 交通工具
      drawText(trip.transport || '', 340, y, smallFontSize);

      // 金额
      drawText(trip.transportFee || '', 385, y, smallFontSize);

      // 天数
      drawText(trip.days || '', 435, y, smallFontSize);

      // 出差补贴
      drawText(trip.allowanceStd || '', 480, y, smallFontSize); // 标准
      drawText(trip.allowanceFee || '', 520, y, smallFontSize); // 金额

      // 其他费用明细
      drawText(trip.accommodation || '', 570, y, smallFontSize); // 住宿
      drawText(trip.localTransport || '', 620, y, smallFontSize); // 市内交通
      drawText(trip.otherFee || '', 670, y, smallFontSize); // 其他

      // 小计
      drawText(trip.subtotal || '', 730, y, smallFontSize);
      drawText(trip.memo || '', 790, y, smallFontSize);
    });
  }

  // 合计行
  const totalY = rowY - (5 * rowHeight); // 合计行位置
  drawText(data.totalTransportFee || '', 385, totalY, fontSize);
  drawText(data.totalDays || '', 435, totalY, fontSize);
  drawText(data.totalAllowanceFee || '', 520, totalY, fontSize);
  drawText(data.totalAccommodation || '', 570, totalY, fontSize);
  drawText(data.totalLocalTransport || '', 620, totalY, fontSize);
  drawText(data.totalOtherFee || '', 670, totalY, fontSize);
  drawText(data.totalAmount || '', 730, totalY, fontSize);

  // 金额合计（大写）
  drawText(data.totalAmountChinese || '', 180, totalY - 35, fontSize);

  // 底部审批栏（如果需要添加签名等信息）
  // drawText('审核人', 100, 80, smallFontSize);

  // 保存PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ PDF已生成: ${outputPath}`);

  return outputPath;
}

// 测试数据
const testData = {
  date: '2025年07月28日',
  department: '经营计划室',
  totalAmount: '99.00',
  traveler: '谢松',
  reason: '999',
  projectName: '',
  trips: [
    {
      departDate: '2025-07-29',
      departPlace: '444',
      arriveDate: '2025-07-29',
      arrivePlace: '555',
      transport: '高铁',
      transportFee: '44.00',
      days: '0.0',
      allowanceStd: '50.00',
      allowanceFee: '0.00',
      accommodation: '0.00',
      localTransport: '0.00',
      otherFee: '0.00',
      subtotal: '44.00',
      memo: ''
    },
    {
      departDate: '2025-07-29',
      departPlace: '55',
      arriveDate: '2025-07-29',
      arrivePlace: '',
      transport: '高铁',
      transportFee: '55.00',
      days: '0.0',
      allowanceStd: '50.00',
      allowanceFee: '0.00',
      accommodation: '0.00',
      localTransport: '0.00',
      otherFee: '0.00',
      subtotal: '55.00',
      memo: ''
    }
  ],
  totalTransportFee: '99.00',
  totalDays: '0.0',
  totalAllowanceFee: '0.00',
  totalAccommodation: '0.00',
  totalLocalTransport: '0.00',
  totalOtherFee: '0.00',
  totalAmountChinese: '玖拾玖元整',
  companyName: '淮安新业电力建设有限公司'
};

// 如果直接运行此文件
if (require.main === module) {
  const outputFile = process.argv[2] || 'receipt-from-template.pdf';
  generateReceiptFromTemplate(testData, outputFile)
    .then(() => {
      console.log('完成！');
    })
    .catch(err => {
      console.error('生成失败:', err);
      process.exit(1);
    });
}

module.exports = { generateReceiptFromTemplate };
