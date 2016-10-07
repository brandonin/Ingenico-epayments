function create(__helpers) {
  var str = __helpers.s,
      empty = __helpers.e,
      notEmpty = __helpers.ne,
      escapeXml = __helpers.x;

  return function render(data, out) {
    out.w("<!DOCTYPE html><html lang=\"en\"><head><title>Ingenico JavaScript S2S example</title><link rel=\"stylesheet\" href=\"//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css\"><style>\n    .output-wrapper {\n      display: none;\n    }\n  </style></head><body><div class=\"container\"> <div style=\"float:left; margin-top:200px;\"><h4>Creating transaction using the SDK</h4><a data-href=\"/payments/createPaymentWithSDK\" href=\"#\">Create Transaction</a><h4>Creating transaction without the SDK</h4><a data-href=\"/payments/createPaymentWithOutSDK\" href=\"#\">Create Transaction</a></div><div style=\"float:right;\" class=\"col-xs-12 col-md-9 output-wrapper\"><p>Status: <span id=\"outputStatusCode\"></span>, Roundtrip: <span id=\"roundTrip\"></span> ms</p><pre id=\"output\"></pre></div></div><script src=\"//code.jquery.com/jquery-2.2.2.min.js\" integrity=\"sha256-36cp2Co+/62rEAAYHLmRCPIych47CvdM+uTBJwSzWjI=\" crossorigin=\"anonymous\"></script><script src=\"//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js\"></script><script>\n    $(function () {\n      var clicked = '';\n\n      var doSend = function (url, param) {\n      var start = new Date().getTime();\n        if (param) {\n          url = url + \"/\" + param;\n        }\n        $(\".output-wrapper\").show();\n        $(\"#output\").text('Loading ...');\n        $(\"#roundTrip\").text('-');\n        $(\"#outputStatusCode\").text('Loading ...');\n        $.getJSON(url, function (json) {\n          $(\"#output\").text(JSON.stringify(json, null, '  '));\n        }).fail(function (error) {\n          $(\"#output\").text(JSON.stringify(error.responseJSON, null, '  '));\n        }).always(function(jqxhr, textStatus, _jqxhr) {\n          if (textStatus === \"success\" || textStatus === \"nocontent\") {\n            // the always callback has parameters based on the statusText\n            // jqXHR.always(function( data|jqXHR, textStatus, jqXHR|errorThrown ) { });\n            // so if the status is 'success' I copy the jqxhr.\n            jqxhr = _jqxhr;\n          }\n          $(\"#outputStatusCode\").text(jqxhr.status + \" \" + jqxhr.statusText);\n          $(\"#roundTrip\").text(new Date().getTime() - start);\n        });\n      };\n\n      $(\"a[data-href]\").click(function (e) {\n        e.preventDefault();\n        if ($(this).data(\"input\")) {\n          // fill popup\n          var property = $(this).data(\"input\");\n          clicked = $(this).data(\"href\");\n          $(\"#inputs label\").text(property);\n          $(\"#inputs input\").attr(\"placeholder\", property).data('key', property);\n          $(\"#themodal\").modal({backdrop: 'static'});\n        } else {\n          doSend($(this).data(\"href\"));\n        }\n      });\n\n      $('#themodal').on('shown.bs.modal', function () {\n        $('#inputs input').focus();\n      });\n\n      $('#inputs').on(\"submit\", function (e) {\n        e.preventDefault();\n        var filled = $('#inputs input').val();\n        doSend(clicked, filled);\n        $(\"#themodal\").modal('hide');\n      });\n\n      $(\"#sendOverlay\").on('click', function (e) {\n        var filled = $('#inputs input').val();\n        doSend(clicked, filled);\n        $(\"#themodal\").modal('hide');\n      });\n    });\n  </script></body></html>");
  };
}

(module.exports = require("marko").c(__filename)).c(create);
