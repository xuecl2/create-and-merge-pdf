# PDF 生成与合并工具

这是一个 Node.js 项目，用于生成差旅报销单 PDF 并将报销单和发票合并成一个 PDF 文档。

## 功能

1. ✅ 使用 PDF 模板生成差旅报销单（方案1，推荐）
2. ✅ 使用 pdfkit 代码生成报销单（方案2）
3. ✅ 将报销单和若干张发票合并成一个 PDF 文档

## 安装

```bash
npm install
```

## 快速开始

运行完整演示（生成报销单 + 合并发票）：

```bash
node demo.js
```

这将生成：
- `demo-报销单.pdf` - 使用测试数据生成的报销单
- `demo-合并结果.pdf` - 报销单和发票的合并结果（保持原始尺寸）
- `demo-合并结果-A4.pdf` - 报销单和发票的合并结果（统一调整为A4）

## 生成报销单的3种方案

### 方案1：基于PDF模板（推荐⭐⭐⭐⭐⭐）

**优势**：样式精准、所见即所得、易于调整

**快速开始**：
```bash
# 1. 查找模板坐标（首次使用）
node find-coordinates.js

# 2. 基于模板生成PDF
node generate-receipt-template.js output.pdf
```

**详细教程**：查看 [TEMPLATE-GUIDE.md](./TEMPLATE-GUIDE.md)

### 方案2：PDFKit代码生成

使用代码绘制所有元素（表格、文字、边框等）

### 方案3：HTML to PDF

使用HTML+CSS设计，然后转换为PDF

---

## 使用方法

### 1. 生成报销单（方案1：推荐）

使用PDF模板：

```bash
node generate-receipt-template.js [输出文件名]
```

在代码中使用：

```javascript
const { generateReceiptFromTemplate } = require('./generate-receipt-template');

const data = {
  date: '2025年07月28日',
  department: '经营计划室',
  totalAmount: '99.00',
  traveler: '谢松',
  // ... 更多字段
};

await generateReceiptFromTemplate(data, '报销单.pdf');
```

### 1b. 生成报销单（方案2：PDFKit）

使用测试数据生成报销单：

```bash
node generate-receipt.js [输出文件名]
```

在代码中使用：

```javascript
const { generateReceipt } = require('./generate-receipt');

const receiptData = {
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

await generateReceipt(receiptData, '报销单.pdf');
```

### 2. 合并 PDF 文件

```bash
node merge-pdf.js [选项] <输出文件名> <报销单PDF> <发票PDF1> [发票PDF2] ...
```

### 选项

- `--size=<SIZE>`: 指定纸张大小，支持 A4、B4 或 ORIGINAL（默认值：ORIGINAL）
  - `A4`: 统一调整所有页面为 A4 纸张（210mm × 297mm）
  - `B4`: 统一调整所有页面为 B4 纸张（250mm × 353mm）
  - `ORIGINAL`: 保持原始页面尺寸
- `--no-center`: 不居中内容（默认会居中），仅在调整纸张大小时有效

### 示例

**保持原始尺寸合并：**

```bash
node merge-pdf.js merged.pdf 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

**统一调整为 A4 纸张：**

```bash
node merge-pdf.js --size=A4 merged-a4.pdf 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

**统一调整为 B4 纸张：**

```bash
node merge-pdf.js --size=B4 merged-b4.pdf 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

**使用 npm script：**

```bash
npm run merge -- --size=A4 merged.pdf 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

### 参数说明

- `<输出文件名>`: 合并后的 PDF 文件名
- `<报销单PDF>`: 报销单 PDF 文件路径
- `<发票PDF>`: 一个或多个发票 PDF 文件路径

### 功能说明

1. **纸张大小调整**：当指定 A4 或 B4 纸张大小时，工具会：
   - 自动计算缩放比例，保持原始内容的宽高比
   - 将内容居中放置在新纸张上（可通过 `--no-center` 选项关闭）
   - 确保内容完整显示，不会裁剪

2. **原始尺寸保持**：默认情况下保持每个页面的原始尺寸，适合不同大小的文档混合合并

## 项目结构

```
create-and-merge-pdf/
├── template.png                      # 报销单模板图片
├── generate-receipt-template.js      # 方案1：基于模板生成报销单（推荐）
├── find-coordinates.js               # 坐标查找辅助工具
├── generate-receipt.js               # 方案2：使用 pdfkit 生成报销单
├── generate-receipt-html.js          # 方案3：HTML to PDF
├── merge-pdf.js                      # 使用 pdf-lib 合并 PDF
├── check-pdf-size.js                 # PDF 页面尺寸检查工具
├── demo.js                           # 完整演示脚本
├── fonts/                            # 中文字体文件
│   ├── NotoSansSC-Regular.ttf
│   └── SourceHanSansCN-Normal.otf
├── TEMPLATE-GUIDE.md                 # PDF模板方案详细教程
├── package.json                      # 项目配置文件
├── README.md                         # 说明文档
├── 费用报销单_2025-11-07_08-31-27.pdf  # 示例报销单
└── 京东发票.pdf                      # 示例发票
```

## 辅助工具

### 检查 PDF 页面尺寸

如果你想查看 PDF 文件的页面尺寸信息：

```bash
node check-pdf-size.js <PDF1> [PDF2] [PDF3] ...
```

示例：

```bash
node check-pdf-size.js 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

### PDF 兼容性修复工具

如果遇到某些 PDF 文件无法正确合并（第二页为空）的问题，可以使用 qpdf 工具修复：

```bash
# 安装 qpdf（如果尚未安装）
sudo apt-get install qpdf

# 使用修复脚本
./fix-pdf-for-merge.sh input.pdf [output.pdf]
```

**原因说明**：某些 PDF 生成器创建的文件可能使用了 pdf-lib 无法正确解析的内部结构。使用 qpdf 重新处理后，pdf-lib 就能正常读取了。

### PDF 内容检查工具

检查 PDF 文件是否包含实际内容：

```bash
node check-content-stream.js <PDF文件>
```

这个工具可以帮助你诊断 PDF 文件是否真的有内容，还是只是一个空白页面。

输出示例：

```
文件: 费用报销单_2025-11-07_08-31-27.pdf
总页数: 1
  页 1: 680.32 x 396.85 points
         (自定义尺寸)

文件: 京东发票.pdf
总页数: 1
  页 1: 609.44 x 394.01 points
         (自定义尺寸)
```

## 依赖

- [pdfkit](https://github.com/foliojs/pdfkit) - PDF 生成库（用于生成报销单）
- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF 操作库（用于合并 PDF）

## 注意事项

- 输入的 PDF 文件必须存在，否则会跳过该文件
- 合并后的 PDF 会按照输入文件的顺序排列页面
- 合并后的文件会保存在指定的输出路径
- 调整纸张大小时，原始内容会按比例缩放，保持宽高比不变
