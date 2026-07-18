function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function uploadFile(fileName, mimeType, base64Data) {
  try {
    const folder = getOrCreateFolder('GARDA_Attachments');
    
    // Decode base64
    // base64Data usually comes as "data:image/jpeg;base64,....." or just the raw base64 string
    const dataPart = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const blob = Utilities.newBlob(Utilities.base64Decode(dataPart), mimeType, fileName);
    
    const file = folder.createFile(blob);
    
    // Make file accessible to anyone with link (optional depending on security needs)
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // Ignore if access denied, folder might already have inherited permissions
    }
    
    return {
      publicUrl: file.getDownloadUrl(),
      viewUrl: file.getUrl(),
      fileId: file.getId()
    };
  } catch (e) {
    throw new Error('Error uploading file: ' + e.message);
  }
}

function replaceFile(fileId, mimeType, base64Data) {
  try {
    const file = DriveApp.getFileById(fileId);
    const dataPart = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const blob = Utilities.newBlob(Utilities.base64Decode(dataPart), mimeType);
    
    // We can't directly set content from blob on DriveApp file in one go for binary,
    // actually file.setContent() is for text. For binary we use Drive API or we can just create a new one and delete old one,
    // but creating a new one changes the ID.
    // However, for this mock implementation, we can just create a new file and return the new ID, 
    // or use Drive REST API if enabled.
    // Let's just create a new one and trash the old one to avoid needing Advanced Services enabled.
    const folder = getOrCreateFolder('GARDA_Attachments');
    const newFile = folder.createFile(blob.setName(file.getName()));
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // Ignore sharing error
    }
    
    try {
      file.setTrashed(true);
    } catch (trashError) {
      // Ignore if cannot trash
    }
    
    return {
      publicUrl: newFile.getDownloadUrl(),
      viewUrl: newFile.getUrl(),
      fileId: newFile.getId()
    };
  } catch (e) {
    throw new Error('Error replacing file: ' + e.message);
  }
}

function downloadFileBase64(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    return {
      base64: 'data:' + blob.getContentType() + ';base64,' + base64
    };
  } catch (e) {
    throw new Error('Error downloading file: ' + e.message);
  }
}
