const jsPDF = require('jspdf').jsPDF;
const { applyPlugin } = require('jspdf-autotable');
const fs = require('fs');
const QRCode = require('qrcode');

// 手动应用 autoTable 插件
applyPlugin(jsPDF);

// 示例数据
const data = {
  date: '2025年07月28日',
  department: '经营计划室',
  pageInfo: '第 1 页/ 共 1 页',
  totalAmount: '99.00元 / 99.00元',
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
      allowanceStandard: '50.00',
      allowance: '0.00',
      accommodation: '0.00',
      localTransport: '0.00',
      otherFees: '0.00',
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
      allowanceStandard: '50.00',
      allowance: '0.00',
      accommodation: '0.00',
      localTransport: '0.00',
      otherFees: '0.00',
      subtotal: '55.00'
    }
  ],
  totalTransportFee: '99.00',
  totalDays: '0.0',
  totalAllowance: '0.00',
  totalAccommodation: '0.00',
  totalLocalTransport: '0.00',
  totalOtherFees: '0.00',
  grandTotal: '99.00',
  amountInWords: '玖拾玖元整',
  companyName: '淮安新业电力建设有限公司'
};

async function generateReceipt(data, outputPath) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // 注册中文字体
  let fontName = 'helvetica';
  const fontPath = './fonts/SourceHanSansCN-Normal.ttf';
  if (fs.existsSync(fontPath)) {
    try {
      const fontData = fs.readFileSync(fontPath).toString('base64');
      doc.addFileToVFS('SourceHanSansCN-Normal.ttf', fontData);
      doc.addFont('SourceHanSansCN-Normal.ttf', 'SourceHanSans', 'normal');
      fontName = 'SourceHanSans';
    } catch (e) {
      console.log('使用默认字体');
    }
  }
  doc.setFont(fontName);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const leftMargin = 35; // 左侧留出更多空间给二维码和装订线

  // 生成二维码
  const qrData = data.qrData || `报销单-${data.date || ''}-${data.traveler || ''}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 1 });

  // 在左上角添加二维码 - 调整位置使其与标题高度一致
  doc.addImage(qrCodeDataUrl, 'PNG', 5, 8, 25, 25);

  // 左侧竖排文字（装订线）
  doc.setFontSize(9);
  const bindingVerticalText = data.companyName;
  // 绘制竖排文字
  for (let i = 0; i < bindingVerticalText.length; i++) {
    doc.text(bindingVerticalText[i], 3, 50 + i * 5);
  }
  // 装订线
  doc.setLineWidth(0.3);
  doc.setLineDash([2, 2]);
  doc.line(3.5, 40, 3.5, pageHeight - 40);
  doc.setLineDash([]);

  // 标题
  doc.setFontSize(20);
  doc.setFont(fontName);
  const title = '差 旅 报 销 单';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, margin + 5);

  // 日期（标题下方）
  doc.setFontSize(14);
  doc.text(data.date, (pageWidth - doc.getTextWidth(data.date)) / 2, margin + 12);

  // 右上角信息
  doc.setFontSize(10);
  doc.setFont(fontName);
  const rightInfo = [
    `部门：${data.department}`,
    `页码：${data.pageInfo}`,
    `金额：${data.totalAmount}`
  ];
  let rightY = margin + 5;
  rightInfo.forEach(text => {
    doc.text(text, pageWidth - margin - doc.getTextWidth(text), rightY);
    rightY += 5;
  });

  // 出差人信息行
  const infoY = margin + 20;
  doc.setFontSize(10);
  doc.text(`出差人`, leftMargin, infoY);
  doc.text(`${data.traveler}`, leftMargin + 15, infoY);
  doc.text(`出差事由`, leftMargin + 60, infoY);
  doc.text(`${data.reason}`, leftMargin + 80, infoY);
  doc.text(`项目名称`, leftMargin + 120, infoY);
  doc.text(`${data.projectName}`, leftMargin + 145, infoY);

  // 主表格数据
  const tableStartY = infoY + 7;

  // 使用 autoTable 生成复杂表格
  doc.autoTable({
    startY: tableStartY,
    head: [
      [
        { content: '出发', colSpan: 2, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: '到达', colSpan: 2, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: '交通', colSpan: 2, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: '天\n数', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: '出差补贴', colSpan: 2, rowSpan: 1, styles: { halign: 'center', valign: 'middle' } },
        { content: '其他费用金额', colSpan: 4, rowSpan: 1, styles: { halign: 'center', valign: 'middle' } },
        { content: '小计', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: '单据\n张数', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ],
      [
        { content: '标准', styles: { halign: 'center' } },
        { content: '金额', styles: { halign: 'center' } },
        { content: '住宿', styles: { halign: 'center' } },
        { content: '市内\n交通', styles: { halign: 'center' } },
        { content: '其他\n费用', styles: { halign: 'center' } },
        { content: '', styles: { halign: 'center' } }  // 占位
      ]
    ],
    body: [
      ...data.trips.map(trip => [
        trip.departDate,
        trip.departPlace,
        trip.arriveDate,
        trip.arrivePlace,
        trip.transport,
        trip.transportFee,
        trip.days,
        trip.allowanceStandard,
        trip.allowance,
        trip.accommodation,
        trip.localTransport,
        trip.otherFees,
        '',
        trip.subtotal,
        ''
      ]),
      // 空行
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // 合计行
      [
        { content: '合  计', colSpan: 5, styles: { halign: 'center' } },
        data.totalTransportFee,
        data.totalDays,
        '--',
        data.totalAllowance,
        data.totalAccommodation,
        data.totalLocalTransport,
        data.totalOtherFees,
        '',
        data.grandTotal,
        ''
      ],
      // 金额合计行
      [
        { content: '金额合计（大写）', colSpan: 3, styles: { halign: 'left' } },
        { content: `${data.amountInWords}  ¥：${data.grandTotal}`, colSpan: 6, styles: { halign: 'left' } },
        { content: '预借金额 _________', colSpan: 3, styles: { halign: 'left' } },
        { content: '退/补金额_________', colSpan: 3, styles: { halign: 'left' } }
      ]
    ],
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 15 },
      2: { cellWidth: 18 },
      3: { cellWidth: 15 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 10 },
      7: { cellWidth: 12 },
      8: { cellWidth: 12 },
      9: { cellWidth: 12 },
      10: { cellWidth: 12 },
      11: { cellWidth: 12 },
      12: { cellWidth: 12 },
      13: { cellWidth: 12 },
      14: { cellWidth: 10 }
    },
    margin: { left: leftMargin, right: margin }
  });

  // 签名行
  const finalY = doc.lastAutoTable.finalY + 2;
  const signY = finalY + 15;
  doc.setFontSize(9);
  const signatures = ['领导批审', '部门负责人', '财务负责人', '会计', '出纳', '领款人'];
  const signSpacing = (pageWidth - leftMargin - margin) / signatures.length;
  signatures.forEach((sign, index) => {
    doc.text(sign, leftMargin + index * signSpacing, signY);
  });

  // 底部装订线
  doc.setFontSize(8);
  const bindingText = `----- -------${data.companyName} ---- 装订线----------`;
  doc.text(bindingText, leftMargin, pageHeight - 10);

  // 保存
  doc.save(outputPath);
  console.log(`报销单已生成: ${outputPath}`);
}

// 测试
generateReceipt(data, 'receipt-jspdf.pdf');
