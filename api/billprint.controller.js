const billingService = require('../service/billprintService');

/** Get order number */
module.exports.billPrint = async (req, res) => {
  let response = {};
  try {
    const responseFromService = await billingService.sendPrintToBilling(req);
    if (responseFromService) {
      response = responseFromService;
    }
  } catch (error) {
    response = { 'status': error.errno, 'message': error.message };
  }
  return res.send(response);
};