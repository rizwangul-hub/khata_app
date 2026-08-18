import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  getCreditBillHTML,
  getPaymentReceiptHTML,
  getCustomerStatementHTML,
} from '../templates/documentTemplates';
import { getSummaryReportHTML } from '../templates/reportTemplates';
import { sanitizeFileName } from '../utils/formatters';

export class PDFService {
  public static async generateCreditBill(
    shop: any,
    customer: any,
    transaction: any,
    previousBalance: number,
    isUrdu: boolean = false
  ): Promise<{ uri: string; html: string; fileName: string }> {
    const html = getCreditBillHTML(shop, customer, transaction, previousBalance, isUrdu);
    const { uri } = await Print.printToFileAsync({ html });
    const cleanName = sanitizeFileName(customer.name || 'Customer');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Credit_Bill_${cleanName}_${dateStr}.pdf`;

    return { uri, html, fileName };
  }

  public static async generatePaymentReceipt(
    shop: any,
    customer: any,
    transaction: any,
    previousBalance: number,
    isUrdu: boolean = false
  ): Promise<{ uri: string; html: string; fileName: string }> {
    const html = getPaymentReceiptHTML(shop, customer, transaction, previousBalance, isUrdu);
    const { uri } = await Print.printToFileAsync({ html });
    const cleanName = sanitizeFileName(customer.name || 'Customer');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Payment_Receipt_${cleanName}_${dateStr}.pdf`;

    return { uri, html, fileName };
  }

  public static async generateCustomerStatement(
    shop: any,
    customer: any,
    transactions: any[],
    dateRangeText: string,
    totals: { totalCredit: number; totalPaid: number; finalBalance: number },
    isUrdu: boolean = false
  ): Promise<{ uri: string; html: string; fileName: string }> {
    const html = getCustomerStatementHTML(shop, customer, transactions, dateRangeText, totals, isUrdu);
    const { uri } = await Print.printToFileAsync({ html });
    const cleanName = sanitizeFileName(customer.name || 'Customer');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Statement_${cleanName}_${dateStr}.pdf`;

    return { uri, html, fileName };
  }

  public static async generateSummaryReport(
    shop: any,
    periodText: string,
    summary: any,
    activity: any,
    topDebtors: any[],
    isUrdu: boolean = false
  ): Promise<{ uri: string; html: string; fileName: string }> {
    const html = getSummaryReportHTML(shop, periodText, summary, activity, topDebtors, isUrdu);
    const { uri } = await Print.printToFileAsync({ html });
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Financial_Report_${dateStr}.pdf`;

    return { uri, html, fileName };
  }

  public static async shareDocument(fileUri: string, dialogTitle: string = 'Share Receipt'): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        alert('Sharing is not supported on this device.');
        return false;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle,
        UTI: 'com.adobe.pdf',
      });
      return true;
    } catch (error) {
      console.error('[PDFService] Share Error:', error);
      return false;
    }
  }

  public static async printDocument(fileUri: string): Promise<boolean> {
    try {
      await Print.printAsync({ uri: fileUri });
      return true;
    } catch (error) {
      console.error('[PDFService] Print Error:', error);
      alert('Printing is not available or was cancelled on this device.');
      return false;
    }
  }
}
