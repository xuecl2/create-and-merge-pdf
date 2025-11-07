/**
 * 完整演示：生成报销单并与发票合并
 */

const { generateReceipt } = require('./generate-receipt');
const { mergePDFs } = require('./merge-pdf');

async function demo() {
  try {
    console.log('========================================');
    console.log('演示：生成报销单并与发票合并');
    console.log('========================================\n');

    // 步骤1: 准备测试数据
    console.log('步骤 1: 准备测试数据...');
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
        },
        {
          departDate: '2025-07-29 00',
          departPlace: '55',
          arriveDate: '2025-07-29',
          arrivePlace: '',
          transport: '高铁',
          transportFee: '55.00',
          days: '0.0',
          allowanceStd: '50.00',
          allowanceFee: '0.00',
          accommodation: '0.00',
          localTransport: '0.00',
          otherFee: '0.00',
          subtotal: '55.00'
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

    // 步骤2: 生成报销单
    console.log('\n步骤 2: 生成报销单...');
    const receiptPath = 'demo-报销单.pdf';
    await generateReceipt(receiptData, receiptPath);
    console.log(`✓ 报销单已生成: ${receiptPath}`);

    // 步骤3: 合并报销单与发票（保持原始尺寸）
    console.log('\n步骤 3: 合并报销单与发票（保持原始尺寸）...');
    const mergedPath = 'demo-合并结果.pdf';
    await mergePDFs([receiptPath, '京东发票.pdf'], mergedPath, { pageSize: 'ORIGINAL' });
    console.log(`✓ 合并完成: ${mergedPath}`);

    // 步骤4: 合并报销单与发票（统一调整为A4）
    console.log('\n步骤 4: 合并报销单与发票（统一调整为A4）...');
    const mergedA4Path = 'demo-合并结果-A4.pdf';
    await mergePDFs([receiptPath, '京东发票.pdf'], mergedA4Path, { pageSize: 'A4', center: true });
    console.log(`✓ 合并完成: ${mergedA4Path}`);

    console.log('\n========================================');
    console.log('演示完成！');
    console.log('========================================');
    console.log('\n生成的文件:');
    console.log(`  1. ${receiptPath} - 报销单`);
    console.log(`  2. ${mergedPath} - 合并结果（原始尺寸）`);
    console.log(`  3. ${mergedA4Path} - 合并结果（A4统一尺寸）`);

  } catch (error) {
    console.error('\n❌ 演示失败:', error.message);
    throw error;
  }
}

// 运行演示
if (require.main === module) {
  demo()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { demo };
