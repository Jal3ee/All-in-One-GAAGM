const SPREADSHEET_ID = '1gU_BMUlbICQPUx6wxMxJC6qWMOgDzmlJW59h_h2JHJY'; 
const ATTACHMENTS_FOLDER_ID = '1zsawZ7keOCnrWZifDKNyHYxCG4X2hMxE';

function doGet(e) {
  return handleResponse({ status: 'success', message: 'GARDA Backend is running.' });
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;

    let result;
    switch (action) {
      case 'read':
        result = readData(payload.table, payload.query);
        break;
      case 'insert':
        result = insertData(payload.table, payload.data);
        break;
      case 'update':
        result = updateData(payload.table, payload.id, payload.data);
        break;
      case 'delete':
        result = deleteData(payload.table, payload.id);
        break;
      case 'login':
        result = loginUser(payload.email, payload.password);
        break;
      case 'upload':
        result = uploadFile(payload.fileName, payload.mimeType, payload.base64Data);
        break;
      case 'replace_file':
        result = replaceFile(payload.fileId, payload.mimeType, payload.base64Data);
        break;
      case 'download_file':
        result = downloadFileBase64(payload.fileId);
        break;
      default:
        throw new Error('Action not supported: ' + action);
    }
    
    return handleResponse({ status: 'success', data: result });
  } catch (error) {
    return handleResponse({ status: 'error', message: error.message });
  }
}

function handleResponse(response) {
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateId() {
  return Utilities.getUuid();
}
