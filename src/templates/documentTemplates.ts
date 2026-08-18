import { formatCurrency, formatDateTime, generateReceiptNumber } from '../utils/formatters';

interface ShopInfo {
  shopName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
}

interface CustomerInfo {
  name: string;
  phone?: string;
  address?: string;
}

interface TransactionInfo {
  id: string;
  type: 'credit' | 'payment';
  itemName?: string;
  amount: number;
  weight?: number;
  weightUnit?: string;
  notes?: string;
  transactionDate: string;
}

export const getCreditBillHTML = (
  shop: ShopInfo,
  customer: CustomerInfo,
  transaction: TransactionInfo,
  previousBalance: number,
  isUrdu: boolean = false
): string => {
  const receiptNo = generateReceiptNumber(transaction.transactionDate, transaction.id);
  const { dateFormatted, timeFormatted } = formatDateTime(transaction.transactionDate, isUrdu);
  const currentCredit = transaction.amount;
  const newBalance = previousBalance + currentCredit;

  const fontStyle = isUrdu
    ? `font-family: 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right;`
    : `font-family: 'Inter', system-ui, -apple-system, sans-serif; direction: ltr; text-align: left;`;

  return `
<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Bill - ${receiptNo}</title>
  <style>
    body {
      ${fontStyle}
      background-color: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 24px;
    }
    .receipt-card {
      max-width: 450px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 11px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .shop-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .shop-info {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-title {
      background-color: #ef4444;
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 20px;
      display: inline-block;
      margin: 12px 0 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .label {
      color: #64748b;
      font-weight: 600;
    }
    .value {
      font-weight: 700;
      color: #0f172a;
    }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 14px 0;
    }
    .item-box {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      margin: 12px 0;
    }
    .total-box {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 14px;
      margin-top: 16px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="brand">UNIVERSAL SHOP KHATA</div>
      <h1 class="shop-name">${shop.shopName}</h1>
      <div class="shop-info">
        ${shop.phone ? `Phone: ${shop.phone}` : ''} ${shop.address ? `• ${shop.address}` : ''}
      </div>
      <div>
        <span class="doc-title">${isUrdu ? 'ادھار بل' : 'CREDIT BILL'}</span>
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        ${receiptNo}
      </div>
    </div>

    <div class="row">
      <span class="label">${isUrdu ? 'گاہک:' : 'Customer:'}</span>
      <span class="value">${customer.name}</span>
    </div>
    ${customer.phone ? `
    <div class="row">
      <span class="label">${isUrdu ? 'فون:' : 'Phone:'}</span>
      <span class="value">${customer.phone}</span>
    </div>` : ''}
    <div class="row">
      <span class="label">${isUrdu ? 'تاریخ و وقت:' : 'Date & Time:'}</span>
      <span class="value">${dateFormatted} • ${timeFormatted}</span>
    </div>

    <div class="item-box">
      <div class="row">
        <span class="label">${isUrdu ? 'آئٹم کا نام:' : 'Item:'}</span>
        <span class="value">${transaction.itemName || (isUrdu ? 'ادھار سامان' : 'Credit Item')}</span>
      </div>
      ${transaction.weight ? `
      <div class="row">
        <span class="label">${isUrdu ? 'وزن:' : 'Weight:'}</span>
        <span class="value">${transaction.weight} ${transaction.weightUnit || 'kg'}</span>
      </div>` : ''}
      <div class="row" style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
        <span class="label">${isUrdu ? 'قیمت:' : 'Amount:'}</span>
        <span class="value" style="color: #ef4444; font-size: 16px;">${formatCurrency(currentCredit)}</span>
      </div>
    </div>

    <div class="row">
      <span class="label">${isUrdu ? 'سابقہ بقایا:' : 'Previous Balance:'}</span>
      <span class="value">${formatCurrency(previousBalance)}</span>
    </div>
    <div class="row">
      <span class="label">${isUrdu ? 'موجودہ ادھار:' : 'This Credit:'}</span>
      <span class="value" style="color: #ef4444;">+ ${formatCurrency(currentCredit)}</span>
    </div>

    <div class="total-box">
      <div class="row" style="margin-bottom: 0;">
        <span class="label" style="color: #991b1b; font-size: 14px;">${isUrdu ? 'کل نیا بقایا:' : 'New Balance:'}</span>
        <span class="value" style="color: #991b1b; font-size: 18px;">${formatCurrency(newBalance)}</span>
      </div>
    </div>

    <div class="footer">
      Thank you for your business!<br/>
      Powered by Universal Shop Khata
    </div>
  </div>
</body>
</html>
  `;
};

export const getPaymentReceiptHTML = (
  shop: ShopInfo,
  customer: CustomerInfo,
  transaction: TransactionInfo,
  previousBalance: number,
  isUrdu: boolean = false
): string => {
  const receiptNo = generateReceiptNumber(transaction.transactionDate, transaction.id);
  const { dateFormatted, timeFormatted } = formatDateTime(transaction.transactionDate, isUrdu);
  const paymentAmount = transaction.amount;
  const remainingBalance = previousBalance - paymentAmount;

  let balanceLabel = isUrdu ? 'بقیہ واجب الادا:' : 'Remaining Balance:';
  let balanceText = formatCurrency(remainingBalance);
  let balanceColor = '#16a34a';

  if (remainingBalance === 0) {
    balanceLabel = isUrdu ? 'حساب کی صورتحال:' : 'Account Status:';
    balanceText = isUrdu ? 'حساب برابر' : 'Settled (Rs. 0)';
    balanceColor = '#16a34a';
  } else if (remainingBalance < 0) {
    balanceLabel = isUrdu ? 'کسٹمر ایڈوانس:' : 'Customer Advance:';
    balanceText = formatCurrency(Math.abs(remainingBalance));
    balanceColor = '#2563eb';
  }

  const fontStyle = isUrdu
    ? `font-family: 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right;`
    : `font-family: 'Inter', system-ui, -apple-system, sans-serif; direction: ltr; text-align: left;`;

  return `
<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptNo}</title>
  <style>
    body {
      ${fontStyle}
      background-color: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 24px;
    }
    .receipt-card {
      max-width: 450px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 11px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .shop-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .shop-info {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-title {
      background-color: #16a34a;
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 20px;
      display: inline-block;
      margin: 12px 0 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .label {
      color: #64748b;
      font-weight: 600;
    }
    .value {
      font-weight: 700;
      color: #0f172a;
    }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 14px 0;
    }
    .item-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px;
      margin: 16px 0;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="brand">UNIVERSAL SHOP KHATA</div>
      <h1 class="shop-name">${shop.shopName}</h1>
      <div class="shop-info">
        ${shop.phone ? `Phone: ${shop.phone}` : ''} ${shop.address ? `• ${shop.address}` : ''}
      </div>
      <div>
        <span class="doc-title">${isUrdu ? 'وصولی رسید' : 'PAYMENT RECEIPT'}</span>
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        ${receiptNo}
      </div>
    </div>

    <div class="row">
      <span class="label">${isUrdu ? 'گاہک:' : 'Customer:'}</span>
      <span class="value">${customer.name}</span>
    </div>
    ${customer.phone ? `
    <div class="row">
      <span class="label">${isUrdu ? 'فون:' : 'Phone:'}</span>
      <span class="value">${customer.phone}</span>
    </div>` : ''}
    <div class="row">
      <span class="label">${isUrdu ? 'تاریخ و وقت:' : 'Date & Time:'}</span>
      <span class="value">${dateFormatted} • ${timeFormatted}</span>
    </div>

    <div class="item-box">
      <div class="row" style="margin-bottom: 0;">
        <span class="label" style="color: #166534; font-size: 14px;">${isUrdu ? 'موصول شدہ رقم:' : 'Amount Received:'}</span>
        <span class="value" style="color: #166534; font-size: 20px;">${formatCurrency(paymentAmount)}</span>
      </div>
    </div>

    <div class="row">
      <span class="label">${isUrdu ? 'سابقہ بقایا:' : 'Previous Balance:'}</span>
      <span class="value">${formatCurrency(previousBalance)}</span>
    </div>
    <div class="row">
      <span class="label">${isUrdu ? 'وصولی ادا شدہ:' : 'Paid:'}</span>
      <span class="value" style="color: #16a34a;">- ${formatCurrency(paymentAmount)}</span>
    </div>

    <div class="divider"></div>

    <div class="row" style="font-size: 15px;">
      <span class="label" style="color: #0f172a;">${balanceLabel}</span>
      <span class="value" style="color: ${balanceColor}; font-size: 17px;">${balanceText}</span>
    </div>

    <div class="footer">
      Received with thanks!<br/>
      Powered by Universal Shop Khata
    </div>
  </div>
</body>
</html>
  `;
};

export const getCustomerStatementHTML = (
  shop: ShopInfo,
  customer: CustomerInfo,
  transactions: TransactionInfo[],
  dateRangeText: string,
  totals: { totalCredit: number; totalPaid: number; finalBalance: number },
  isUrdu: boolean = false
): string => {
  const todayStr = formatDateTime(new Date().toISOString(), isUrdu).dateFormatted;

  const fontStyle = isUrdu
    ? `font-family: 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right;`
    : `font-family: 'Inter', system-ui, -apple-system, sans-serif; direction: ltr; text-align: left;`;

  let runningBalance = 0;
  const tableRowsHtml = transactions
    .slice() // sort ascending for running balance timeline
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
    .map((tx) => {
      const isCredit = tx.type === 'credit';
      if (isCredit) {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }

      const dateStr = formatDateTime(tx.transactionDate, isUrdu).dateFormatted;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${dateStr}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">
            ${isCredit ? tx.itemName || (isUrdu ? 'ادھار' : 'Credit') : (isUrdu ? 'وصولی (ادائیگی)' : 'Payment')}
            ${tx.weight ? ` (${tx.weight}${tx.weightUnit || 'kg'})` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #ef4444; text-align: right;">
            ${isCredit ? formatCurrency(tx.amount) : '-'}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #16a34a; text-align: right;">
            ${!isCredit ? formatCurrency(tx.amount) : '-'}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right;">
            ${formatCurrency(runningBalance)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Statement - ${customer.name}</title>
  <style>
    body {
      ${fontStyle}
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 32px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .shop-title {
      font-size: 24px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .shop-sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-badge {
      background-color: #eff6ff;
      color: #2563eb;
      font-size: 16px;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
    }
    .info-grid {
      display: flex;
      justify-content: space-between;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      padding: 12px 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .summary-box {
      display: flex;
      justify-content: flex-end;
      gap: 24px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .summary-item {
      text-align: right;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 32px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="shop-title">${shop.shopName}</h1>
        <div class="shop-sub">
          ${shop.phone ? `Phone: ${shop.phone}` : ''} ${shop.address ? `• ${shop.address}` : ''}
        </div>
      </div>
      <div class="doc-badge">
        ${isUrdu ? 'کھاتہ تفصیلی سٹیٹمنٹ' : 'CUSTOMER STATEMENT'}
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">${isUrdu ? 'گاہک تفصیل:' : 'CUSTOMER DETAILS'}</div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${customer.name}</div>
        ${customer.phone ? `<div style="font-size: 13px; color: #475569;">${customer.phone}</div>` : ''}
      </div>

      <div style="text-align: right;">
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">${isUrdu ? 'سٹیٹمنٹ مدت:' : 'STATEMENT PERIOD'}</div>
        <div style="font-size: 14px; font-weight: 700; color: #2563eb; margin-top: 2px;">${dateRangeText}</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Generated on: ${todayStr}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: left;">${isUrdu ? 'تاریخ' : 'Date'}</th>
          <th style="text-align: left;">${isUrdu ? 'تفصیل' : 'Description'}</th>
          <th style="text-align: right;">${isUrdu ? 'ادھار (Credit)' : 'Credit'}</th>
          <th style="text-align: right;">${isUrdu ? 'وصولی (Payment)' : 'Payment'}</th>
          <th style="text-align: right;">${isUrdu ? 'مجموعی بقایا' : 'Balance'}</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml || `<tr><td colSpan="5" style="text-align:center; padding: 20px; color:#94a3b8;">No transactions recorded in this period.</td></tr>`}
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-item">
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">${isUrdu ? 'کل ادھار:' : 'TOTAL CREDIT'}</div>
        <div style="font-size: 16px; font-weight: 800; color: #ef4444;">${formatCurrency(totals.totalCredit)}</div>
      </div>
      <div class="summary-item">
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">${isUrdu ? 'کل وصولی:' : 'TOTAL PAID'}</div>
        <div style="font-size: 16px; font-weight: 800; color: #16a34a;">${formatCurrency(totals.totalPaid)}</div>
      </div>
      <div class="summary-item">
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">${isUrdu ? 'موجودہ خالص بقایا:' : 'CURRENT BALANCE'}</div>
        <div style="font-size: 20px; font-weight: 800; color: ${totals.finalBalance > 0 ? '#ef4444' : totals.finalBalance === 0 ? '#16a34a' : '#2563eb'};">
          ${totals.finalBalance > 0 ? formatCurrency(totals.finalBalance) : totals.finalBalance === 0 ? (isUrdu ? 'حساب برابر' : 'Settled') : `Advance: ${formatCurrency(Math.abs(totals.finalBalance))}`}
        </div>
      </div>
    </div>

    <div class="footer">
      This statement is generated directly from the shop's digital Khata records.<br/>
      Powered by Universal Shop Khata
    </div>
  </div>
</body>
</html>
  `;
};
