const playwright = require('playwright-core');
const fs = require('fs');
const path = require('path');

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

function generateHTML(data) {
  // 生成表格行
  const tripRows = data.trips.map(trip => `
    <tr>
      <td>${trip.departDate}</td>
      <td>${trip.departPlace}</td>
      <td>${trip.arriveDate}</td>
      <td>${trip.arrivePlace}</td>
      <td>${trip.transport}</td>
      <td>${trip.transportFee}</td>
      <td>${trip.days}</td>
      <td>${trip.allowanceStandard}</td>
      <td>${trip.allowance}</td>
      <td>${trip.accommodation}</td>
      <td>${trip.localTransport}</td>
      <td>${trip.otherFees}</td>
      <td></td>
      <td>${trip.subtotal}</td>
      <td></td>
    </tr>
  `).join('');

  // 空行
  const emptyRows = Array(2).fill(`
    <tr>
      ${Array(15).fill('<td></td>').join('')}
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>差旅报销单</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4 landscape;
      margin: 15mm;
    }

    body {
      font-family: "SimSun", "宋体", serif;
      font-size: 10pt;
      line-height: 1.2;
      padding: 20px;
      position: relative;
    }

    /* 二维码 */
    .qrcode {
      position: absolute;
      left: 20px;
      top: 20px;
      width: 100px;
      height: 100px;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    /* 装订线 */
    .binding-line {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      writing-mode: vertical-rl;
      font-size: 10pt;
      padding: 10px 5px;
      border-right: 2px dashed #000;
      height: 80%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 主容器 */
    .container {
      margin-left: 120px;
      position: relative;
    }

    /* 标题区域 */
    .header {
      text-align: center;
      margin-bottom: 15px;
      position: relative;
    }

    .title {
      font-size: 22pt;
      font-weight: bold;
      letter-spacing: 8px;
      margin-bottom: 5px;
    }

    .date {
      font-size: 14pt;
      margin-bottom: 10px;
    }

    /* 右上角信息 */
    .top-right-info {
      position: absolute;
      right: 0;
      top: 0;
      text-align: right;
      font-size: 10pt;
      line-height: 1.5;
    }

    /* 出差人信息行 */
    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      font-size: 10pt;
      gap: 10px;
    }

    .info-row label {
      font-weight: normal;
    }

    .info-row .value {
      flex: 1;
    }

    /* 表格样式 */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }

    table td, table th {
      border: 1px solid #000;
      padding: 4px 6px;
      text-align: center;
      font-size: 9pt;
      vertical-align: middle;
      white-space: nowrap;
    }

    table th {
      font-weight: normal;
      background-color: #fff;
    }

    /* 签名区域 */
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      font-size: 10pt;
    }

    .signature-item {
      text-align: center;
      min-width: 80px;
    }

    /* 底部装订线文字 */
    .bottom-binding {
      text-align: center;
      margin-top: 30px;
      font-size: 9pt;
    }

    /* 打印样式 */
    @media print {
      body {
        padding: 10mm;
      }
      .qrcode, .binding-line {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- 二维码 -->
  <div class="qrcode">
    [二维码]
  </div>

  <!-- 装订线 -->
  <div class="binding-line">
    ${data.companyName}
  </div>

  <div class="container">
    <!-- 标题区域 -->
    <div class="header">
      <div class="top-right-info">
        部门：${data.department}<br>
        页码：${data.pageInfo}<br>
        金额：${data.totalAmount}
      </div>
      <div class="title">差 旅 报 销 单</div>
      <div class="date">${data.date}</div>
    </div>

    <!-- 出差人信息 -->
    <div class="info-row">
      <label>出差人</label>
      <span class="value">${data.traveler}</span>
      <label>出差事由</label>
      <span class="value">${data.reason}</span>
      <label>项目名称</label>
      <span class="value">${data.projectName}</span>
    </div>

    <!-- 主表格 -->
    <table>
      <thead>
        <tr>
          <th colspan="2" rowspan="2">出发</th>
          <th colspan="2" rowspan="2">到达</th>
          <th colspan="2" rowspan="2">交通</th>
          <th rowspan="2">天<br>数</th>
          <th colspan="2" rowspan="1">出差补贴</th>
          <th colspan="4" rowspan="1">其他费用金额</th>
          <th rowspan="2">小计</th>
          <th rowspan="2">单据<br>张数</th>
        </tr>
        <tr>
          <th>标准</th>
          <th>金额</th>
          <th>住宿</th>
          <th>市内<br>交通</th>
          <th>其他<br>费用</th>
          <th></th>
        </tr>
        <tr>
          <th>日期</th>
          <th>地点</th>
          <th>日期</th>
          <th>地点</th>
          <th>工具</th>
          <th>金额</th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${tripRows}
        ${emptyRows}
        <tr>
          <td colspan="5">合 计</td>
          <td>${data.totalTransportFee}</td>
          <td>${data.totalDays}</td>
          <td>--</td>
          <td>${data.totalAllowance}</td>
          <td>${data.totalAccommodation}</td>
          <td>${data.totalLocalTransport}</td>
          <td>${data.totalOtherFees}</td>
          <td></td>
          <td>${data.grandTotal}</td>
          <td></td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: left; padding-left: 10px;">
            金额合计（大写）
          </td>
          <td colspan="6" style="text-align: left; padding-left: 10px;">
            ${data.amountInWords} ¥：${data.grandTotal}
          </td>
          <td colspan="3" style="text-align: left; padding-left: 10px;">
            预借金额 _________
          </td>
          <td colspan="3" style="text-align: left; padding-left: 10px;">
            退/补金额_________
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 签名区域 -->
    <div class="signature-section">
      <div class="signature-item">领导批审</div>
      <div class="signature-item">部门负责人</div>
      <div class="signature-item">财务负责人</div>
      <div class="signature-item">会计</div>
      <div class="signature-item">出纳</div>
      <div class="signature-item">领款人</div>
    </div>

    <!-- 底部装订线 -->
    <div class="bottom-binding">
      ----- -------${data.companyName} ---- 装订线----------
    </div>
  </div>
</body>
</html>`;

  return html;
}

async function generatePDF(data, outputPath) {
  console.log('正在生成 HTML...');
  const html = generateHTML(data);

  // 保存 HTML 文件供预览
  const htmlPath = outputPath.replace('.pdf', '.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`HTML 已保存: ${htmlPath}`);
  console.log('你可以在浏览器中打开此文件预览效果\n');

  console.log('正在启动浏览器...');
  let browser;
  try {
    browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  } catch (error) {
    console.error('启动 Chromium 失败:', error.message);
    console.log('\n请尝试手动安装 Chromium:');
    console.log('  npx playwright install chromium');
    console.log('\n或者使用浏览器打开 HTML 文件手动打印为 PDF。');
    return;
  }

  try {
    const page = await browser.newPage();

    // 使用文件路径而不是 setContent
    const fileUrl = 'file://' + path.resolve(htmlPath);
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
      }
    });

    console.log(`PDF 已生成: ${outputPath}`);
  } catch (error) {
    console.error('生成 PDF 失败:', error.message);
    console.log('\n建议：在浏览器中打开 HTML 文件，使用 Ctrl+P 手动打印为 PDF');
  } finally {
    await browser.close();
  }
}

// 测试
generatePDF(data, 'receipt-html-generated.pdf').catch(console.error);
