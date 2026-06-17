var sheetName = 'Sheet1';

function doGet() {
  return ContentService
    .createTextOutput('GRASP contact form is live')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getParams(e) {
  var params = {};

  if (e && e.parameter) {
    for (var key in e.parameter) {
      if (e.parameter.hasOwnProperty(key)) {
        params[key] = e.parameter[key];
      }
    }
  }

  if (e && e.postData && e.postData.contents) {
    var pairs = String(e.postData.contents).split('&');
    for (var i = 0; i < pairs.length; i++) {
      var idx = pairs[i].indexOf('=');
      if (idx === -1) continue;
      var k = decodeURIComponent(pairs[i].substring(0, idx).replace(/\+/g, ' '));
      var v = decodeURIComponent(pairs[i].substring(idx + 1).replace(/\+/g, ' '));
      params[k] = v;
    }
  }

  return params;
}

function doPost(e) {
  try {
    var p = getParams(e);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }

    sheet.appendRow([
      new Date(),
      p.name || '',
      p.phone || '',
      p.email || '',
      p.interest || '',
      p.message || '',
      p.sourcePage || ''
    ]);

    return ContentService
      .createTextOutput('success')
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService
      .createTextOutput('error: ' + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
