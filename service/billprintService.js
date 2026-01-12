
const errorlogService = require('./ErrorLogMgmtService');
const constants = require('../constants');
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const PDFDocument = require('pdfkit');
const { print } = require('pdf-to-printer');

module.exports.sendPrintToBilling = async (req) => {
  try {
    const { bill_id, source, no_of_prints } = req.body;
    const payload = {
      bill_id: bill_id,
      source: source
    };
    let apiResponse;
    try {
      apiResponse = await axios.post(
        `${constants.ENV.APIURL}/getBillingDetailsForPrint`,
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );
    } catch (error) {
      errorlogService.errorlog(constants.ErrorlogMessage.PLAT_FORM_NAME, 'Bill Print', error, 'getBillingDetailsForPrint');
    }


    const varPrintDetails = apiResponse.data.data?.billing_details;
    const ip = apiResponse.data.data?.ip;

    let varTitle1 = apiResponse.data.data?.varTitle1;
    let varTitle2 = apiResponse.data.data?.varTitle2;
    let varFooter = apiResponse.data.data?.varFooter;

    let varOrderTypeName = apiResponse.data.data?.varOrderTypeName;

    const gstDetails = apiResponse.data.data?.gstDetails;
    const source1 = apiResponse.data.data?.source;
    const copies = Number(no_of_prints) > 0 ? no_of_prints : 1;
    // console.log("Status:", apiResponse.status);
    // console.log("Data:", apiResponse.data);
    // if (printerType == 1) {
    billPrintViaUsb(varTitle2, varFooter, varPrintDetails, varOrderTypeName, ip, gstDetails, source1, varTitle1, copies);
    // }
  }
  catch (error) {
    // console.log("Error", error);
    errorlogService.errorlog(constants.ErrorlogMessage.PLAT_FORM_NAME, 'Bill Print', error, 'ErrorsendPrintToBilling');
  }
};

async function billPrintViaUsb(varTitle2, varFooter, varPrintDetails, varOrderTypeName, ip, gstDetails, source, varTitle1, copies) {

  const filePath = './public/pdf/bill.pdf';
  // Extract directory path
  const dirPath = path.dirname(filePath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const doc = new PDFDocument({
    size: [220, 800],   // 3-inch thermal width
    margins: { top: 0, left: 5, right: 5, bottom: 0 }
  });

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Registering the font with a relative path
  doc.registerFont('DejaMono-Bold', './fonts/DejaVuSansMono-Bold.ttf');

  // // ---------- HEADER ----------
  // if (varLogoPath != '') {
  //   const imageTop = 5;
  //   const imageHeight = 30;

  //   doc.image(varLogoPath, 1, imageTop, {
  //     fit: [228, imageHeight], // Adjust image height
  //     align: 'center',
  //   });

  //   // 👇 Move text BELOW the image
  //   doc.y = imageTop + imageHeight + 5;
  // }
  doc
    .fontSize(12)
    .font('DejaMono-Bold')
    .text(varTitle1, { align: 'center' });
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .font('DejaMono-Bold')
    .text(varTitle2, { align: 'center' });

  doc.moveDown(0.5);
  doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();
  doc.moveDown(0.5);
  if (source == 3) {
    doc.fontSize(8).text('Duplicate Bill', {
      align: 'center'
    });
    doc.moveDown(0.3);
  }
  // ---------- BILL DETAILS ----------
  const billNo = `Bill No.:${varPrintDetails.bill_no}`;
  const date = `Date:${varPrintDetails.bill_date}`;
  const TableNoText = 'Mobile No: ';
  const TableNo = varPrintDetails.mob_no;
  const waiterText = 'Customer Name: ';
  const waiter = varPrintDetails.customer_name;

  doc.font('DejaMono-Bold');
  doc.fontSize(8).text(billNo);
  doc.moveDown(0.3);
  doc.fontSize(8).text(date + '  ' + varPrintDetails.bill_time);
  if (waiter !== '' || TableNo !== '') {
    doc.moveDown(0.3);
    doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();
    doc.moveDown(0.3);
  }
  if (waiter !== '') {
    doc.fontSize(8).text(waiterText + waiter);
  }
  if (TableNo !== '') {
    doc.fontSize(8).text(TableNoText + TableNo);
  }

  doc.moveDown(0.5);
  doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();
  doc.moveDown(0.3);
  // doc.fontSize(8.5).font('DejaMono-Bold').text('ITEM                  RATE  QTY  AMOUNT');
  doc.fontSize(8.5).font('DejaMono-Bold').text('ITEM            RATE     QTY     AMOUNT');
  doc.moveDown(0.3);
  doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();

  // ---------- ITEMS ----------
  const items = varPrintDetails.item_details;

  doc.font('DejaMono-Bold');

  items.forEach((item) => {
    const itemName = item.item_name.slice(0, 12);
    let itemQty = item.qty;
    // Get decimal part
    const decimalPart = item.qty - Math.floor(item.qty);

    // Check if there is any fractional part
    const hasDecimal = decimalPart !== 0;
    if (hasDecimal) {
      itemQty = Number(item.qty).toFixed(item?.number_of_decimals);
    }

    doc.moveDown(0.3);
    if (itemName.length > 13) {
      doc.fontSize(9).text(itemName);
      doc.fontSize(8).text(
        `${' '.padEnd(21)} ${String(item.rate).padStart(6)}  ${String(
          itemQty
        ).padStart(3)}  ${item.total.toFixed(2).padStart(7)}`
      );
    } else {
      doc.fontSize(9).text(
        `${itemName.padEnd(12)} ${String(item.rate).padStart(6)}  ${String(
          itemQty
        ).padStart(5)}  ${item.total.toFixed(2).padStart(8)}`
      );
    }
  });

  doc.moveDown(0.5);
  doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();

  // ---------- TOTAL SUMMARY ----------
  const roundoff = varPrintDetails.round_off;
  const total = varPrintDetails.total_amount;
  // Define space constants for padding
  const amountPadding = 10; // Number of spaces you want to pad the amount
  // const cgstAmountPadding = 8; // Number of spaces you want to pad the amount
  const roundOffPadding = 9; // Number of spaces you want to pad the amount
  const discountPadding = 10;

  const space = ' ';  // For concatenating space
  const leftPaddingSgst = 18;
  const leftPaddingTotal = 10;
  const totalText = `Rs.${Number(total).toFixed(2)}`;

  const totalWidthSubtotal = 36;
  const subtotalAmount = `SubTotal${String(Number(varPrintDetails.sub_total).toFixed(2)).padStart(amountPadding)}`;
  const itemTotalQty = `Items:${varPrintDetails?.total_items}`;
  // Calculate how many spaces needed between to push rightText to the end
  const spaceBetweenSuntotal = totalWidthSubtotal - (itemTotalQty.length + subtotalAmount.length);
  const spacerSubtotal = ' '.repeat(Math.max(spaceBetweenSuntotal, 1));

  // Construct the subTotalText with padding
  const subTotalText = itemTotalQty + spacerSubtotal + subtotalAmount;

  const discountText = `${space.repeat(leftPaddingSgst)}Discount${String(
    Number(varPrintDetails.discount).toFixed(2)
  ).padStart(discountPadding)}`;

  const roundoffText = `${space.repeat(leftPaddingSgst)}Round Off${String(
    Number(roundoff).toFixed(2)
  ).padStart(roundOffPadding)}`;

  doc.moveDown(0.8);
  doc.font('DejaMono-Bold').fontSize(9);

  doc.text(subTotalText);
  if (Number(varPrintDetails.discount) > 0) {
    doc.text(discountText);
  }
  if (Number(roundoff) != 0) {
    doc.text(roundoffText);
  }

  doc.moveDown(0.3);
  doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font('DejaMono-Bold').fontSize(11).text(`${space.repeat(leftPaddingTotal)}Total${String(totalText).padStart(15)}`);
  doc.moveDown(0.3);
  doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();

  doc.moveDown(0.5);
  doc.fontSize(12).font('DejaMono-Bold').text(`Rs.${Number(total).toFixed(2)}`, {
    align: 'center'
  });
  doc.moveDown(1);

  // ---------- GST DETAILS ----------
  const filterGstDetails = gstDetails.filter(gst => Number(gst.tax) > 0);
  if (filterGstDetails?.length > 0) {
    doc.moveDown(0.5);
    doc.font('DejaMono-Bold').fontSize(9).text('GST Details', { align: 'center' });

    doc.moveDown(0.5);
    doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();
    doc.moveDown(0.3);
    // Header (Taxable removed)
    doc.fontSize(7.5).text(
      'GST%   CGST Amount  SGST Amount  IGST Amount'
    );

    doc.moveDown(0.3);
    doc.fontSize(9);
    doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();

    // Data rows
    filterGstDetails.forEach(gst => {
      doc.moveDown(0.3);
      const gstPer = Number(gst.tax || 0).toFixed(2).padEnd(5);
      const cgst = Number(gst.cgst || 0).toFixed(2).padStart(10);
      const sgst = Number(gst.sgst || 0).toFixed(2).padStart(10);
      const igst = Number(gst.igst || 0).toFixed(2).padStart(10);

      doc.fontSize(7.5).text(
        `${gstPer}   ${cgst}   ${sgst}   ${igst}`
      );
    });

    doc.moveDown(0.3);
    doc.moveTo(5, doc.y).lineTo(210, doc.y).stroke();

    doc.moveDown(0.5);
  }
  // ---------- FOOTER ----------
  doc
    .fontSize(10)
    .font('DejaMono-Bold')
    .text(varFooter, { align: 'center' });

  doc.end();

  writeStream.on('finish', async () => {
    try {
      for (let i = 0; i < copies; i++) {
        await print(filePath, {
          printer: ip,
          scale: 'noscale',
          paperSize: 'CUSTOM',
          silent: true
        });
      }
    } catch (err) {
      errorlogService.errorlog(constants.ErrorlogMessage.PLAT_FORM_NAME, 'Bill Print', err, 'billPrintViaUsb');
    }
  });
}