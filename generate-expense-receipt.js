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
const MARGIN_LEFT = 35;
const MARGIN_TOP = 35;
const BINDING_LINE_WIDTH = 20;

/**
 * 生成二维码图片 Buffer
 */
async function generateQRCode(text) {
  return await QRCode.toBuffer(text, {
    width: 60,
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

  doc.moveTo(BINDING_LINE_WIDTH, 70);
  doc.lineTo(BINDING_LINE_WIDTH, PAGE_HEIGHT - 70);
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

  // 绘制二维码
  doc.image(qrBuffer, startX, startY, { width: 50, height: 50 });

  // 绘制标题
  doc.fontSize(18).font(FONT_PATH);
  const title = '费 用 报 销 单';
  const titleWidth = doc.widthOfString(title);
  const titleX = (PAGE_WIDTH + BINDING_LINE_WIDTH) / 2 - titleWidth / 2;
  doc.text(title, titleX, startY + 5);

  // 绘制标题下划线
  const underlineY = startY + 27;
  doc.lineWidth(1);
  doc.moveTo(titleX, underlineY);
  doc.lineTo(titleX + titleWidth, underlineY);
  doc.stroke();

  // 绘制日期
  doc.fontSize(11);
  const dateWidth = doc.widthOfString(data.date);
  const dateX = (PAGE_WIDTH + BINDING_LINE_WIDTH) / 2 - dateWidth / 2;
  doc.text(data.date, dateX, startY + 32);

  // 绘制右上角信息
  doc.fontSize(8);
  const rightX = PAGE_WIDTH - 105;
  doc.text(`部门：${data.department}`, rightX, startY + 5);
  doc.text(`页码：${data.pageNumber}`, rightX, startY + 18);
  doc.text(`金额：${data.totalAmount}元 / ${data.totalAmount}元`, rightX, startY + 31);
}

/**
 * 绘制主表格
 */
function drawTable(doc, data) {
  const startX = MARGIN_LEFT + BINDING_LINE_WIDTH;
  const startY = MARGIN_TOP + 60;
  const tableWidth = PAGE_WIDTH - MARGIN_LEFT * 2 - BINDING_LINE_WIDTH;

  // 行高
  const infoRowHeight = 22;
  const headerRowHeight = 25;
  const dataRowHeight = 25;
  const totalRowHeight = 30;
  const approvalRow1Height = 30;
  const approvalRow2Height = 35;

  let currentY = startY;
  let x = startX;

  // ===== 第一行：部门和项目信息 =====
  const col1Width = 55;  // "部门"
  const col2Width = 100; // "总经办"
  const col3Width = 70; // "项目名称"
  const col4Width = tableWidth - col1Width - col2Width - col3Width; // "123"

  drawRect(doc, x, currentY, col1Width, infoRowHeight);
  drawText(doc, '部门', x, currentY, { width: col1Width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += col1Width;

  drawRect(doc, x, currentY, col2Width, infoRowHeight);
  drawText(doc, data.department, x, currentY, { width: col2Width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += col2Width;

  drawRect(doc, x, currentY, col3Width, infoRowHeight);
  drawText(doc, '项目名称', x, currentY, { width: col3Width, height: infoRowHeight, align: 'center', fontSize: 10 });
  x += col3Width;

  drawRect(doc, x, currentY, col4Width, infoRowHeight);
  drawText(doc, data.projectName, x, currentY, { width: col4Width, height: infoRowHeight, align: 'center', fontSize: 10 });

  currentY += infoRowHeight;

  // ===== 第二行：摘要和金额表头 =====
  x = startX;
  const summaryColWidth = tableWidth - 120; // "摘要"列
  const amountColWidth = 120; // "金额"列

  drawRect(doc, x, currentY, summaryColWidth, headerRowHeight);
  drawText(doc, '摘   要', x, currentY, { width: summaryColWidth, height: headerRowHeight, align: 'center', fontSize: 11 });
  x += summaryColWidth;

  drawRect(doc, x, currentY, amountColWidth, headerRowHeight);
  drawText(doc, '金额', x, currentY, { width: amountColWidth, height: headerRowHeight, align: 'center', fontSize: 11 });

  currentY += headerRowHeight;

  // ===== 数据行 =====
  data.items.forEach(item => {
    x = startX;

    drawRect(doc, x, currentY, summaryColWidth, dataRowHeight);
    drawText(doc, item.description, x, currentY, { width: summaryColWidth, height: dataRowHeight, align: 'left', fontSize: 10 });
    x += summaryColWidth;

    drawRect(doc, x, currentY, amountColWidth, dataRowHeight);
    drawText(doc, item.amount.toFixed(2), x, currentY, { width: amountColWidth, height: dataRowHeight, align: 'center', fontSize: 10 });

    currentY += dataRowHeight;
  });

  // 空行（填充至少3-4行）
  const emptyRows = Math.max(0, 4 - data.items.length);
  for (let i = 0; i < emptyRows; i++) {
    x = startX;
    drawRect(doc, x, currentY, summaryColWidth, dataRowHeight);
    x += summaryColWidth;
    drawRect(doc, x, currentY, amountColWidth, dataRowHeight);
    currentY += dataRowHeight;
  }

  // ===== 合计行 =====
  x = startX;
  const totalLabelWidth = 100;
  const totalTextWidth = summaryColWidth + amountColWidth - totalLabelWidth - amountColWidth;

  drawRect(doc, x, currentY, totalLabelWidth, totalRowHeight);
  drawText(doc, '合计', x, currentY, { width: totalLabelWidth, height: totalRowHeight, align: 'center', fontSize: 11 });
  x += totalLabelWidth;

  drawRect(doc, x, currentY, totalTextWidth, totalRowHeight);
  drawText(doc, `人民币(大写): ${data.amountInWords}`, x, currentY, { width: totalTextWidth, height: totalRowHeight, align: 'left', fontSize: 10 });
  x += totalTextWidth;

  drawRect(doc, x, currentY, amountColWidth, totalRowHeight);
  drawText(doc, `￥：${data.totalAmount.toFixed(2)}`, x, currentY, { width: amountColWidth, height: totalRowHeight, align: 'center', fontSize: 10 });

  currentY += totalRowHeight;

  // ===== 审批栏第一行 =====
  x = startX;
  const approverColWidth = tableWidth / 4;

  const approvers1 = ['部门\n负责人', '财务\n负责人', '分管\n领导', '领导\n审批'];
  approvers1.forEach(approver => {
    drawRect(doc, x, currentY, approverColWidth, approvalRow1Height);
    drawText(doc, approver, x, currentY + 8, { width: approverColWidth, align: 'center', fontSize: 9 });
    x += approverColWidth;
  });

  currentY += approvalRow1Height;

  // ===== 审批栏第二行 =====
  x = startX;
  const approvers2 = ['财务审核', '出纳', '报销人', '领款人'];
  approvers2.forEach(approver => {
    drawRect(doc, x, currentY, approverColWidth, approvalRow2Height);
    drawText(doc, approver, x, currentY, { width: approverColWidth, height: approvalRow2Height, align: 'center', fontSize: 9 });
    x += approverColWidth;
  });
}

/**
 * 生成费用报销单 PDF
 */
async function generateExpenseReceipt(data, outputPath) {
  // 创建 PDF 文档（横向）
  const doc = new PDFDocument({
    size: 'A5',
    layout: 'landscape',
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
    // 测试数据
    const data = {
      code: 'EXP202511100001',
      date: '2025年11月10日',
      department: '总经办',
      pageNumber: '第 1 页/ 共 1 页',
      projectName: '123',
      items: [
        { description: '摘要1', amount: 5.00 },
        { description: '摘要2', amount: 10.00 }
      ],
      totalAmount: 15.00,
      amountInWords: '壹拾伍元整'
    };

    const outputPath = path.join(__dirname, 'expense-receipt.pdf');

    console.log('开始生成费用报销单 PDF...');
    await generateExpenseReceipt(data, outputPath);
    console.log(`费用报销单 PDF 生成成功: ${outputPath}`);
  } catch (error) {
    console.error('生成报销单失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { generateExpenseReceipt };
