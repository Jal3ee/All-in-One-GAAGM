const GAS_WEBAPP_URL = import.meta.env.VITE_GAS_WEBAPP_URL || '';

export const gasFetch = async (payload) => {
  if (!GAS_WEBAPP_URL) {
    console.error('VITE_GAS_WEBAPP_URL is not defined in .env');
    return { data: null, error: 'Web App URL is missing' };
  }

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      // Depending on GAS settings, you might not be able to set Content-Type header to application/json
      // if it causes CORS preflight issues without proper setup. text/plain often works safely for simple requests.
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    const result = await response.json();
    if (result.status === 'success') {
      return { data: result.data, error: null };
    } else {
      return { data: null, error: result.message };
    }
  } catch (error) {
    console.error('GAS Fetch Error:', error);
    return { data: null, error: error.message };
  }
};

// Emulate a simple storage API interface
export const gasStorage = {
  from: (bucket) => ({
    upload: async (filePath, fileOrBlob) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result;
          const { data, error } = await gasFetch({
            action: 'upload',
            payload: {
              fileName: filePath,
              mimeType: fileOrBlob.type,
              base64Data: base64Data
            }
          });
          if (error) {
            resolve({ error });
          } else {
            // we attach publicUrl directly here for simplicity, although Supabase requires getPublicUrl later
            resolve({ data: { path: filePath, publicUrl: data.publicUrl, viewUrl: data.viewUrl, fileId: data.fileId }, error: null });
          }
        };
        reader.onerror = () => resolve({ error: 'Failed to read file' });
        reader.readAsDataURL(fileOrBlob);
      });
    },
    replace: async (fileId, fileOrBlob) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result;
          const { data, error } = await gasFetch({
            action: 'replace_file',
            payload: {
              fileId: fileId,
              mimeType: fileOrBlob.type,
              base64Data: base64Data
            }
          });
          if (error) {
            resolve({ error });
          } else {
            resolve({ data: { publicUrl: data.publicUrl, viewUrl: data.viewUrl, fileId: data.fileId }, error: null });
          }
        };
        reader.onerror = () => resolve({ error: 'Failed to read file' });
        reader.readAsDataURL(fileOrBlob);
      });
    },
    download: async (fileId) => {
      const { data, error } = await gasFetch({
        action: 'download_file',
        payload: { fileId }
      });
      return { data, error };
    }
  })
};
