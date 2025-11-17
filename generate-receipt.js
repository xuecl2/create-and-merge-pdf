const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// 中文字体路径
const FONT_PATH = path.join(__dirname, 'fonts/NotoSansSC.otf');

// A5 横向尺寸 (595.28 x 420 points)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 420;

// 布局常量
const MARGIN_LEFT = 40;
const MARGIN_TOP = 30;
const BINDING_LINE_WIDTH = 25;

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
 * 绘制线条
 */
function drawLine(doc, x1, y1, x2, y2, lineWidth = 0.5) {
  doc.lineWidth(lineWidth);
  doc.moveTo(x1, y1);
  doc.lineTo(x2, y2);
  doc.stroke();
}

/**
 * 绘制矩形边框（不填充）
 */
function drawRect(doc, x, y, width, height, lineWidth = 0.5) {
  doc.lineWidth(lineWidth);
  doc.rect(x, y, width, height);
  doc.stroke();
}

/**
 * 绘制文字（带位置和对齐）
 */
function drawText(doc, text, x, y, options = {}) {
  const {
    width = 0,
    height = 0,
    align = 'left',
    valign = 'center',
    fontSize = 9
  } = options;

  if (text === undefined || text === null || text === '') {
    return;
  }

  doc.fontSize(fontSize);

  let textX = x;
  let textY = y;

  // 垂直对齐
  if (valign === 'center' && height > 0) {
    textY = y + (height - fontSize) / 2 - 2;
  } else if (valign === 'top') {
    textY = y + 3;
  } else if (valign === 'bottom' && height > 0) {
    textY = y + height - fontSize - 3;
  }

  // 水平对齐
  if (align === 'center' && width > 0) {
    textX = x + (width - doc.widthOfString(String(text))) / 2;
  } else if (align === 'right' && width > 0) {
    textX = x + width - doc.widthOfString(String(text)) - 3;
  } else {
    textX = x + 3;
  }

  doc.text(String(text), textX, textY, {
    lineBreak: false
  });
}

/**
 * 绘制装订线
 */
function drawBindingLine(doc) {
  doc.save();

  // 绘制虚线
  doc.strokeColor('#999');
  doc.lineWidth(0.5);
  doc.lineCap('round');
  doc.dash(3, { space: 3 });

  doc.moveTo(BINDING_LINE_WIDTH, 60);
  doc.lineTo(BINDING_LINE_WIDTH, PAGE_HEIGHT - 60);
  doc.stroke();

  doc.undash();

  // 绘制竖排文字
  doc.strokeColor('#000');
  doc.fillColor('#666');
  doc.fontSize(10);

  // 旋转并绘制文字
  doc.rotate(-90, { origin: [15, PAGE_HEIGHT / 2] });
  doc.text('----- -------淮安新业电力建设有限公司 ---- 装订线----------',
    15 - 200, PAGE_HEIGHT / 2 - 5);

  doc.restore();
  doc.fillColor('#000');
}

/**
 * 绘制表头和基本信息
 */
function drawHeader(doc, data, qrBuffer) {
  const startX = MARGIN_LEFT + BINDING_LINE_WIDTH;
  const startY = MARGIN_TOP;

  // 绘制二维码（A5 横向优化尺寸）
  doc.image(qrBuffer, startX, startY, { width: 55, height: 55 });

  // 绘制标题
  doc.fontSize(18).font(FONT_PATH);
  const title = '差 旅 报 销 单';
  const titleWidth = doc.widthOfString(title);
  const titleX = (PAGE_WIDTH + BINDING_LINE_WIDTH) / 2 - titleWidth / 2;
  doc.text(title, titleX, startY + 5);

  // 绘制标题下划线
  const underlineY = startY + 28;
  doc.lineWidth(1);
  doc.moveTo(titleX, underlineY);
  doc.lineTo(titleX + titleWidth, underlineY);
  doc.stroke();

  // 绘制日期
  doc.fontSize(12);
  const dateWidth = doc.widthOfString(data.date);
  const dateX = (PAGE_WIDTH + BINDING_LINE_WIDTH) / 2 - dateWidth / 2;
  doc.text(data.date, dateX, startY + 33);

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
  const startY = MARGIN_TOP + 60;
  const tableWidth = PAGE_WIDTH - MARGIN_LEFT * 2 - BINDING_LINE_WIDTH;

  // 定义列宽（A5 横向优化）
  const colWidths = {
    depDate: 56,        // 出发日期
    depPlace: 50,       // 出发地点
    arrDate: 56,        // 到达日期
    arrPlace: 50,       // 到达地点
    tool: 40,           // 交通工具
    transportAmt: 45,   // 交通金额
    days: 22,           // 天数
    standard: 40,       // 补贴标准
    allowanceAmt: 42,   // 补贴金额
    accommodation: 42,  // 住宿
    localTransport: 42, // 市内交通
    otherExpenses: 42,  // 其他费用
    subtotal: 45,       // 小计
    receipts: 0         // 单据张数（剩余宽度）
  };

  // 计算剩余宽度
  const usedWidth = Object.values(colWidths).reduce((sum, w) => sum + w, 0) - colWidths.receipts;
  colWidths.receipts = tableWidth - usedWidth;

  // 行高（A5 横向优化）
  const infoRowHeight = 20;
  const headerRow1Height = 20;
  const headerRow2Height = 20;
  const dataRowHeight = 20;
  const summaryRowHeight = 25;
  const approvalRowHeight = 40;

  let currentY = startY;

  // ===== 第一行：基本信息 =====
  const infoRow = {
    col1: { width: 60, text: '出差人' },
    col2: { width: 100, text: data.employee },
    col3: { width: 80, text: '出差事由' },
    col4: { width: 80, text: data.reason },
    col5: { width: tableWidth - 320, text: '项目名称' }
  };

  let x = startX;
  drawRect(doc, x, currentY, infoRow.col1.width, infoRowHeight);
  drawText(doc, infoRow.col1.text, x, currentY, { width: infoRow.col1.width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += infoRow.col1.width;

  drawRect(doc, x, currentY, infoRow.col2.width, infoRowHeight);
  drawText(doc, infoRow.col2.text, x, currentY, { width: infoRow.col2.width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += infoRow.col2.width;

  drawRect(doc, x, currentY, infoRow.col3.width, infoRowHeight);
  drawText(doc, infoRow.col3.text, x, currentY, { width: infoRow.col3.width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += infoRow.col3.width;

  drawRect(doc, x, currentY, infoRow.col4.width, infoRowHeight);
  drawText(doc, infoRow.col4.text, x, currentY, { width: infoRow.col4.width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += infoRow.col4.width;

  drawRect(doc, x, currentY, infoRow.col5.width, infoRowHeight);
  drawText(doc, infoRow.col5.text, x, currentY, { width: infoRow.col5.width, height: infoRowHeight, align: 'center', fontSize: 10 });

  currentY += infoRowHeight;

  // ===== 第二行：主表头 =====
  const mainHeaderY = currentY;

  x = startX;
  // 出发
  drawRect(doc, x, currentY, colWidths.depDate + colWidths.depPlace, headerRow1Height);
  drawText(doc, '出发', x, currentY, { width: colWidths.depDate + colWidths.depPlace, height: headerRow1Height, align: 'center', fontSize: 10 });
  x += colWidths.depDate + colWidths.depPlace;

  // 到达
  drawRect(doc, x, currentY, colWidths.arrDate + colWidths.arrPlace, headerRow1Height);
  drawText(doc, '到达', x, currentY, { width: colWidths.arrDate + colWidths.arrPlace, height: headerRow1Height, align: 'center', fontSize: 10 });
  x += colWidths.arrDate + colWidths.arrPlace;

  // 交通
  drawRect(doc, x, currentY, colWidths.tool + colWidths.transportAmt, headerRow1Height);
  drawText(doc, '交通', x, currentY, { width: colWidths.tool + colWidths.transportAmt, height: headerRow1Height, align: 'center', fontSize: 10 });
  x += colWidths.tool + colWidths.transportAmt;

  // 天数（竖排，跨两行）
  const daysX = x;
  drawRect(doc, x, currentY, colWidths.days, headerRow1Height + headerRow2Height);
  doc.save();
  doc.translate(x + colWidths.days / 2 + 2, currentY + (headerRow1Height + headerRow2Height) / 2);
  doc.rotate(-90);
  doc.fontSize(9);
  doc.text('天数', -doc.widthOfString('天数') / 2, -4.5, { lineBreak: false });
  doc.restore();
  x += colWidths.days;

  // 出差补贴
  drawRect(doc, x, currentY, colWidths.standard + colWidths.allowanceAmt, headerRow1Height);
  drawText(doc, '出差补贴', x, currentY, { width: colWidths.standard + colWidths.allowanceAmt, height: headerRow1Height, align: 'center', fontSize: 10 });
  x += colWidths.standard + colWidths.allowanceAmt;

  // 其他费用金额
  drawRect(doc, x, currentY, colWidths.accommodation + colWidths.localTransport + colWidths.otherExpenses, headerRow1Height);
  drawText(doc, '其他费用金额', x, currentY, { width: colWidths.accommodation + colWidths.localTransport + colWidths.otherExpenses, height: headerRow1Height, align: 'center', fontSize: 10 });
  x += colWidths.accommodation + colWidths.localTransport + colWidths.otherExpenses;

  // 小计（跨两行）
  const subtotalX = x;
  drawRect(doc, x, currentY, colWidths.subtotal, headerRow1Height + headerRow2Height);
  drawText(doc, '小计', x, currentY + (headerRow1Height + headerRow2Height - 9) / 2, { width: colWidths.subtotal, align: 'center', fontSize: 9 });
  x += colWidths.subtotal;

  // 单据张数（竖排，跨两行）
  drawRect(doc, x, currentY, colWidths.receipts, headerRow1Height + headerRow2Height);
  doc.save();
  doc.translate(x + colWidths.receipts / 2 + 2, currentY + (headerRow1Height + headerRow2Height) / 2);
  doc.rotate(-90);
  doc.fontSize(8);
  const receiptsText = '单据张数';
  doc.text(receiptsText, -doc.widthOfString(receiptsText) / 2, -4, { lineBreak: false });
  doc.restore();

  currentY += headerRow1Height;

  // ===== 第三行：子表头 =====
  x = startX;

  // 出发 - 日期
  drawRect(doc, x, currentY, colWidths.depDate, headerRow2Height);
  drawText(doc, '日期', x, currentY, { width: colWidths.depDate, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.depDate;

  // 出发 - 地点
  drawRect(doc, x, currentY, colWidths.depPlace, headerRow2Height);
  drawText(doc, '地点', x, currentY, { width: colWidths.depPlace, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.depPlace;

  // 到达 - 日期
  drawRect(doc, x, currentY, colWidths.arrDate, headerRow2Height);
  drawText(doc, '日期', x, currentY, { width: colWidths.arrDate, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.arrDate;

  // 到达 - 地点
  drawRect(doc, x, currentY, colWidths.arrPlace, headerRow2Height);
  drawText(doc, '地点', x, currentY, { width: colWidths.arrPlace, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.arrPlace;

  // 交通 - 工具
  drawRect(doc, x, currentY, colWidths.tool, headerRow2Height);
  drawText(doc, '工具', x, currentY, { width: colWidths.tool, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.tool;

  // 交通 - 金额
  drawRect(doc, x, currentY, colWidths.transportAmt, headerRow2Height);
  drawText(doc, '金额', x, currentY, { width: colWidths.transportAmt, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.transportAmt;

  // 天数列（已经在上面绘制了）
  x += colWidths.days;

  // 出差补贴 - 标准
  drawRect(doc, x, currentY, colWidths.standard, headerRow2Height);
  drawText(doc, '标准', x, currentY, { width: colWidths.standard, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.standard;

  // 出差补贴 - 金额
  drawRect(doc, x, currentY, colWidths.allowanceAmt, headerRow2Height);
  drawText(doc, '金额', x, currentY, { width: colWidths.allowanceAmt, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.allowanceAmt;

  // 其他费用 - 住宿
  drawRect(doc, x, currentY, colWidths.accommodation, headerRow2Height);
  drawText(doc, '住宿', x, currentY, { width: colWidths.accommodation, height: headerRow2Height, align: 'center', fontSize: 9 });
  x += colWidths.accommodation;

  // 其他费用 - 市内交通
  drawRect(doc, x, currentY, colWidths.localTransport, headerRow2Height);
  drawText(doc, '市内\n交通', x, currentY + 5, { width: colWidths.localTransport, align: 'center', fontSize: 8 });
  x += colWidths.localTransport;

  // 其他费用 - 其他费用
  drawRect(doc, x, currentY, colWidths.otherExpenses, headerRow2Height);
  drawText(doc, '其他\n费用', x, currentY + 5, { width: colWidths.otherExpenses, align: 'center', fontSize: 8 });
  x += colWidths.otherExpenses;

  // 小计列（已经在上面绘制了）
  // 单据张数列（已经在上面绘制了）

  currentY += headerRow2Height;

  // ===== 数据行 =====
  data.details.forEach(detail => {
    x = startX;

    drawRect(doc, x, currentY, colWidths.depDate, dataRowHeight);
    drawText(doc, detail.departureDate, x, currentY, { width: colWidths.depDate, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.depDate;

    drawRect(doc, x, currentY, colWidths.depPlace, dataRowHeight);
    drawText(doc, detail.departurePlace, x, currentY, { width: colWidths.depPlace, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.depPlace;

    drawRect(doc, x, currentY, colWidths.arrDate, dataRowHeight);
    drawText(doc, detail.arrivalDate, x, currentY, { width: colWidths.arrDate, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.arrDate;

    drawRect(doc, x, currentY, colWidths.arrPlace, dataRowHeight);
    drawText(doc, detail.arrivalPlace, x, currentY, { width: colWidths.arrPlace, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.arrPlace;

    drawRect(doc, x, currentY, colWidths.tool, dataRowHeight);
    drawText(doc, detail.transport, x, currentY, { width: colWidths.tool, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.tool;

    drawRect(doc, x, currentY, colWidths.transportAmt, dataRowHeight);
    drawText(doc, detail.transportAmount, x, currentY, { width: colWidths.transportAmt, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.transportAmt;

    drawRect(doc, x, currentY, colWidths.days, dataRowHeight);
    drawText(doc, detail.days, x, currentY, { width: colWidths.days, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.days;

    drawRect(doc, x, currentY, colWidths.standard, dataRowHeight);
    drawText(doc, detail.allowanceStandard, x, currentY, { width: colWidths.standard, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.standard;

    drawRect(doc, x, currentY, colWidths.allowanceAmt, dataRowHeight);
    drawText(doc, detail.allowanceAmount, x, currentY, { width: colWidths.allowanceAmt, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.allowanceAmt;

    drawRect(doc, x, currentY, colWidths.accommodation, dataRowHeight);
    drawText(doc, detail.accommodation, x, currentY, { width: colWidths.accommodation, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.accommodation;

    drawRect(doc, x, currentY, colWidths.localTransport, dataRowHeight);
    drawText(doc, detail.localTransport, x, currentY, { width: colWidths.localTransport, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.localTransport;

    drawRect(doc, x, currentY, colWidths.otherExpenses, dataRowHeight);
    drawText(doc, detail.otherExpenses, x, currentY, { width: colWidths.otherExpenses, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.otherExpenses;

    drawRect(doc, x, currentY, colWidths.subtotal, dataRowHeight);
    drawText(doc, detail.subtotal, x, currentY, { width: colWidths.subtotal, height: dataRowHeight, align: 'center', fontSize: 8 });
    x += colWidths.subtotal;

    drawRect(doc, x, currentY, colWidths.receipts, dataRowHeight);
    drawText(doc, detail.receipts, x, currentY, { width: colWidths.receipts, height: dataRowHeight, align: 'center', fontSize: 8 });

    currentY += dataRowHeight;
  });

  // 空行（填充）
  const emptyRows = Math.max(0, 3 - data.details.length);
  for (let i = 0; i < emptyRows; i++) {
    x = startX;
    for (const key in colWidths) {
      drawRect(doc, x, currentY, colWidths[key], dataRowHeight);
      x += colWidths[key];
    }
    currentY += dataRowHeight;
  }

  // ===== 合计行 =====
  x = startX;

  // 合计（跨4列）
  const totalLabelWidth = colWidths.depDate + colWidths.depPlace + colWidths.arrDate + colWidths.arrPlace;
  drawRect(doc, x, currentY, totalLabelWidth, dataRowHeight);
  drawText(doc, '合    计', x, currentY, { width: totalLabelWidth, height: dataRowHeight, align: 'center', fontSize: 10 });
  x += totalLabelWidth;

  drawRect(doc, x, currentY, colWidths.tool, dataRowHeight);
  drawText(doc, '', x, currentY, { width: colWidths.tool, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.tool;

  drawRect(doc, x, currentY, colWidths.transportAmt, dataRowHeight);
  drawText(doc, data.summary.totalTransport, x, currentY, { width: colWidths.transportAmt, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.transportAmt;

  drawRect(doc, x, currentY, colWidths.days, dataRowHeight);
  drawText(doc, data.summary.totalDays, x, currentY, { width: colWidths.days, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.days;

  drawRect(doc, x, currentY, colWidths.standard, dataRowHeight);
  drawText(doc, '--', x, currentY, { width: colWidths.standard, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.standard;

  drawRect(doc, x, currentY, colWidths.allowanceAmt, dataRowHeight);
  drawText(doc, data.summary.totalAllowance, x, currentY, { width: colWidths.allowanceAmt, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.allowanceAmt;

  drawRect(doc, x, currentY, colWidths.accommodation, dataRowHeight);
  drawText(doc, data.summary.totalAccommodation, x, currentY, { width: colWidths.accommodation, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.accommodation;

  drawRect(doc, x, currentY, colWidths.localTransport, dataRowHeight);
  drawText(doc, data.summary.totalLocalTransport, x, currentY, { width: colWidths.localTransport, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.localTransport;

  drawRect(doc, x, currentY, colWidths.otherExpenses, dataRowHeight);
  drawText(doc, data.summary.totalOther, x, currentY, { width: colWidths.otherExpenses, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.otherExpenses;

  drawRect(doc, x, currentY, colWidths.subtotal, dataRowHeight);
  drawText(doc, data.summary.grandTotal, x, currentY, { width: colWidths.subtotal, height: dataRowHeight, align: 'center', fontSize: 8 });
  x += colWidths.subtotal;

  drawRect(doc, x, currentY, colWidths.receipts, dataRowHeight);
  drawText(doc, '', x, currentY, { width: colWidths.receipts, height: dataRowHeight, align: 'center', fontSize: 8 });

  currentY += dataRowHeight;

  // ===== 金额合计行 =====
  x = startX;

  const amountLabelWidth = 80;
  const amountValueWidth = 250;
  const advanceWidth = 80;
  const advanceValueWidth = 80;
  const refundWidth = tableWidth - amountLabelWidth - amountValueWidth - advanceWidth - advanceValueWidth;

  drawRect(doc, x, currentY, amountLabelWidth, summaryRowHeight);
  drawText(doc, '金额合计\n（大写）', x, currentY + 5, { width: amountLabelWidth, align: 'center', fontSize: 9 });
  x += amountLabelWidth;

  drawRect(doc, x, currentY, amountValueWidth, summaryRowHeight);
  drawText(doc, `${data.summary.amountInWords}  ¥：${data.summary.amountInNumbers}`, x, currentY, { width: amountValueWidth, height: summaryRowHeight, align: 'left', fontSize: 9 });
  x += amountValueWidth;

  drawRect(doc, x, currentY, advanceWidth, summaryRowHeight);
  drawText(doc, '预借金额', x, currentY, { width: advanceWidth, height: summaryRowHeight, align: 'center', fontSize: 9 });
  x += advanceWidth;

  drawRect(doc, x, currentY, advanceValueWidth, summaryRowHeight);
  drawText(doc, '_________', x, currentY, { width: advanceValueWidth, height: summaryRowHeight, align: 'center', fontSize: 9 });
  x += advanceValueWidth;

  drawRect(doc, x, currentY, refundWidth, summaryRowHeight);
  drawText(doc, '退/补金额_________', x, currentY, { width: refundWidth, height: summaryRowHeight, align: 'left', fontSize: 9 });

  currentY += summaryRowHeight;

  // ===== 审批栏 =====
  const approvers = ['领导批审', '部门负责人', '财务负责人', '会计', '出纳', '领款人'];
  const approverWidth = tableWidth / approvers.length;

  x = startX;
  approvers.forEach(approver => {
    drawRect(doc, x, currentY, approverWidth, approvalRowHeight);
    drawText(doc, approver, x, currentY, { width: approverWidth, height: approvalRowHeight, align: 'center', valign: 'top', fontSize: 9 });
    x += approverWidth;
  });
}

/**
 * 生成报销单 PDF
 */
async function generateReimbursementPDF(data, outputPath) {
  // 创建 PDF 文档（A5 横向）
  const doc = new PDFDocument({
    size: [595.28, 420],  // A5 横向
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
