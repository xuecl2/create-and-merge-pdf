# PDF 报销单生成与合并工具

基于 Node.js 的差旅报销单 PDF 生成和合并工具，使用 PDFKit 直接绘制报销单。

## 功能特性

### 1. 报销单 PDF 生成

- ✅ 使用 PDFKit 直接绘制报销单
- ✅ 支持动态生成二维码
- ✅ 完整的中文字体支持（Noto Sans CJK）
- ✅ 精确的表格布局和边框绘制
- ✅ 左侧装订线与竖排文字
- ✅ 动态明细行数据填充

### 2. PDF 合并功能

- ✅ 使用 pdf-lib 合并多个 PDF
- ✅ 支持合并报销单和发票
- ✅ 保持原始 PDF 质量

## 项目结构

```
.
├── fonts/                      # 中文字体文件
│   ├── NotoSansSC.otf         # Noto Sans 简体中文字体
│   └── SourceHanSansSC-Regular.otf  # 思源黑体
├── mock-data.js                # 模拟数据
├── generate-receipt.js         # 报销单生成主程序
├── merge-pdfs.js               # PDF 合并工具
├── compare-pdf.js              # PDF 对比工具（转图片）
├── template.png                # 报销单模板图片（参考）
├── 费用报销单_2025-11-07_08-31-27.pdf  # 原始报销单样例
└── package.json                # 项目配置
```

## 安装依赖

```bash
npm install
```

### 主要依赖

- `pdfkit` - PDF 生成库
- `qrcode` - 二维码生成
- `pdf-lib` - PDF 合并库
- `pdf-to-png-converter` - PDF 转图片（用于测试对比）
- `fontkit` - 字体处理

## 使用方法

### 1. 生成报销单 PDF

修改 `mock-data.js` 中的数据，然后运行：

```bash
node generate-receipt.js
```

生成的 PDF 保存为 `generated-receipt.pdf`

### 2. 合并报销单和发票

将发票 PDF 文件命名为 `invoice.pdf` 放在项目根目录，然后运行：

```bash
node merge-pdfs.js
```

合并后的 PDF 保存为 `final-output.pdf`

### 3. 对比效果（可选）

将生成的 PDF 和原始 PDF 转换为图片进行对比：

```bash
node compare-pdf.js
```

生成的图片：
- `original-page1.png` - 原始报销单
- `generated-page1.png` - 生成的报销单

## 数据格式

`mock-data.js` 数据结构示例：

```javascript
module.exports = {
  // 基本信息
  code: 'CLBX202507280001',     // 报销单编号（用于二维码）
  date: '2025年07月28日',        // 日期
  department: '经营计划室',      // 部门
  pageNumber: '第 1 页/ 共 1 页',  // 页码
  totalAmount: '99.00',         // 总金额

  // 报销人信息
  employee: '谢松',              // 出差人
  reason: '999',                // 出差事由
  projectName: '',              // 项目名称

  // 明细数据（数组）
  details: [
    {
      departureDate: '2025-07-29 00',
      departurePlace: '444',
      arrivalDate: '2025-07-29',
      arrivalPlace: '',
      transport: '高铁',
      transportAmount: '44.00',
      days: '0.0',
      allowanceStandard: '50.00',
      allowanceAmount: '0.00',
      accommodation: '0.00',
      localTransport: '0.00',
      otherExpenses: '0.00',
      subtotal: '44.00',
      receipts: ''
    }
    // ... 更多明细行
  ],

  // 汇总信息
  summary: {
    totalTransport: '99.00',
    totalDays: '0.0',
    totalAllowance: '0.00',
    totalAccommodation: '0.00',
    totalLocalTransport: '0.00',
    totalOther: '0.00',
    grandTotal: '99.00',
    amountInWords: '玖拾玖元整',
    amountInNumbers: '99.00',
    advanceAmount: '',
    refundAmount: ''
  }
};
```

## 技术实现

### 1. 为什么选择 PDFKit 直接绘制？

相比 PDF 模板填充或 HTML 转 PDF，直接绘制有以下优势：

- **动态行数处理**：明细行数量可变，纯代码绘制更灵活
- **精确控制**：可以精确控制每个元素的位置和样式
- **无需模板文件**：不依赖外部模板，代码即文档
- **易于维护**：修改布局只需调整代码参数
- **性能优秀**：纯 JS 生成，无需启动浏览器

### 2. 核心功能实现

#### 二维码生成

```javascript
const QRCode = require('qrcode');

const qrBuffer = await QRCode.toBuffer(data.code, {
  width: 100,
  margin: 1
});

doc.image(qrBuffer, x, y, { width: 80, height: 80 });
```

#### 装订线（竖排文字）

```javascript
doc.save();
doc.rotate(-90, { origin: [x, y] });
doc.text('---- 装订线 ----', x, y);
doc.restore();
```

#### 表格单元格绘制

```javascript
function drawCell(doc, x, y, width, height, text, options = {}) {
  // 绘制边框
  doc.rect(x, y, width, height).stroke();

  // 绘制文字（支持对齐方式）
  doc.text(text, x, y, {
    width: width,
    align: options.align || 'center'
  });
}
```

#### 中文字体支持

```javascript
const FONT_PATH = path.join(__dirname, 'fonts/NotoSansSC.otf');

doc.registerFont('cn', FONT_PATH);
doc.font('cn');
```

### 3. PDF 合并原理

使用 `pdf-lib` 库的页面复制功能：

```javascript
const { PDFDocument } = require('pdf-lib');

const mergedPdf = await PDFDocument.create();
const pdf1 = await PDFDocument.load(pdf1Bytes);
const pdf2 = await PDFDocument.load(pdf2Bytes);

// 复制页面
const pages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
const pages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());

// 添加页面
pages1.forEach(page => mergedPdf.addPage(page));
pages2.forEach(page => mergedPdf.addPage(page));
```

## 当前状态与已知问题

### ✅ 已实现

- PDF 生成基本框架
- 二维码生成
- 装订线绘制
- 中文字体支持
- 表格结构绘制
- 明细数据动态填充
- PDF 合并功能

### ⚠️ 待优化

由于原始报销单的表格结构非常复杂（多层合并单元格、不规则列宽），当前版本的布局与原始 PDF 有一些差异：

1. **列宽精度**：表格右侧部分列可能被截断，需要更精确的宽度计算
2. **标题方框**：标题上方的方框样式需要调整
3. **字体大小**：部分单元格的字体大小需要微调
4. **边距对齐**：整体布局的边距需要与原始 PDF 更精确匹配

### 🔧 优化建议

如果需要完全匹配原始 PDF 的像素级精度，可以考虑：

1. **使用 PDF 测量工具**：使用 Adobe Acrobat 或 PDF 编辑器测量原始 PDF 的精确尺寸
2. **调整列宽数组**：在代码中微调 `row3Widths` 等数组的值
3. **增加辅助线**：开发时可以添加辅助线帮助对齐
4. **分步调试**：先调整表头，再调整明细行，最后调整汇总行

## 开发者笔记

### 表格布局计算技巧

1. **从外到内**：先确定页面可用宽度，再分配给各列
2. **使用数组管理**：每行的列宽用数组管理，便于统一调整
3. **验证总宽度**：每行绘制前验证列宽总和是否等于表格总宽度
4. **边框对齐**：注意 `lineWidth` 会影响边框位置

### 中文字体选择

- **Noto Sans CJK**：Google 开源字体，字符覆盖全面
- **思源黑体**：Adobe 开源字体，与 Noto Sans CJK 同源
- **文泉驿正黑**：Linux 系统常见字体，但某些字符可能缺失

## 常见问题

**Q: 为什么不用 PDF 模板？**
A: 报销单的明细行数是动态的，PDF 表单模板很难处理这种情况。直接绘制更灵活。

**Q: 能否支持多页报销单？**
A: 可以。在代码中检测明细行数，超过一定数量时调用 `doc.addPage()` 添加新页面。

**Q: 生成的 PDF 能否编辑？**
A: PDFKit 生成的是静态内容，不可编辑。如需可编辑 PDF，需要使用 PDF 表单功能。

**Q: 如何调整表格样式？**
A: 修改 `drawCell` 函数中的 `lineWidth`、`fontSize` 等参数。

## 许可证

MIT

## 参考资料

- [PDFKit 文档](https://pdfkit.org/)
- [pdf-lib 文档](https://pdf-lib.js.org/)
- [qrcode 文档](https://www.npmjs.com/package/qrcode)
