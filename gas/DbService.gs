function getSheet(tableName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) throw new Error('Table (Sheet) not found: ' + tableName);
  return sheet;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getRecords(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  return data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function readData(tableName, query = {}) {
  const sheet = getSheet(tableName);
  const headers = getHeaders(sheet);
  let records = getRecords(sheet, headers);
  
  // Simple filtering
  if (query.eq) {
    for (const [key, value] of Object.entries(query.eq)) {
      records = records.filter(r => r[key] === value);
    }
  }
  if (query.neq) {
    for (const [key, value] of Object.entries(query.neq)) {
      records = records.filter(r => r[key] !== value);
    }
  }
  
  // Sorting
  if (query.order) {
    const field = query.order.field;
    const ascending = query.order.ascending;
    records.sort((a, b) => {
      if (a[field] < b[field]) return ascending ? -1 : 1;
      if (a[field] > b[field]) return ascending ? 1 : -1;
      return 0;
    });
  }

  // Related tables (Joins/Includes mock)
  // For GAS we just send raw data, frontend can map or we do a simple relation here.
  // We'll keep it simple: return records, frontend handles mapping if needed.

  return records;
}

function insertData(tableName, dataArr) {
  const sheet = getSheet(tableName);
  const headers = getHeaders(sheet);
  
  if (!Array.isArray(dataArr)) {
    dataArr = [dataArr];
  }
  
  const inserted = [];
  dataArr.forEach(data => {
    if (!data.id) data.id = generateId(); // Add UUID if not present
    if (!data.created_at) data.created_at = new Date().toISOString();
    
    const rowData = headers.map(header => data[header] !== undefined ? data[header] : '');
    sheet.appendRow(rowData);
    inserted.push(data);
  });
  
  return inserted.length === 1 ? inserted[0] : inserted;
}

function updateData(tableName, id, data) {
  const sheet = getSheet(tableName);
  const headers = getHeaders(sheet);
  const records = getRecords(sheet, headers);
  
  const rowIndex = records.findIndex(r => r.id === id);
  if (rowIndex === -1) throw new Error('Record not found with ID: ' + id);
  
  const rowNumber = rowIndex + 2; // +1 for header, +1 for array index
  
  const existingRecord = records[rowIndex];
  const updatedRecord = { ...existingRecord, ...data };
  
  const rowData = headers.map(header => updatedRecord[header] !== undefined ? updatedRecord[header] : '');
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowData]);
  
  return updatedRecord;
}

function deleteData(tableName, id) {
  const sheet = getSheet(tableName);
  const headers = getHeaders(sheet);
  const records = getRecords(sheet, headers);
  
  const rowIndex = records.findIndex(r => r.id === id);
  if (rowIndex === -1) throw new Error('Record not found with ID: ' + id);
  
  const rowNumber = rowIndex + 2;
  sheet.deleteRow(rowNumber);
  return { success: true };
}

function loginUser(email, password) {
  const sheet = getSheet('tbl_employees');
  const headers = getHeaders(sheet);
  const records = getRecords(sheet, headers);
  
  const user = records.find(r => r.email === email);
  if (!user) throw new Error('User not found');
  
  // Note: For production, please hash passwords. We compare plain text here for simplicity.
  if (user.password !== password) throw new Error('Invalid credentials');
  
  if (user.status !== 'Aktif') throw new Error('Akun dinonaktifkan');
  
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    session: { access_token: generateId(), user: userWithoutPassword } // Mock session
  };
}
