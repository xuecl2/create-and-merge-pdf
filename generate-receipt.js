const fs = require('fs');
const PDFDocument = require('pdfkit');

/**
 * 生成差旅报销单 PDF
 * @param {object} data - 报销单数据
 * @param {string} outputPath - 输出文件路径
 */
async function generateReceipt(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // 创建 PDF 文档 - 使用横向 A4
      const doc = new PDFDocument({
        size: [841.89, 595.28], // A4 横向
        margins: { top: 30, bottom: 30, left: 40, right: 40 }
      });

      // 创建写入流
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // 注册中文字体（使用系统字体）
      const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
      if (fs.existsSync(fontPath)) {
        doc.registerFont('normal', fontPath);
        doc.font('normal');
      }

      const pageWidth = 841.89;
      const pageHeight = 595.28;
      const margin = 40;

      // 绘制标题
      doc.fontSize(20)
         .text('差 旅 报 销 单', margin, 40, { align: 'center', underline: true });

      // 绘制日期（标题下方）
      doc.fontSize(14)
         .text(data.date || '2025年07月28日', margin, 70, { align: 'center' });

      // 右上角信息
      const rightX = pageWidth - margin - 200;
      doc.fontSize(10)
         .text(`部门：${data.department || ''}`, rightX, 40, { width: 200, align: 'left' })
         .text(`页码：第 1 页/ 共 1 页`, rightX, 55, { width: 200, align: 'left' })
         .text(`金额：${data.totalAmount || '0.00'}元 / ${data.totalAmount || '0.00'}元`, rightX, 70, { width: 200, align: 'left' });

      // 基本信息区域
      let currentY = 110;
      const col1X = margin;
      const col2X = margin + 80;
      const col3X = margin + 280;
      const col4X = margin + 360;
      const col5X = margin + 520;
      const col6X = margin + 600;

      doc.fontSize(10)
         .text('出差人', col1X, currentY)
         .text(data.traveler || '', col2X, currentY)
         .text('出差事由', col3X, currentY)
         .text(data.reason || '', col4X, currentY)
         .text('项目名称', col5X, currentY)
         .text(data.projectName || '', col6X, currentY);

      // 绘制表格
      currentY = 140;
      const tableTop = currentY;
      const rowHeight = 25;

      // 表头
      const headers = [
        { text: '出发', x: col1X, width: 100 },
        { text: '到达', x: col1X + 100, width: 100 },
        { text: '交通', x: col1X + 200, width: 80 },
        { text: '天\n数', x: col1X + 280, width: 30 },
        { text: '出差补贴', x: col1X + 310, width: 90 },
        { text: '其他费用金额', x: col1X + 400, width: 200 },
        { text: '小计', x: col1X + 600, width: 50 },
        { text: '单据\n张数', x: col1X + 650, width: 50 }
      ];

      // 绘制第一行表头
      doc.fontSize(9);
      headers.forEach(header => {
        doc.text(header.text, header.x, currentY, { width: header.width, align: 'center' });
      });

      currentY += rowHeight;

      // 绘制第二行表头（子表头）
      const subHeaders = [
        { text: '日期', x: col1X, width: 50 },
        { text: '地点', x: col1X + 50, width: 50 },
        { text: '日期', x: col1X + 100, width: 50 },
        { text: '地点', x: col1X + 150, width: 50 },
        { text: '工具', x: col1X + 200, width: 40 },
        { text: '金额', x: col1X + 240, width: 40 },
        { text: '', x: col1X + 280, width: 30 },
        { text: '标准', x: col1X + 310, width: 45 },
        { text: '金额', x: col1X + 355, width: 45 },
        { text: '住宿', x: col1X + 400, width: 50 },
        { text: '市内\n交通', x: col1X + 450, width: 50 },
        { text: '其他\n费用', x: col1X + 500, width: 50 },
        { text: '', x: col1X + 600, width: 50 },
        { text: '', x: col1X + 650, width: 50 }
      ];

      subHeaders.forEach(header => {
        doc.text(header.text, header.x, currentY, { width: header.width, align: 'center' });
      });

      currentY += rowHeight;

      // 绘制数据行
      const trips = data.trips || [];
      trips.forEach((trip, index) => {
        doc.fontSize(9)
           .text(trip.departDate || '', col1X, currentY, { width: 50, align: 'center' })
           .text(trip.departPlace || '', col1X + 50, currentY, { width: 50, align: 'center' })
           .text(trip.arriveDate || '', col1X + 100, currentY, { width: 50, align: 'center' })
           .text(trip.arrivePlace || '', col1X + 150, currentY, { width: 50, align: 'center' })
           .text(trip.transport || '', col1X + 200, currentY, { width: 40, align: 'center' })
           .text(trip.transportFee || '0.00', col1X + 240, currentY, { width: 40, align: 'center' })
           .text(trip.days || '0.0', col1X + 280, currentY, { width: 30, align: 'center' })
           .text(trip.allowanceStd || '50.00', col1X + 310, currentY, { width: 45, align: 'center' })
           .text(trip.allowanceFee || '0.00', col1X + 355, currentY, { width: 45, align: 'center' })
           .text(trip.accommodation || '0.00', col1X + 400, currentY, { width: 50, align: 'center' })
           .text(trip.localTransport || '0.00', col1X + 450, currentY, { width: 50, align: 'center' })
           .text(trip.otherFee || '0.00', col1X + 500, currentY, { width: 50, align: 'center' })
           .text(trip.subtotal || '0.00', col1X + 600, currentY, { width: 50, align: 'center' });

        currentY += rowHeight;
      });

      // 填充空行（至少4行）
      for (let i = trips.length; i < 4; i++) {
        currentY += rowHeight;
      }

      // 合计行
      doc.fontSize(10)
         .text('合  计', col1X + 180, currentY, { width: 60, align: 'center' })
         .text(data.totalTransportFee || '0.00', col1X + 240, currentY, { width: 40, align: 'center' })
         .text(data.totalDays || '0.0', col1X + 280, currentY, { width: 30, align: 'center' })
         .text('--', col1X + 310, currentY, { width: 45, align: 'center' })
         .text(data.totalAllowanceFee || '0.00', col1X + 355, currentY, { width: 45, align: 'center' })
         .text(data.totalAccommodation || '0.00', col1X + 400, currentY, { width: 50, align: 'center' })
         .text(data.totalLocalTransport || '0.00', col1X + 450, currentY, { width: 50, align: 'center' })
         .text(data.totalOtherFee || '0.00', col1X + 500, currentY, { width: 50, align: 'center' })
         .text(data.totalAmount || '0.00', col1X + 600, currentY, { width: 50, align: 'center' });

      currentY += rowHeight + 5;

      // 金额合计行
      doc.fontSize(10)
         .text('金额合计', col1X, currentY)
         .text('（大写）', col1X, currentY + 15)
         .text(`${data.totalAmountChinese || ''}`, col1X + 60, currentY + 7)
         .text(`¥：${data.totalAmount || '0.00'}`, col1X + 200, currentY + 7)
         .text(`预借金额 _________`, col1X + 350, currentY + 7)
         .text(`退/补金额_________`, col1X + 520, currentY + 7);

      currentY += 45;

      // 签名栏
      const signY = currentY;
      const signatureSpacing = 110;

      doc.fontSize(10)
         .text('领导批审', col1X, signY, { width: 100, align: 'center' })
         .text('部门负责人', col1X + signatureSpacing, signY, { width: 100, align: 'center' })
         .text('财务负责人', col1X + signatureSpacing * 2, signY, { width: 100, align: 'center' })
         .text('会计', col1X + signatureSpacing * 3, signY, { width: 100, align: 'center' })
         .text('出纳', col1X + signatureSpacing * 4, signY, { width: 100, align: 'center' })
         .text('领款人', col1X + signatureSpacing * 5, signY, { width: 100, align: 'center' });

      // 绘制表格边框
      drawTableBorders(doc, tableTop, rowHeight, trips.length);

      // 底部装订线
      doc.fontSize(9)
         .text(`----- -------${data.companyName || '淮安新业电力建设有限公司'} ---- 装订线----------`,
               margin, pageHeight - 50, { align: 'center' });

      // 完成 PDF
      doc.end();

      stream.on('finish', () => {
        console.log(`报销单生成成功: ${outputPath}`);
        resolve(outputPath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 绘制表格边框
 */
function drawTableBorders(doc, tableTop, rowHeight, dataRows) {
  const margin = 40;
  const tableWidth = 761.89 - margin * 2;
  const tableHeight = rowHeight * (2 + dataRows + 2); // 2行表头 + 数据行 + 合计行 + 金额合计行

  // 外框
  doc.rect(margin, tableTop, tableWidth, tableHeight).stroke();

  // 横线
  for (let i = 1; i <= dataRows + 3; i++) {
    doc.moveTo(margin, tableTop + rowHeight * i)
       .lineTo(margin + tableWidth, tableTop + rowHeight * i)
       .stroke();
  }

  // 竖线
  const verticalLines = [50, 100, 150, 200, 240, 280, 310, 355, 400, 450, 500, 600, 650];
  verticalLines.forEach(x => {
    doc.moveTo(margin + x, tableTop)
       .lineTo(margin + x, tableTop + rowHeight * (dataRows + 3))
       .stroke();
  });

  // 合并单元格的特殊边框（第一行表头的合并单元格）
  const mergeLines = [
    { x: margin + 100, y1: tableTop, y2: tableTop + rowHeight },
    { x: margin + 200, y1: tableTop, y2: tableTop + rowHeight },
    { x: margin + 280, y1: tableTop, y2: tableTop + rowHeight * 2 },
    { x: margin + 310, y1: tableTop, y2: tableTop + rowHeight },
    { x: margin + 400, y1: tableTop, y2: tableTop + rowHeight },
    { x: margin + 600, y1: tableTop, y2: tableTop + rowHeight * 2 },
    { x: margin + 650, y1: tableTop, y2: tableTop + rowHeight * 2 }
  ];

  mergeLines.forEach(line => {
    doc.moveTo(line.x, line.y1)
       .lineTo(line.x, line.y2)
       .stroke();
  });
}

// 命令行参数处理
if (require.main === module) {
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
        departDate: '2025-07-29 00',
        departPlace: '444',
        arriveDate: '2025-07-29',
        arrivePlace: '',
        transport: '高铁',
        transportFee: '44.00',
        days: '0.0',
        allowanceStd: '50.00',
        allowanceFee: '0.00',
        accommodation: '0.00',
        localTransport: '0.00',
        otherFee: '0.00',
        subtotal: '44.00'
      },
      {
        departDate: '2025-07-29 00',
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
        subtotal: '55.00'
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

  const outputPath = process.argv[2] || '生成的报销单.pdf';

  generateReceipt(testData, outputPath)
    .then(() => {
      console.log('生成完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('生成失败:', error);
      process.exit(1);
    });
}

module.exports = { generateReceipt };
