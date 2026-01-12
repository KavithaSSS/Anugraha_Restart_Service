'use strict';
const express = require('express');
const billing = require('./billprint.controller');
const router = express.Router();

router.post('/billPrint', 
    billing.billPrint
  );

  module.exports = router;