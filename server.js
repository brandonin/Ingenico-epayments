var express = require('express');
var app = express();
var marko = require('marko');
require('marko/node-require').install();
var connectSdk = require('connect-sdk-nodejs');
var crypto = require('crypto');
var logger = require('./util/logger');
var dateformat = require('dateFormat');
var request = require('request');
var _ = require('lodash');
var https = require('https');


// stubs
var createPaymentStub = require('./stubs/payments/createPaymentRequest.json');
var config = require('./config.json');

connectSdk.init({
  host: config.apiEndpoint.host,
  scheme: config.apiEndpoint.scheme,
  port: config.apiEndpoint.port,
  enableLogging: config.enableLogging, // defaults to false
  logger: logger, // if undefined console.log will be used
  apiKeyId: config.apiKeyId,
  secretApiKey: config.secretApiKey
});

var host = "https://api-sandbox.globalcollect.com/v1";

var apiKeyId = config.apiKeyId;
var secretApiKey = config.secretApiKey;

// DEMO app
var port = config.port;
var merchantId = config.merchantId;

app.engine('marko', function (filePath, options, callback) {
  marko.load(filePath).render(options, function (err, output) {
    callback(null, output);
  });
});
app.use('/global', express.static(__dirname + '/global'));
app.set('view engine', 'marko');

app.get('/', function (req, res) {
  res.render('index');
});
var render = function (res, error, response) {
  if (error) {
    console.log(error, error.body);
    var status = (typeof error.status !== 'undefined') ? error.status : 500;
    var body = (typeof error.body !== 'undefined') ? error.body : error;
    res.status(status).json(body).end();
  } else {
    res.status(response.status).json(response.body).end();
  }
  if (connectSdk.context.getIdempotenceRequestTimestamp()) {
    // this call is made with idempotence annd is still being handled
    console.log('idempotence timestamp', connectSdk.context.getIdempotenceRequestTimestamp());
  }
};

// hardcoded for demo purposes
var paymentContext = {
  currencyCode: "EUR",
  countryCode: "NL",
  locale: "en_GB",
  amount: 1000,
  isRecurring: true
};

// all SDK methods; grouped by API method

// hosted checkouts

// payments
app.get('/payments/createPaymentWithSDK', function (req, res) {
  paymentContext.idemPotence = {
    key: 'idempotence'
  };
  connectSdk.payments.create(merchantId, createPaymentStub, paymentContext, function (error, sdkResponse) {
    render(res, error, sdkResponse);
  });
});

app.get('/payments/createPaymentWithOutSDK', function (req, res) {
  var path =  '/v1/' + merchantId + '/payments';
  var options = {
    host: config.apiEndpoint.host,
    port: config.apiEndpoint.port,
    path: path,
    method: 'POST'
  }

  var gcsHeaders = [{ key: 'X-GCS-Idempotence-Key', value: 'idempotence' }];
  var info = {
    key: "X-GCS-ServerMetaInfo",
    value: {
      'sdkCreator': 'Ingenico',
      'sdkIdentifier': 'NodejsServerSDK/v1.1.0',
      'platformIdentifier': process.env['OS'] + ' Node.js/' + process.versions.node
    }
  };

  info.value = new Buffer(JSON.stringify(info.value)).toString("base64");
  gcsHeaders.push(info);
  var headers = '';
  

  var sortedXGCSHeaders = [];
  _.forEach(gcsHeaders, function(header) {
    if (header.key.toUpperCase().indexOf("X-GCS") === 0) {
      // add this header
      sortedXGCSHeaders.push(header);
    }
  });
  sortedXGCSHeaders = sortedXGCSHeaders.sort(function(a, b) {
    a.key = a.key.toUpperCase();
    b.key = b.key.toUpperCase();
    if (a.key < b.key) {
      return -1;
    } else if (a.key > b.key) {
      return 1;
    } else {
      return 0;
    }
  });
  _.forEach(sortedXGCSHeaders, function(header) {
    headers += header.key.toLowerCase() + ":" + header.value + "\n";
  });

  var separator = "?";
  for (var key in paymentContext) {
    if (key !== "extraHeaders" && key !== "idemPotence") {
      if (_.isArray(paymentContext[key])) {
        for (var value in paymentContext[key]) {
          path += separator + key + "=" + paymentContext[key][value];
          separator = "&";
        }
      } else {
        path += separator + key + "=" + paymentContext[key];
        separator = "&";
      }
    }
  }
  date = dateformat("GMT:ddd, dd mmm yyyy HH:MM:ss") + " GMT";
  var token = crypto.createHmac("SHA256", secretApiKey).update("POST" + "\n" + "application/json" + "\n" + date + "\n" + headers + path + "\n").digest('base64');
  console.log("GCS v1HMAC:" + apiKeyId + ":" + token);

  request({
    method: 'POST',
    url : "https://" + config.apiEndpoint.host + path,
    headers: {
      'Authorization':  "GCS v1HMAC:" + apiKeyId + ":" + token
    },
    body: JSON.stringify(createPaymentStub)
  }, function(error, response, body) {
    console.log(body);
  })

});

// init express
app.listen(port, function () {
  logger.info('server running at http://localhost:' + port);
});