function ConvertDataIntoJson() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastColumn = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  
  var properties = sheet.getRange(1, 2, 1, lastColumn - 1).getValues()[0];
  var dataTypes = sheet.getRange(3, 2, 1, lastColumn - 1).getValues()[0];
  var inclusionCriteria = sheet.getRange(2, 2, 1, lastColumn - 1).getValues()[0];
  var dataRows = sheet.getRange(4, 2, lastRow - 3, lastColumn - 1).getValues();
  var keys = sheet.getRange(4, 1, lastRow - 3, 1).getValues();

  var dictionary = {};

  keys.forEach(function(keyRow, rowIndex) {
    var key = keyRow[0];
    if (key !== "" && !isNaN(key)) {
      var obj = {};
      var arrays = {}; // To store temporary arrays

      properties.forEach(function(property, propIndex) {
        if (inclusionCriteria[propIndex] === "all") {
          var value = dataRows[rowIndex][propIndex];
          var dataType = dataTypes[propIndex];

          if (property.includes('[') && property.includes(']')) { // Check if property is part of an array
            var arrayName = property.split('[')[0]; // Get the array name
            var arrayIndex = parseInt(property.match(/\[(\d+)\]/)[1], 10); // Get the array index

            if (!arrays[arrayName]) arrays[arrayName] = []; // Initialize array if not already
            if (dataType === 'int[]' && value !== "") arrays[arrayName][arrayIndex] = parseInt(value, 10); // Convert string to int for int arrays
            else if (value !== "") arrays[arrayName][arrayIndex] = value; // Assign value to correct index in array

          } else if (value !== "") { // Normal non-array property
            obj[property] = dataType === 'int' ? parseInt(value, 10) : value; // Convert to int if necessary
          }
        }
      });

      Object.assign(obj, arrays);

      if (Object.keys(obj).length > 0) {
        dictionary[parseInt(key, 10)] = obj;
      }
    }
  });

  var jsonString = JSON.stringify(dictionary, null, 2);
  Logger.log(jsonString);
  ShowCopyDialog(jsonString); // Uncomment if needed
  // CreateJsonFile(jsonString, sheet.getName()); // Assumes this function is defined elsewhere
}

function ShowCopyDialog(jsonString, url) {
    var htmlOutput = HtmlService
        .createHtmlOutput('<textarea id="jsonText" style="width:100%;height:200px;">'
                          + jsonString +
                          '</textarea><br><button onclick="copyToClipboard()">Copy to Clipboard</button>'
                          + '<button onclick="window.open(\'' + url + '\');">Download JSON</button>'
                          + '<script>function copyToClipboard() {var copyText = document.getElementById("jsonText"); copyText.select(); document.execCommand("copy"); alert("Copied!");}</script>')
        .setWidth(400)
        .setHeight(250)
        .setTitle('Copy JSON & Download JSON');
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Copy JSON & Download JSON');
}

function CreateJsonFile(jsonString, fileName) {
  // Create a file in Google Drive with the JSON content
  var file = DriveApp.createFile(fileName, jsonString, MimeType.PLAIN_TEXT);
  
  // Optionally, set the file to be viewable by anyone with the link if you want to share it
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  ShowCopyDialog(jsonString, file.getUrl());
  // Log the URL for downloading the file
  Logger.log(file.getUrl());
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp, SlidesApp or FormApp.
  ui.createMenu('선용툴')
      .addItem('Json 생성', 'ConvertDataIntoJson')
      .addToUi();
}
