
import { Client, OrderLog } from '../types';

export const GoogleSheetsService = {
  async fetchClients(): Promise<{ clients: Client[], logs: OrderLog[] }> {
    const url = localStorage.getItem('APPS_SCRIPT_URL')?.trim();
    if (!url) throw new Error("Apps Script URL not configured in Settings");

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Detailed fetch error:', error);
      throw error;
    }
  },

  async updateClient(client: Client): Promise<void> {
    const url = localStorage.getItem('APPS_SCRIPT_URL')?.trim();
    if (!url) throw new Error("Apps Script URL not configured in Settings");

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(client),
      });
    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      throw error;
    }
  }
};

/**
 * GOOGLE APPS SCRIPT CODE (PASTE IN EXTENSIONS > APPS SCRIPT)
 * -----------------------------------------------------------
 * 
const FMS_SHEET = "FMS";
const DATA_SHEET = "DATA";

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fmsSheet = ss.getSheetByName(FMS_SHEET);
  const dataSheet = ss.getSheetByName(DATA_SHEET);
  
  const fmsData = fmsSheet.getDataRange().getValues();
  const clients = [];
  
  const fmt = (val) => {
    if (!val) return "N/A";
    try { return Utilities.formatDate(new Date(val), "GMT+5:30", "dd/MM/yyyy"); } catch(e) { return "N/A"; }
  };

  for (var i = 1; i < fmsData.length; i++) {
    var row = fmsData[i];
    if (!row[2]) continue; 
    clients.push({
      rowIndex: i + 1,
      id: row[0] || "",
      crmName: row[1] || "",
      clientName: row[2] || "",
      number: row[3] || "",
      contactPerson: row[4] || "",
      productName: row[5] || "",
      averageOrderSize: row[6] || 0,
      orderFrequency: row[7] || "",
      lastOrderDate: fmt(row[9]), 
      dateForCalling: fmt(row[8]), 
      frequencyOfCalling: row[10] || 0,
      update: row[11] || "",
      lastCallingDate: fmt(row[12]),
      nextFollowUpDate: fmt(row[13]),
      remark: row[14] || ""
    });
  }

  const logs = [];
  if (dataSheet) {
    const rawLogs = dataSheet.getDataRange().getValues();
    // Return last 500 logs for calendar performance
    const startRow = Math.max(1, rawLogs.length - 500);
    for (var j = startRow; j < rawLogs.length; j++) {
      var lRow = rawLogs[j];
      logs.push({
        timestamp: lRow[0] ? lRow[0].toString() : "",
        id: lRow[1] || "",
        crmName: lRow[2] || "",
        clientName: lRow[3] || "",
        orderStatus: lRow[4] || "",
        remark: lRow[5] || "",
        nextFollowUpDate: fmt(lRow[7])
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ clients, logs }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataLogSheet = ss.getSheetByName(DATA_SHEET) || ss.insertSheet(DATA_SHEET);
    const payload = JSON.parse(e.postData.contents);
    
    dataLogSheet.appendRow([
      new Date(),                      
      payload.id,                      
      payload.crmName,                 
      payload.clientName,              
      payload.orderStatus,             
      payload.remark || "",            
      payload.emailAddress || "",      
      payload.nextFollowUpDate || ""   
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
*/
