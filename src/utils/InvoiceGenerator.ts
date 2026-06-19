import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { Platform, Alert } from 'react-native';

const fmt = (v: number) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getInvoiceHtml = (order: any, customer: any, totalPending: number = 0) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #FDFBF7;
                color: #333;
                margin: 0;
                padding: 40px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-info h1 {
                margin: 0;
                font-size: 32px;
                letter-spacing: 2px;
                color: #111;
            }
            .company-info p {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
                letter-spacing: 1px;
            }
            .invoice-meta {
                text-align: right;
                font-size: 14px;
                color: #444;
            }
            .invoice-meta p {
                margin: 4px 0;
            }
            .buyer-section {
                margin-bottom: 40px;
            }
            .buyer-section h3 {
                font-size: 12px;
                color: #777;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-bottom: 10px;
            }
            .buyer-info p {
                margin: 4px 0;
                font-size: 14px;
                font-weight: 500;
            }
            .buyer-info .name {
                font-size: 18px;
                font-weight: 700;
                color: #222;
                margin-bottom: 8px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
            }
            th {
                border-top: 2px solid #000;
                border-bottom: 2px solid #000;
                padding: 12px 8px;
                text-align: left;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #111;
            }
            th.right, td.right {
                text-align: right;
            }
            td {
                padding: 16px 8px;
                border-bottom: 1px solid #ddd;
                font-size: 14px;
                color: #333;
            }
            .summary {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 50px;
            }
            .summary-box {
                width: 300px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
            }
            .summary-row.total {
                font-weight: bold;
                font-size: 16px;
                border-top: 1px solid #000;
                padding-top: 12px;
            }
            .footer {
                border-top: 2px solid #EEE;
                padding-top: 20px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .payment-details {
                font-size: 12px;
                color: #666;
                max-width: 300px;
                line-height: 1.6;
            }
            .thank-you {
                font-size: 28px;
                font-style: italic;
                color: #222;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                <h1>SMJ</h1>
                <p>FIND THE RIGHT ONE FOR YOU</p>
            </div>
            <div class="invoice-meta">
                <p>Invoice No. <strong>#${order.id}</strong></p>
                <p>Date: ${todayStr()}</p>
                <p>81 Thandhan street, shevapet</p>
                <p>salem 636002</p>
                <p>Contact: 6382861858</p>
            </div>
        </div>

        <div class="buyer-section">
            <h3>Invoice To</h3>
            <div class="buyer-info">
                <p class="name">${customer.shop_name}</p>
                <p>${customer.owner_name}</p>
                <p>${customer.address || ''} ${customer.area ? ', ' + customer.area : ''}</p>
                <p>${customer.city || ''}</p>
                <p>Contact: ${customer.mobile_number}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="right">Qty</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>${order.category}</strong><br>
                        <span style="font-size: 12px; color: #777;">Order Date: ${order.order_date}</span>
                    </td>
                    <td class="right">${order.quantity} ${order.order_unit}</td>
                    <td class="right">₹${fmt(order.net_value)}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-box">
                <div class="summary-row">
                    <span>Total Value:</span>
                    <span>₹${fmt(order.net_value)}</span>
                </div>
                <div class="summary-row" style="color: #2ECC71;">
                    <span>Total Amount Paid:</span>
                    <span>₹${fmt(order.amount_paid)}</span>
                </div>
                <div class="summary-row total" style="color: ${order.pending_amount > 0 ? '#E74C3C' : '#2C3E50'};">
                    <span>Pending Credit:</span>
                    <span>₹${fmt(order.pending_amount)}</span>
                </div>
                ${totalPending > 0 ? `
                <div class="summary-row" style="margin-top: 15px; font-weight: bold; font-size: 14px; background-color: #FDEDEC; padding: 10px; border-radius: 6px; color: #C0392B;">
                    <span>Overall Account Pending:</span>
                    <span>₹${fmt(totalPending)}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <div class="payment-details">
                <strong>Notes:</strong><br>
                ${order.notes ? order.notes : 'Thank you for your business.'}
            </div>
            <div class="thank-you">
                Thank you!
            </div>
        </div>
    </body>
    </html>
  `;
};

const generateInvoicePdf = async (order: any, customer: any, totalPending: number = 0) => {
  const htmlContent = getInvoiceHtml(order, customer, totalPending);
  const options = {
    html: htmlContent,
    fileName: `Invoice_SMJ_Order_${order.id}`,
    base64: Platform.OS === 'ios',
  };

  const file = await generatePDF(options as any);
  
  let filePath = file.filePath || '';
  if (!filePath) {
    throw new Error('PDF generation failed, no file path returned.');
  }

  return filePath;
};

export const shareInvoice = async (order: any, customer: any, totalPending: number = 0) => {
  try {
    let filePath = await generateInvoicePdf(order, customer, totalPending);
    
    let shareUrl = filePath;
    if (Platform.OS === 'android' && !shareUrl.startsWith('file://')) {
      shareUrl = `file://${shareUrl}`;
    }

    const shareOptions = {
      title: 'Share Invoice',
      url: shareUrl,
      type: 'application/pdf',
      failOnCancel: false,
    };
    
    await Share.open(shareOptions);
  } catch (error) {
    console.error('Error sharing invoice:', error);
    Alert.alert('Error', 'Could not share the invoice.');
  }
};

export const downloadInvoice = async (order: any, customer: any, totalPending: number = 0) => {
  try {
    let sourcePath = await generateInvoicePdf(order, customer, totalPending);
    
    let destPath = '';
    const fileName = `Invoice_SMJ_Order_${order.id}.pdf`;

    if (Platform.OS === 'android') {
      destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    } else {
      destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    }

    // Check if file exists and remove it to avoid errors
    const exists = await RNFS.exists(destPath);
    if (exists) {
      await RNFS.unlink(destPath);
    }

    // React Native HTML to PDF usually doesn't append file:// on Android returned path
    const normalizedSource = sourcePath.replace('file://', '');
    
    await RNFS.copyFile(normalizedSource, destPath);
    
    Alert.alert('Success', `Invoice saved to: \n${destPath}`);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    Alert.alert('Error', 'Could not download the invoice. Storage permissions might be needed.');
  }
};
