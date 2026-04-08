import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getGSTDetails } from "./invoice";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type PurchaseData = {
  items: OrderItem[];
};

type Order = {
  id: string;
  baseAmount: number;
  discountApplied?: number;
  gstAmount?: number;
  totalAmount?: number;
  currency: "INR" | "USD";
  purchaseData?: PurchaseData | null; // ✅ fixed
  createdAt?: Date; // ✅ add this
};

type Business = {
  companyName: string;
  gstNumber: string;
  address: string;

  logoUrl?: string | null;
  lutNumber?: string | null;
  state: string;
  pincode?: string;
  country: string;

  createdAt?: Date; // ✅ optional
};

type BillingInfo = {
  name: string;
  email: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber?: string | null;
};

type InvoiceItem = {
  name: string;
  quantity: number;
  price: number;
};

type InvoiceData = {
  order: Order;
  business: Business;
  billing: BillingInfo;
  invoiceNumber: string;
};

/**
 * 🧾 HTML TEMPLATE
 */
function generateInvoiceHTML(data: InvoiceData) {
  const { order, business, billing, invoiceNumber } = data;
  console.log("Billing State:", billing.state);
  console.log("Business State:", business.state);
  if (!business.state) {
    throw new Error("Business state is required for GST calculation");
  }

  const gst = getGSTDetails(billing, {
    state: business.state,
  });

  const baseAmount = order.baseAmount || 0;
  const discount = order.discountApplied || 0;
  const taxable = baseAmount - discount;

  const isInternational =
    billing.country.toLocaleLowerCase() !== "india" &&
    billing.country.toLocaleLowerCase() !== "in";

  const GST_RATE = isInternational ? 0 : gst.igst || gst.cgst + gst.sgst;

  const gstAmount = isInternational
    ? 0
    : order.gstAmount !== undefined
      ? order.gstAmount
      : (taxable * GST_RATE) / 100;

  const cgst = gst.cgst > 0 ? gstAmount / 2 : 0;
  const sgst = gst.sgst > 0 ? gstAmount / 2 : 0;
  const igst = gst.igst > 0 ? gstAmount : 0;

  const total =
    order.totalAmount !== undefined ? order.totalAmount : taxable + gstAmount;

  const currency = order.currency === "INR" ? "₹" : "$";

  // ✅ Invoice type
  const isExport = gst.type === "EXPORT";
  const invoiceTitle = isExport ? "EXPORT INVOICE" : "TAX INVOICE";

  const placeOfSupplyWithCode = isInternational
    ? "Outside India"
    : billing.state;

  // ✅ Items
  const items: InvoiceItem[] = order.purchaseData?.items || [];

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td class="right">${currency}${item.price * item.quantity}</td>
      </tr>
    `,
    )
    .join("");

  const logo = business.logoUrl || "";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        padding: 40px;
        color: #111;
        font-size: 14px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo {
        height: 50px;
      }

      .title {
        font-size: 20px;
        font-weight: 600;
      }

      .divider {
        border-top: 1px dashed #000;
        margin: 15px 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        text-align: left;
        border-bottom: 1px solid #ddd;
        padding: 8px 0;
      }

      td {
        padding: 8px 0;
      }

      .right {
        text-align: right;
      }

      .summary {
        margin-top: 20px;
        width: 300px;
        margin-left: auto;
      }

      .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .total {
        font-weight: bold;
        font-size: 16px;
        border-top: 1px solid #000;
        padding-top: 10px;
        margin-top: 10px;
      }

      .footer {
        margin-top: 20px;
        font-size: 12px;
      }
    </style>
  </head>

  <body>

    <div class="header">
      <div>${logo ? `<img src="${logo}" class="logo" />` : ""}</div>
      <div class="title">${invoiceTitle}</div>
    </div>

    <div class="divider"></div>

    <div>
      <strong>Seller:</strong><br/>
      ${business.companyName}<br/>
      GSTIN: ${business.gstNumber}<br/>
      Address: ${business.address}, ${business.state}, ${business.country}${business.pincode ? ` - ${business.pincode}` : ""}
    </div>

    <br/>

    <div>
      Invoice No: ${invoiceNumber}<br/>
      Invoice Date: ${new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </div>

    <br/>

    <div>
      <strong>Bill To:</strong><br/>
      ${billing.name}<br/>
     ${billing.addressLine1 || ""}<br/>
    ${billing.addressLine2 ? `${billing.addressLine2}<br/>` : ""}
      ${billing.city}, ${billing.state}, ${billing.country}<br/>
      ${billing.gstNumber ? `GSTIN: ${billing.gstNumber}` : ""}
    </div>  

    <br/>

    <div>
      Place of Supply: ${placeOfSupplyWithCode}
    </div>

    <div class="divider"></div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

  <div class="summary">

  <div class="row">
    <span>Subtotal</span>
    <span>${currency}${baseAmount.toFixed(2)}</span>
  </div>

  ${
    discount > 0
      ? `<div class="row">
          <span>Discount</span>
          <span>-${currency}${discount.toFixed(2)}</span>
        </div>`
      : ""
  }

  <div class="row">
    <span>Taxable Amount</span>
    <span>${currency}${taxable.toFixed(2)}</span>
  </div>

  ${
    isExport
      ? `<div class="row">
          <span>GST</span>
          <span>0%</span>
        </div>`
      : `
        ${cgst > 0 ? `<div class="row"><span>CGST 9%</span><span>${currency}${cgst.toFixed(2)}</span></div>` : ""}
        ${sgst > 0 ? `<div class="row"><span>SGST 9%</span><span>${currency}${sgst.toFixed(2)}</span></div>` : ""}
        ${igst > 0 ? `<div class="row"><span>IGST 18%</span><span>${currency}${igst.toFixed(2)}</span></div>` : ""}
      `
  }

  <div class="row total">
    <span>Total</span>
    <span>${currency}${total.toFixed(2)}</span>
  </div>

</div>

    ${
      isExport
        ? `
        <div style="margin-top:20px;font-size:12px;">
          LUT #: ${business.lutNumber || "-"}<br/><br/>
          Note:<br/>
          Supply meant for export of services.<br/>
          Without payment of IGST.
        </div>
      `
        : ""
    }

    <div class="divider"></div>

    <div class="footer">
      Payment Mode: Online<br/>
      Order ID: ${order.id}
    </div>

  </body>
  </html>
  `;
}

/**
 * 📄 GENERATE PDF
 */
export async function generateInvoicePdf(data: InvoiceData) {
  const isDev = process.env.NODE_ENV !== "production";

  let browser;

  if (isDev) {
    const puppeteerFull = await import("puppeteer");
    browser = await puppeteerFull.default.launch({ headless: true });
  } else {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const page = await browser.newPage();

  const html = generateInvoiceHTML(data);

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return pdf;
}
