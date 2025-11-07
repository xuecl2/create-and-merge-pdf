# PDF 生成与合并工具

这是一个 Node.js 项目，用于生成指定样式的 PDF 并将报销单和发票合并成一个 PDF 文档。

## 功能

1. ✅ 生成指定样式的 PDF（已完成）
2. ✅ 将报销单和若干张发票合并成一个 PDF 文档

## 安装

```bash
npm install
```

## 使用方法

### 合并 PDF 文件

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
├── merge-pdf.js              # PDF 合并脚本（支持 A4/B4 纸张调整）
├── check-pdf-size.js         # PDF 页面尺寸检查工具
├── package.json              # 项目配置文件
├── README.md                 # 说明文档
├── 费用报销单_2025-11-07_08-31-27.pdf  # 示例报销单
└── 京东发票.pdf              # 示例发票
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

- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF 创建和操作库

## 注意事项

- 输入的 PDF 文件必须存在，否则会跳过该文件
- 合并后的 PDF 会按照输入文件的顺序排列页面
- 合并后的文件会保存在指定的输出路径
- 调整纸张大小时，原始内容会按比例缩放，保持宽高比不变
