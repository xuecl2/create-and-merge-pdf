// 差旅报销单模拟数据
module.exports = {
  // 基本信息
  code: 'CLBX202507280001', // 报销单编号，用于生成二维码
  date: '2025年07月28日',
  department: '经营计划室',
  pageNumber: '第 1 页/ 共 1 页',
  totalAmount: '99.00',

  // 报销人信息
  employee: '谢松',
  reason: '999',
  projectName: '',

  // 明细数据
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
    },
    {
      departureDate: '2025-07-29 00',
      departurePlace: '55',
      arrivalDate: '2025-07-29',
      arrivalPlace: '',
      transport: '高铁',
      transportAmount: '55.00',
      days: '0.0',
      allowanceStandard: '50.00',
      allowanceAmount: '0.00',
      accommodation: '0.00',
      localTransport: '0.00',
      otherExpenses: '0.00',
      subtotal: '55.00',
      receipts: ''
    }
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
