import { formatCurrency, formatDateTime } from '../utils/formatters';

interface ShopInfo {
  shopName: string;
  phone?: string;
  address?: string;
}

export const getSummaryReportHTML = (
  shop: ShopInfo,
  periodText: string,
  summary: any,
  activity: any,
  topDebtors: any[],
  isUrdu: boolean = false
): string => {
  const todayStr = formatDateTime(new Date().toISOString(), isUrdu).dateFormatted;

  const fontStyle = isUrdu
    ? `font-family: 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right;`
    : `font-family: 'Inter', system-ui, -apple-system, sans-serif; direction: ltr; text-align: left;`;

  const topDebtorsRows = topDebtors
    .map(
      (d) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">${d.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${d.phone || 'N/A'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #ef4444; text-align: right;">
        ${formatCurrency(d.balance)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shop Summary Report - ${periodText}</title>
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
    .grid-summary {
      display: grid;
      grid-template-cols: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .card-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .card-val {
      font-size: 22px;
      font-weight: 800;
      margin-top: 4px;
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
        ${isUrdu ? 'دکان کی مالیاتی رپورٹ' : 'FINANCIAL SUMMARY REPORT'}
      </div>
    </div>

    <div style="margin-bottom: 16px; font-size: 14px; font-weight: 700; color: #2563eb;">
      Report Period: ${periodText} • Generated: ${todayStr}
    </div>

    <div class="grid-summary">
      <div class="card">
        <div class="card-label">${isUrdu ? 'کل گاہک:' : 'Total Customers'}</div>
        <div class="card-val" style="color: #0f172a;">${summary.totalCustomers}</div>
      </div>
      <div class="card">
        <div class="card-label">${isUrdu ? 'مدت کا کل ادھار:' : 'Period Credit'}</div>
        <div class="card-val" style="color: #ef4444;">${formatCurrency(activity.periodCredit)}</div>
      </div>
      <div class="card">
        <div class="card-label">${isUrdu ? 'مدت کی کل وصولی:' : 'Period Received'}</div>
        <div class="card-val" style="color: #16a34a;">${formatCurrency(activity.periodReceived)}</div>
      </div>
    </div>

    <div class="grid-summary">
      <div class="card">
        <div class="card-label">${isUrdu ? 'کل واجب الادا بقایا:' : 'Total Outstanding'}</div>
        <div class="card-val" style="color: #ef4444;">${formatCurrency(summary.totalOutstanding)}</div>
      </div>
      <div class="card">
        <div class="card-label">${isUrdu ? 'کل کسٹمر ایڈوانس:' : 'Total Advance'}</div>
        <div class="card-val" style="color: #2563eb;">${formatCurrency(summary.totalAdvance)}</div>
      </div>
      <div class="card">
        <div class="card-label">${isUrdu ? 'کل لین دین کی تعداد:' : 'Transactions Count'}</div>
        <div class="card-val" style="color: #0f172a;">${activity.periodTransactionsCount}</div>
      </div>
    </div>

    <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #1e293b;">
      ${isUrdu ? 'ٹاپ نادہندہ گاہک (Top Debtors)' : 'Top Debtors'}
    </h3>

    <table>
      <thead>
        <tr>
          <th style="text-align: left;">${isUrdu ? 'گاہک' : 'Customer'}</th>
          <th style="text-align: left;">${isUrdu ? 'فون' : 'Phone'}</th>
          <th style="text-align: right;">${isUrdu ? 'واجب الادا رقم' : 'Outstanding Balance'}</th>
        </tr>
      </thead>
      <tbody>
        ${topDebtorsRows || `<tr><td colSpan="3" style="text-align:center; padding: 16px; color:#94a3b8;">No debtors found.</td></tr>`}
      </tbody>
    </table>

    <div class="footer">
      Generated directly from Universal Shop Khata Digital Ledger Records.<br/>
      Powered by Universal Shop Khata
    </div>
  </div>
</body>
</html>
  `;
};
