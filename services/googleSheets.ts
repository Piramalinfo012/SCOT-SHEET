
import { format, parse } from 'date-fns';
import { Client, OrderLog, User } from '../types';

export const GoogleSheetsService = {
  async fetchClients(user?: User): Promise<{ clients: Client[], logs: OrderLog[] }> {
    const url = import.meta.env.VITE_APPSCRIPT_URL;
    if (!url) throw new Error("VITE_APPSCRIPT_URL not configured in .env");

    try {
      // Fetch Clients from FMS MST    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const result = await response.json();
      
      // The new Apps Script doGet returns { clients: [...], logs: [...] } directly
      
      const clients: Client[] = [];
      const data = result.clients || [];

      // Loop through the pre-formatted clients array from Apps Script
      for (let i = 0; i < data.length; i++) {
        const clientData = data[i];

        // Filter logic: If user exists and is NOT ADMIN, only show rows where CRM Name matches their name
        if (user && user.role.toUpperCase() !== 'ADMIN') {
          const rowName = String(clientData.crmName || "").trim();
          const userName = user.name.trim();
          if (rowName.toLowerCase() !== userName.toLowerCase()) {
            continue;
          }
        }

        clients.push({
          id: String(clientData.id || ""),
          rowIndex: clientData.rowIndex,
          crmName: String(clientData.crmName || ""),
          clientName: String(clientData.clientName || ""),
          number: String(clientData.number || ""),
          contactPerson: String(clientData.contactPerson || ""),
          productName: String(clientData.productName || ""),
          averageOrderSize: String(clientData.averageOrderSize || ""),
          orderFrequency: String(clientData.orderFrequency || ""),
          lastOrderDate: clientData.lastOrderDate === "N/A" ? "" : clientData.lastOrderDate,
          lastRateQuoted: String(clientData.lastRateQuoted || ""), // Fetching from the updated API
          frequencyOfCalling: Number(clientData.frequencyOfCalling) || 0,
          lastCallingDate: clientData.lastCallingDate === "N/A" ? "" : clientData.lastCallingDate,
          remark: String(clientData.remark || ""),
          nextFollowUpDate: clientData.nextFollowUpDate === "N/A" ? "" : clientData.nextFollowUpDate,
          after1Day: clientData.after1Day === "N/A" ? "" : clientData.after1Day,
          before3Days: clientData.before3Days === "N/A" ? "" : clientData.before3Days,
          before10Days: clientData.before10Days === "N/A" ? "" : clientData.before10Days,
          update: String(clientData.update || ""),
          dateForCalling: clientData.dateForCalling === "N/A" ? "" : clientData.dateForCalling
        });
      }

      const logs: OrderLog[] = [];
      const logRows = result.logs || [];
      
      for (let j = 0; j < logRows.length; j++) {
        const lRow = logRows[j];
        
        // Filter logs based on User Role
        if (user && user.role.toUpperCase() !== 'ADMIN') {
          const logCrmName = String(lRow.crmName || "").trim();
          const userName = user.name.trim();
          if (logCrmName.toLowerCase() !== userName.toLowerCase()) {
            continue;
          }
        }

        logs.push({
          timestamp: String(lRow.timestamp || ""),
          id: String(lRow.id || ""),
          crmName: String(lRow.crmName || ""),
          clientName: String(lRow.clientName || ""),
          orderStatus: String(lRow.orderStatus || ""),
          remark: String(lRow.remark || ""),
          nextFollowUpDate: String(lRow.nextFollowUpDate || ""),
          attachmentUrl: String(lRow.attachmentUrl || ""),
        });
      }

      return { clients, logs };
    } catch (error) {
      console.error('Detailed fetch error:', error);
      throw error;
    }
  },

  async updateClient(client: Client): Promise<void> {
    const url = import.meta.env.VITE_APPSCRIPT_URL;
    if (!url) throw new Error("VITE_APPSCRIPT_URL not configured in .env");

    try {
      // Prepare row data for DATA sheet
      const timestamp = format(new Date(), 'M/d/yyyy H:mm:ss');
      // Format nextFollowUpDate to MM/dd/yyyy for proper storage
      let formattedNextFollowUp = client.nextFollowUpDate;
      try {
        if (client.nextFollowUpDate && client.nextFollowUpDate !== 'N/A') {
          // Assuming client.nextFollowUpDate comes in as dd/MM/yyyy from the UI or existing data
          const parsedDate = parse(client.nextFollowUpDate, 'dd/MM/yyyy', new Date());
          if (!isNaN(parsedDate.getTime())) {
            formattedNextFollowUp = format(parsedDate, 'MM/dd/yyyy');
          }
        }
      } catch (e) {
        console.warn("Date parsing error", e);
      }

      const rowData = [
        timestamp,                  // Index 0: Timestamp
        client.id,                  // Index 1: ID
        client.crmName,             // Index 2: CRM Name
        client.clientName,          // Index 3: Client Name
        client.orderStatus,         // Index 4: Order Status
        client.remark,              // Index 5: Remark
        "",                         // Index 6: Skipped/Empty
        formattedNextFollowUp,      // Index 7: Next Follow Up Date (MM/dd/yyyy)
        ""                          // Index 8: Attachment URL (to be filled by Apps Script)
      ];

      const requestBody: any = {
        action: 'insert',
        sheetName: 'DATA',
        rowData: JSON.stringify(rowData)
      };

      if (client.attachmentBase64) {
        requestBody.fileData = client.attachmentBase64;
        requestBody.fileName = client.attachmentName;
        requestBody.mimeType = client.attachmentMimeType;
      }

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(requestBody).toString()
      });
    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      throw error;
    }
  },

  async addClient(client: Partial<Client>): Promise<void> {
    const url = import.meta.env.VITE_APPSCRIPT_URL;
    if (!url) throw new Error("VITE_APPSCRIPT_URL not configured in .env");

    try {
      const rowData = [
        "",                             // Index 0: ID (Empty as requested)
        client.crmName || "",           // Index 1: CRM NAME
        client.clientName || "",        // Index 2: CLIENT NAME
        client.number || "",            // Index 3: NUMBER
        client.contactPerson || "",     // Index 4: CONTACT PERSON
        client.productName || "",       // Index 5: PRODUCT NAME
        client.averageOrderSize || "",  // Index 6: AVERAGE ORDER SIZE
        client.orderFrequency || ""     // Index 7: ORDER FREQUENCY IN DAYS
      ];

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'insert',
          sheetName: 'FMS MST',
          rowData: JSON.stringify(rowData)
        }).toString()
      });
    } catch (error) {
      console.error('Error adding client to Google Sheet:', error);
      throw error;
    }
  },

  async editClientBasic(client: Client): Promise<void> {
    const url = import.meta.env.VITE_APPSCRIPT_URL;
    if (!url) throw new Error("VITE_APPSCRIPT_URL not configured in .env");

    if (!client.rowIndex) throw new Error("Client rowIndex is missing");

    try {
      // The FMS MST sheet starts with index 0
      const rowData = [
        "",                             // Index 0: ID (Empty)
        client.crmName || "",           // Index 1: CRM NAME
        client.clientName || "",        // Index 2: CLIENT NAME
        client.number || "",            // Index 3: NUMBER
        client.contactPerson || "",     // Index 4: CONTACT PERSON
        client.productName || "",       // Index 5: PRODUCT NAME
        client.averageOrderSize || "",  // Index 6: AVERAGE ORDER SIZE
        client.orderFrequency || ""     // Index 7: ORDER FREQUENCY IN DAYS
      ];

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'update',
          sheetName: 'FMS MST',
          rowIndex: client.rowIndex.toString(),
          rowData: JSON.stringify(rowData)
        }).toString()
      });
    } catch (error) {
      console.error('Error editing client in Google Sheet:', error);
      throw error;
    }
  },

  async fetchUsers(): Promise<User[]> {
    const url = import.meta.env.VITE_APPSCRIPT_URL;
    if (!url) throw new Error("VITE_APPSCRIPT_URL not configured in .env");

    try {
      const response = await fetch(`${url}?sheet=Master`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch users");

      const users: User[] = [];
      const data = result.data || [];

      // Start from index 1 (assuming row 0 is header)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue; // Skip empty usernames

        // Master Sheet:
        // Col A (0): Name
        // Col B (1): Username
        // Col C (2): Password (handled in auth context)
        // Col D (3): Role

        users.push({
          name: String(row[0] || ""),
          username: String(row[1] || ""),
          role: String(row[3] || "user"),
          // Password is not stored in the user object for security, 
          // AuthContext will handle validation against the raw data if needed
          // or we can attach it here temporarily for client-side check as requested.
          // The request implies fetching this data for comparison.
          ...({ password: String(row[2] || "") } as any) // Hidden property for auth check
        });
      }
      return users;
    } catch (error) {
      console.error('Detailed fetch error:', error);
      throw error;
    }
  }
};

const formatDate = (val: any): string => {
  if (!val) return "N/A";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val); // Return as is if not a valid date
    return d.toLocaleDateString("en-GB"); // dd/mm/yyyy format
  } catch (e) {
    return "N/A";
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
    const FMS_SHEET = "FMS MST";
    const FMS_SHEET_legacy = "FMS";
    const fmsSheet = ss.getSheetByName(FMS_SHEET) || ss.getSheetByName(FMS_SHEET_legacy);
    
    // Parse Payload Options
    let payload;
    let action = "";
    
    // Check if it's form data or json string
    if (e.postData.type === "application/x-www-form-urlencoded") {
      action = e.parameter.action;
      payload = e.parameter;
    } else {
      payload = JSON.parse(e.postData.contents);
      action = payload.action;
    }

    if (action === 'insert' && payload.sheetName === 'DATA') {
      const dataLogSheet = ss.getSheetByName('DATA') || ss.insertSheet('DATA');
      let rowData = JSON.parse(payload.rowData);
      
      // Handle File Upload if present
      if (payload.fileData && payload.fileName && payload.mimeType) {
        try {
          const folderId = '1CPooEJJgbAluj2W6CGhpwEAxC8vhlC1v';
          const folder = DriveApp.getFolderById(folderId);
          const blob = Utilities.newBlob(Utilities.base64Decode(payload.fileData), payload.mimeType, payload.fileName);
          const file = folder.createFile(blob);
          const fileUrl = file.getUrl();
          rowData[8] = fileUrl; // Put URL in Column I (Index 8)
        } catch(uploadErr) {
          rowData[8] = "Upload Error: " + uploadErr.message;
        }
      }
      
      dataLogSheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'insert' && payload.sheetName === 'FMS MST') {
      const rowData = JSON.parse(payload.rowData);
      let newIdStr = "";
      
      if (fmsSheet) {
          const lr = fmsSheet.getLastRow();
          let maxId = 0;
          if (lr > 1) {
              const ids = fmsSheet.getRange(2, 1, lr - 1, 1).getValues();
              for (let i = 0; i < ids.length; i++) {
                  let val = String(ids[i][0]).toUpperCase().trim();
                  if (val.startsWith("SCT/")) {
                      let num = parseInt(val.replace("SCT/", ""), 10);
                      if (!isNaN(num) && num > maxId) {
                          maxId = num;
                      }
                  }
              }
          }
          newIdStr = "SCT/" + (maxId + 1);
          rowData[0] = newIdStr; 
          fmsSheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", id: newIdStr }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update' && payload.sheetName === 'FMS MST' && payload.rowIndex) {
      const rowIndex = parseInt(payload.rowIndex, 10);
      const rowData = JSON.parse(payload.rowData);
      
      if (fmsSheet && rowIndex > 1) {
          // Columns 2 to 8 map to Indices 1 to 7 in rowData
          fmsSheet.getRange(rowIndex, 2, 1, 7).setValues([rowData.slice(1, 8)]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Legacy fallback
    const dataLogSheet = ss.getSheetByName('DATA') || ss.insertSheet('DATA');
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
