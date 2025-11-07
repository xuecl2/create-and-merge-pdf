const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function testReloadFix() {
  console.log('测试: 通过save/reload来修复PDF...\n');

  // 1. 加载原始PDF
  console.log('1. 加载原始京东发票.pdf');
  const originalBytes = fs.readFileSync('京东发票.pdf');
  const pdf1 = await PDFDocument.load(originalBytes);
  const page1 = pdf1.getPage(0);
  console.log(`   Contents()返回: ${page1.node.Contents() ? '有' : '无'}`);
  console.log(`   get('Contents')返回: ${page1.node.get('Contents') ? '有' : '无'}`);

  // 2. 保存并重新加载
  console.log('\n2. 保存并重新加载');
  const savedBytes = await pdf1.save();
  fs.writeFileSync('temp-saved.pdf', savedBytes);

  const pdf2 = await PDFDocument.load(savedBytes);
  const page2 = pdf2.getPage(0);
  console.log(`   Contents()返回: ${page2.node.Contents() ? '有' : '无'}`);
  console.log(`   get('Contents')返回: ${page2.node.get('Contents') ? '有' : '无'}`);

  // 3. 尝试合并
  console.log('\n3. 尝试合并到新文档');
  const mergedPdf = await PDFDocument.create();

  try {
    const [copiedPage] = await mergedPdf.copyPages(pdf2, [0]);
    mergedPdf.addPage(copiedPage);
    console.log('   ✓ copyPages成功');

    const finalBytes = await mergedPdf.save();
    fs.writeFileSync('test-reload-merged.pdf', finalBytes);
    console.log('   ✓ 已保存: test-reload-merged.pdf');

    // 检查结果
    const resultPdf = await PDFDocument.load(finalBytes);
    const resultPage = resultPdf.getPage(0);
    const hasContents = resultPage.node.Contents();
    console.log(`   结果页面有Contents: ${hasContents ? '是' : '否'}`);

    if (hasContents && hasContents.sizeInBytes) {
      console.log(`   内容大小: ${hasContents.sizeInBytes()} 字节`);
    }

  } catch (error) {
    console.log(`   ✗ 合并失败: ${error.message}`);
  }

  // 清理
  if (fs.existsSync('temp-saved.pdf')) {
    fs.unlinkSync('temp-saved.pdf');
  }
}

testReloadFix()
  .then(() => {
    console.log('\n测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
