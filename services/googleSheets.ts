
import { format, parse } from 'date-fns';
import { Client, OrderLog, User } from '../types';

export const GoogleSheetsService = {
  async fetchClients(user?: User): Promise<{ clients: Client[], logs: OrderLog[] }> {
    const url = import.meta.env.VITE_APPSCRIPT_URL;
    if (!url) throw new Error("VITE_APPSCRIPT_URL not configured in .env");

    try {
      // Fetch Clients from FMS MST
      const response = await fetch(`${url}?sheet=FMS MST`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch data");

      const clients: Client[] = [];
      const data = result.data || [];

      // Start from index 2 (data starts at row 3)
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue; // Skip empty IDs

        // Filter logic: If user exists and is NOT ADMIN, only show rows where Col B (Index 1) matches their name
        if (user && user.role.toUpperCase() !== 'ADMIN') {
          const rowName = String(row[1] || "").trim();
          const userName = user.name.trim();
          if (rowName.toLowerCase() !== userName.toLowerCase()) {
            continue;
          }
        }

        clients.push({
          id: String(row[0]), // Column A (0)
          crmName: String(row[1] || ""), // Column B (1)
          clientName: String(row[2] || ""), // Column C (2)
          number: String(row[3] || ""), // Column D (3)
          contactPerson: String(row[4] || ""), // Column E (4)
          productName: String(row[5] || ""), // Column F (5)
          averageOrderSize: String(row[6] || ""), // Column G (6)
          orderFrequency: String(row[7] || ""), // Column H (7) - ORDER FREQUENCY
          lastOrderDate: formatDate(row[9]), // Column J (9)
          // Frequency of Calling is not mapped in user request, defaulting to 0
          frequencyOfCalling: 0,
          lastCallingDate: formatDate(row[13]), // Column N (13)
          remark: String(row[18] || ""), // Column S (18)
          nextFollowUpDate: formatDate(row[20]), // Column U (20)
          update: "", // Not mapped
          dateForCalling: "" // Not mapped
        });
      }

      // 2. Fetch Logs from DATA Sheet
      const logsResponse = await fetch(`${url}?sheet=DATA`);
      const logs: OrderLog[] = [];

      if (logsResponse.ok) {
        const logsResult = await logsResponse.json();
        if (logsResult.success && Array.isArray(logsResult.data)) {
          const logRows = logsResult.data;
          // Start from index 2 (User specified data starts from row 3)
          for (let j = 2; j < logRows.length; j++) {
            const lRow = logRows[j];
            // Skip empty rows
            if (!lRow[0]) continue;

            // Filter logs based on User Role
            if (user && user.role.toUpperCase() !== 'ADMIN') {
              const logCrmName = String(lRow[2] || "").trim(); // Column C (Index 2)
              const userName = user.name.trim(); // Master Sheet Name
              if (logCrmName.toLowerCase() !== userName.toLowerCase()) {
                continue;
              }
            }

            logs.push({
              timestamp: String(lRow[0] || ""), // Timestamp (Col A)
              id: String(lRow[1] || ""),
              crmName: String(lRow[2] || ""),
              clientName: String(lRow[3] || ""),
              orderStatus: String(lRow[4] || ""),
              remark: String(lRow[5] || ""),
              nextFollowUpDate: formatDate(lRow[7]), // Col H (Index 7)
            });
          }
        }
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
        formattedNextFollowUp       // Index 7: Next Follow Up Date (MM/dd/yyyy)
      ];


      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'insert',
          sheetName: 'DATA',
          rowData: JSON.stringify(rowData)
        }).toString()
      });
    } catch (error) {
      console.error('Error updating Google Sheet:', error);
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
