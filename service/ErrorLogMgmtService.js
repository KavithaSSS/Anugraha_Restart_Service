const commonService = require('../service/ErrorLogMgmtService');
const constants = require('../constants');
module.exports.errorlog = async function (platform, module, error, functionality) {
  try {
    const createupdate_date = new Date();
    let direction = './log/';
    if (platform != constants.ErrorlogMessage.PLAT_FORM_NAME) { direction = './log_front_end/'; };
    const fs = require('fs');
    if (!fs.existsSync(direction)) {
      fs.mkdirSync(direction);
    }
    const dateTimeStr = new Date().toLocaleString();
    const ErrortimeMinutes = (dateTimeStr.split(', ')[1]).split(':').join(':');
    const FileName = `${createupdate_date.getFullYear()  }-${  (createupdate_date.getMonth() + 1)  }  -${  createupdate_date.getDate()}`;
    const Format = `\n${  ErrortimeMinutes  } Platform : ${  platform  }, Module : ${  module  }, Error : ${  error  }, Functionality : ${  functionality}`;

    fs.appendFile(`${direction + FileName  }_log.txt`, Format, (err) => {
      if (err) throw err;
    });

    return true;
  } catch (err) {
    return err;
  }
};

module.exports.errorlogInfo = async function (req) {
  try {
    const createupdate_date = new Date();
    let direction = './log/';
    if (req.platform != constants.ErrorlogMessage.PLAT_FORM_NAME) { direction = './log_front_end/'; };
    const fs = require('fs');
    if (!fs.existsSync(direction)) {
      fs.mkdirSync(direction);
    }
    const dateTimeStr = new Date().toLocaleString();
    const ErrortimeMinutes = (dateTimeStr.split(', ')[1]).split(':').join(':');
    const FileName = `${createupdate_date.getFullYear()  }-${  (createupdate_date.getMonth() + 1)  }-${  createupdate_date.getDate()}`;
    const Format = `\n${  ErrortimeMinutes  } Platform : ${  req.platform  }, Module : ${  req.Module  }, Info : ${  req.error  }, Functionality : ${  req.functionality}`;

    fs.appendFile(`${direction + FileName  }_log.txt`, Format, (err) => {
      if (err) throw err;
    });
    return true;
  } catch (err) {
    return err;
  }
};

module.exports.errorLog = async (req) => {
  try {
    const { platform, Module, error, functionality } = req;
    await commonService.errorlog(platform, Module, error, functionality);
    return { message: 'Updated' };
  } catch (error) {
    throw new Error(error);
  }
};