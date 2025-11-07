const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// 中文字体路径
const FONT_PATH = path.join(__dirname, 'fonts/NotoSansSC.otf');

// A4 尺寸 (595.28 x 841.89 points)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// 布局常量
const MARGIN_LEFT = 50;
const MARGIN_TOP = 50;
const BINDING_LINE_WIDTH = 30;

/**
 * 生成二维码图片 Buffer
 */
async function generateQRCode(text) {
  return await QRCode.toBuffer(text, {
    width: 80,
    margin: 0
  });
}

/**
 * 绘制单元格
 */
function drawCell(doc, x, y, width, height, text, options = {}) {
  const {
    align = 'left',
    valign = 'center',
    fontSize = 9,
    border = true,
    lineWidth = 0.5
  } = options;

  // 绘制边框
  if (border) {
    doc.lineWidth(lineWidth);
    doc.rect(x, y, width, height).stroke();
  }

  // 绘制文字
  if (text !== undefined && text !== null) {
    doc.fontSize(fontSize);

    const textY = valign === 'center'
      ? y + (height - fontSize) / 2 - 2
      : valign === 'top'
      ? y + 2
      : y + height - fontSize - 2;

    if (align === 'center') {
      doc.text(text, x, textY, {
        width: width,
        align: 'center'
      });
    } else if (align === 'right') {
      doc.text(text, x + width - doc.widthOfString(text) - 3, textY);
    } else {
      doc.text(text, x + 3, textY, {
        width: width - 6,
        lineBreak: false
      });
    }
  }
}

/**
 * 绘制装订线
 */
function drawBindingLine(doc) {
  doc.save();
  doc.fontSize(10);

  // 在左侧绘制虚线
  doc.strokeColor('#999');
  doc.lineWidth(0.5);
  doc.lineCap('round');
  doc.dash(3, { space: 3 });

  // 绘制虚线
  doc.moveTo(BINDING_LINE_WIDTH, 100);
  doc.lineTo(BINDING_LINE_WIDTH, PAGE_HEIGHT - 100);
  doc.stroke();

  doc.undash();

  // 绘制竖排文字
  doc.strokeColor('#000');
  doc.fillColor('#666');

  // 旋转并绘制文字
  doc.rotate(-90, { origin: [15, PAGE_HEIGHT / 2] });
  doc.text('----- -------淮安新业电力建设有限公司 ---- 装订线----------',
    15 - 200, PAGE_HEIGHT / 2 - 5);

  doc.restore();
  doc.fillColor('#000');
}

/**
 * 绘制表格表头和基本信息
 */
function drawHeader(doc, data, qrBuffer) {
  const startX = MARGIN_LEFT + BINDING_LINE_WIDTH;
  const startY = MARGIN_TOP;

  // 绘制二维码
  doc.image(qrBuffer, startX, startY, { width: 70, height: 70 });

  // 绘制标题
  doc.fontSize(22).font(FONT_PATH);
  const title = '差 旅 报 销 单';
  const titleWidth = doc.widthOfString(title);
  const titleX = (PAGE_WIDTH + BINDING_LINE_WIDTH) / 2 - titleWidth / 2;
  doc.text(title, titleX, startY + 10);

  // 绘制日期
  doc.fontSize(14);
  const dateWidth = doc.widthOfString(data.date);
  const dateX = (PAGE_WIDTH + BINDING_LINE_WIDTH) / 2 - dateWidth / 2;
  doc.text(data.date, dateX, startY + 38);

  // 绘制右上角信息
  doc.fontSize(9);
  const rightX = PAGE_WIDTH - 130;
  doc.text(`部门：${data.department}`, rightX, startY + 10);
  doc.text(`页码：${data.pageNumber}`, rightX, startY + 25);
  doc.text(`金额：${data.totalAmount}元 / ${data.totalAmount}元`, rightX, startY + 40);
}

/**
 * 绘制主表格
 */
function drawTable(doc, data) {
  const startX = MARGIN_LEFT + BINDING_LINE_WIDTH;
  const startY = MARGIN_TOP + 75;
  const tableWidth = PAGE_WIDTH - MARGIN_LEFT * 2 - BINDING_LINE_WIDTH;

  // 行高
  const rowHeight = 25;
  const headerRowHeight = 30;

  let currentY = startY;

  // 第一行：出差人信息
  const row1_col1_width = 60;
  const row1_col2_width = 100;
  const row1_col3_width = 80;
  const row1_col4_width = 80;
  const row1_col5_width = tableWidth - row1_col1_width - row1_col2_width - row1_col3_width - row1_col4_width;

  drawCell(doc, startX, currentY, row1_col1_width, headerRowHeight, '出差人', { align: 'center', fontSize: 10 });
  drawCell(doc, startX + row1_col1_width, currentY, row1_col2_width, headerRowHeight, data.employee, { align: 'center', fontSize: 10 });
  drawCell(doc, startX + row1_col1_width + row1_col2_width, currentY, row1_col3_width, headerRowHeight, '出差事由', { align: 'center', fontSize: 10 });
  drawCell(doc, startX + row1_col1_width + row1_col2_width + row1_col3_width, currentY, row1_col4_width, headerRowHeight, data.reason, { align: 'center', fontSize: 10 });
  drawCell(doc, startX + row1_col1_width + row1_col2_width + row1_col3_width + row1_col4_width, currentY, row1_col5_width, headerRowHeight, '项目名称', { align: 'center', fontSize: 10 });

  currentY += headerRowHeight;

  // 第二行：主表头（出发、到达等）
  const mainHeaderWidths = {
    departure: 120,
    arrival: 120,
    transport: 95,
    days: 30,
    allowance: 95,
    otherFees: 200,
    subtotal: 50,
    receipts: tableWidth - 120 - 120 - 95 - 30 - 95 - 200 - 50
  };

  let x = startX;
  drawCell(doc, x, currentY, mainHeaderWidths.departure, rowHeight, '出发', { align: 'center', fontSize: 9 });
  x += mainHeaderWidths.departure;
  drawCell(doc, x, currentY, mainHeaderWidths.arrival, rowHeight, '到达', { align: 'center', fontSize: 9 });
  x += mainHeaderWidths.arrival;
  drawCell(doc, x, currentY, mainHeaderWidths.transport, rowHeight, '交通', { align: 'center', fontSize: 9 });
  x += mainHeaderWidths.transport;
  drawCell(doc, x, currentY, mainHeaderWidths.days, rowHeight, '天\n数', { align: 'center', fontSize: 8 });
  x += mainHeaderWidths.days;
  drawCell(doc, x, currentY, mainHeaderWidths.allowance, rowHeight, '出差补贴', { align: 'center', fontSize: 9 });
  x += mainHeaderWidths.allowance;
  drawCell(doc, x, currentY, mainHeaderWidths.otherFees, rowHeight, '其他费用金额', { align: 'center', fontSize: 9 });
  x += mainHeaderWidths.otherFees;
  drawCell(doc, x, currentY, mainHeaderWidths.subtotal, rowHeight, '小计', { align: 'center', fontSize: 9 });
  x += mainHeaderWidths.subtotal;
  drawCell(doc, x, currentY, mainHeaderWidths.receipts, rowHeight, '单据\n张数', { align: 'center', fontSize: 8 });

  currentY += rowHeight;

  // 第三行：详细列名
  const detailHeaderWidths = {
    depDate: 60,
    depPlace: 60,
    arrDate: 60,
    arrPlace: 60,
    tool: 45,
    amount: 50,
    standard: 30,
    allowanceAmt: 47,
    accommodation: 48,
    localTransport: 51,
    other: 50,
    subtotal: 50,
    receipts: tableWidth - 60 - 60 - 60 - 60 - 45 - 50 - 30 - 47 - 48 - 51 - 50 - 50
  };

  x = startX;
  drawCell(doc, x, currentY, detailHeaderWidths.depDate, rowHeight, '日期', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.depDate;
  drawCell(doc, x, currentY, detailHeaderWidths.depPlace, rowHeight, '地点', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.depPlace;
  drawCell(doc, x, currentY, detailHeaderWidths.arrDate, rowHeight, '日期', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.arrDate;
  drawCell(doc, x, currentY, detailHeaderWidths.arrPlace, rowHeight, '地点', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.arrPlace;
  drawCell(doc, x, currentY, detailHeaderWidths.tool, rowHeight, '工具', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.tool;
  drawCell(doc, x, currentY, detailHeaderWidths.amount, rowHeight, '金额', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.amount;
  drawCell(doc, x, currentY, detailHeaderWidths.standard, rowHeight, '', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.standard;
  drawCell(doc, x, currentY, detailHeaderWidths.allowanceAmt, rowHeight, '标准', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.allowanceAmt;
  drawCell(doc, x, currentY, detailHeaderWidths.accommodation, rowHeight, '金额', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.accommodation;
  drawCell(doc, x, currentY, detailHeaderWidths.localTransport, rowHeight, '住宿', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.localTransport;
  drawCell(doc, x, currentY, detailHeaderWidths.other, rowHeight, '市内\n交通', { align: 'center', fontSize: 7 });
  x += detailHeaderWidths.other;
  drawCell(doc, x, currentY, detailHeaderWidths.subtotal, rowHeight, '其他\n费用', { align: 'center', fontSize: 7 });
  x += detailHeaderWidths.subtotal;
  drawCell(doc, x, currentY, detailHeaderWidths.receipts, rowHeight, '', { align: 'center', fontSize: 8 });

  currentY += rowHeight;

  // 明细行
  data.details.forEach(detail => {
    x = startX;
    drawCell(doc, x, currentY, detailHeaderWidths.depDate, rowHeight, detail.departureDate, { align: 'center', fontSize: 7 });
    x += detailHeaderWidths.depDate;
    drawCell(doc, x, currentY, detailHeaderWidths.depPlace, rowHeight, detail.departurePlace, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.depPlace;
    drawCell(doc, x, currentY, detailHeaderWidths.arrDate, rowHeight, detail.arrivalDate, { align: 'center', fontSize: 7 });
    x += detailHeaderWidths.arrDate;
    drawCell(doc, x, currentY, detailHeaderWidths.arrPlace, rowHeight, detail.arrivalPlace, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.arrPlace;
    drawCell(doc, x, currentY, detailHeaderWidths.tool, rowHeight, detail.transport, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.tool;
    drawCell(doc, x, currentY, detailHeaderWidths.amount, rowHeight, detail.transportAmount, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.amount;
    drawCell(doc, x, currentY, detailHeaderWidths.standard, rowHeight, detail.days, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.standard;
    drawCell(doc, x, currentY, detailHeaderWidths.allowanceAmt, rowHeight, detail.allowanceStandard, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.allowanceAmt;
    drawCell(doc, x, currentY, detailHeaderWidths.accommodation, rowHeight, detail.allowanceAmount, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.accommodation;
    drawCell(doc, x, currentY, detailHeaderWidths.localTransport, rowHeight, detail.accommodation, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.localTransport;
    drawCell(doc, x, currentY, detailHeaderWidths.other, rowHeight, detail.localTransport, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.other;
    drawCell(doc, x, currentY, detailHeaderWidths.subtotal, rowHeight, detail.otherExpenses, { align: 'center', fontSize: 8 });
    x += detailHeaderWidths.subtotal;
    drawCell(doc, x, currentY, detailHeaderWidths.receipts, rowHeight, '', { align: 'center', fontSize: 8 });

    currentY += rowHeight;
  });

  // 空行（填充到固定行数）
  const emptyRows = 3 - data.details.length;
  for (let i = 0; i < emptyRows; i++) {
    x = startX;
    for (let key in detailHeaderWidths) {
      drawCell(doc, x, currentY, detailHeaderWidths[key], rowHeight, '', { fontSize: 8 });
      x += detailHeaderWidths[key];
    }
    currentY += rowHeight;
  }

  // 合计行
  x = startX;
  drawCell(doc, x, currentY, detailHeaderWidths.depDate + detailHeaderWidths.depPlace + detailHeaderWidths.arrDate + detailHeaderWidths.arrPlace, rowHeight, '合    计', { align: 'center', fontSize: 9 });
  x += detailHeaderWidths.depDate + detailHeaderWidths.depPlace + detailHeaderWidths.arrDate + detailHeaderWidths.arrPlace;
  drawCell(doc, x, currentY, detailHeaderWidths.tool, rowHeight, '', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.tool;
  drawCell(doc, x, currentY, detailHeaderWidths.amount, rowHeight, data.summary.totalTransport, { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.amount;
  drawCell(doc, x, currentY, detailHeaderWidths.standard, rowHeight, data.summary.totalDays, { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.standard;
  drawCell(doc, x, currentY, detailHeaderWidths.allowanceAmt, rowHeight, '--', { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.allowanceAmt;
  drawCell(doc, x, currentY, detailHeaderWidths.accommodation, rowHeight, data.summary.totalAllowance, { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.accommodation;
  drawCell(doc, x, currentY, detailHeaderWidths.localTransport, rowHeight, data.summary.totalAccommodation, { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.localTransport;
  drawCell(doc, x, currentY, detailHeaderWidths.other, rowHeight, data.summary.totalLocalTransport, { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.other;
  drawCell(doc, x, currentY, detailHeaderWidths.subtotal, rowHeight, data.summary.totalOther, { align: 'center', fontSize: 8 });
  x += detailHeaderWidths.subtotal;
  drawCell(doc, x, currentY, detailHeaderWidths.receipts, rowHeight, data.summary.grandTotal, { align: 'center', fontSize: 8 });

  currentY += rowHeight;

  // 金额合计行
  const summaryRowHeight = 35;
  drawCell(doc, startX, currentY, 120, summaryRowHeight, '金额合计\n（大写）', { align: 'center', fontSize: 9 });
  drawCell(doc, startX + 120, currentY, 250, summaryRowHeight, `${data.summary.amountInWords}  ¥：${data.summary.amountInNumbers}`, { align: 'left', fontSize: 9, valign: 'center' });
  drawCell(doc, startX + 370, currentY, 80, summaryRowHeight, `预借金额`, { align: 'center', fontSize: 9 });
  drawCell(doc, startX + 450, currentY, 100, summaryRowHeight, '_________', { align: 'center', fontSize: 9 });
  drawCell(doc, startX + 550, currentY, 100, summaryRowHeight, '退/补金额_________', { align: 'left', fontSize: 8 });

  currentY += summaryRowHeight;

  // 审批栏
  const approvalRowHeight = 50;
  const approvalWidth = tableWidth / 6;

  const approvers = ['领导批审', '部门负责人', '财务负责人', '会计', '出纳', '领款人'];
  x = startX;
  approvers.forEach(approver => {
    drawCell(doc, x, currentY, approvalWidth, approvalRowHeight, approver, { align: 'center', fontSize: 9 });
    x += approvalWidth;
  });
}

/**
 * 生成报销单 PDF
 */
async function generateReimbursementPDF(data, outputPath) {
  // 创建 PDF 文档
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  // 输出到文件
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // 注册中文字体
  doc.registerFont('cn', FONT_PATH);
  doc.font('cn');

  // 生成二维码
  const qrBuffer = await generateQRCode(data.code);

  // 绘制装订线
  drawBindingLine(doc);

  // 绘制表头和基本信息
  drawHeader(doc, data, qrBuffer);

  // 绘制主表格
  drawTable(doc, data);

  // 完成 PDF
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// 主函数
async function main() {
  try {
    const data = require('./mock-data');
    const outputPath = path.join(__dirname, 'generated-receipt.pdf');

    console.log('开始生成报销单 PDF...');
    await generateReimbursementPDF(data, outputPath);
    console.log(`报销单 PDF 生成成功: ${outputPath}`);
  } catch (error) {
    console.error('生成报销单失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { generateReimbursementPDF };
