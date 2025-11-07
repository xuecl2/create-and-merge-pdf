#!/bin/bash
#
# 修复PDF文件以便pdf-lib能正确处理
# 使用qpdf重新处理PDF文件
#

if [ $# -eq 0 ]; then
    echo "使用方法: $0 <input.pdf> [output.pdf]"
    echo ""
    echo "如果不指定输出文件，将创建 <input>-fixed.pdf"
    exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.pdf}-fixed.pdf}"

if [ ! -f "$INPUT" ]; then
    echo "错误: 文件不存在: $INPUT"
    exit 1
fi

# 检查qpdf是否安装
if ! command -v qpdf &> /dev/null; then
    echo "错误: qpdf 未安装"
    echo "请运行: sudo apt-get install qpdf"
    exit 1
fi

echo "修复 PDF 文件..."
echo "输入: $INPUT"
echo "输出: $OUTPUT"

# 使用qpdf重新处理PDF，标准化内容流
qpdf "$INPUT" "$OUTPUT" --normalize-content=y --stream-data=uncompress

if [ $? -eq 0 ]; then
    echo "✓ 修复成功！"
    echo ""
    echo "修复后的文件: $OUTPUT"
    ls -lh "$INPUT" "$OUTPUT"
else
    echo "✗ 修复失败"
    exit 1
fi
