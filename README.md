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
node merge-pdf.js <输出文件名> <报销单PDF> <发票PDF1> [发票PDF2] ...
```

### 示例

合并报销单和发票：

```bash
node merge-pdf.js merged.pdf 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

使用 npm script：

```bash
npm run merge -- merged.pdf 费用报销单_2025-11-07_08-31-27.pdf 京东发票.pdf
```

### 参数说明

- `<输出文件名>`: 合并后的 PDF 文件名
- `<报销单PDF>`: 报销单 PDF 文件路径
- `<发票PDF>`: 一个或多个发票 PDF 文件路径

## 项目结构

```
create-and-merge-pdf/
├── merge-pdf.js              # PDF 合并脚本
├── package.json              # 项目配置文件
├── README.md                 # 说明文档
├── 费用报销单_2025-11-07_08-31-27.pdf  # 示例报销单
└── 京东发票.pdf              # 示例发票
```

## 依赖

- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF 创建和操作库

## 注意事项

- 输入的 PDF 文件必须存在，否则会跳过该文件
- 合并后的 PDF 会按照输入文件的顺序排列页面
- 合并后的文件会保存在指定的输出路径
