export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) return 'Rs. 0';
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString()}`;
};

export const formatDateTime = (
  dateStr: string,
  isUrdu: boolean = false
): { dateFormatted: string; timeFormatted: string } => {
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString(isUrdu ? 'ur-PK' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { dateFormatted, timeFormatted };
  } catch (e) {
    return { dateFormatted: dateStr, timeFormatted: '' };
  }
};

export const generateReceiptNumber = (
  transactionDate: string,
  transactionId: string
): string => {
  try {
    const dateObj = new Date(transactionDate);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const cleanId = (transactionId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    return `KH-${yyyy}${mm}${dd}-${cleanId || '000000'}`;
  } catch (e) {
    return `KH-RCPT-${(transactionId || '').slice(-6).toUpperCase()}`;
  }
};

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
};
