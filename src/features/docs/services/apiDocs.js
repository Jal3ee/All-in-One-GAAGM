import { gasFetch, gasStorage } from '../../../lib/gasClient';

export const getAllDocs = async () => {
    return await gasFetch({ action: 'read', payload: { table: 'tbl_docs' } });
};

export const getAllDocTags = async () => {
    return await gasFetch({ action: 'read', payload: { table: 'tbl_doc_tags' } });
};

export const getDocTags = async (docId) => {
    return await gasFetch({ 
        action: 'read', 
        payload: { 
            table: 'tbl_doc_tags',
            query: { eq: { doc_id: docId } }
        } 
    });
};

export const getPendingUserTags = async (userId) => {
    return await gasFetch({ 
        action: 'read', 
        payload: { 
            table: 'tbl_doc_tags',
            query: { eq: { user_id: userId, status: 'pending' } }
        } 
    });
};

export const createDoc = async (title, pic, category, file) => {
    try {
        // Upload file first
        const uploadRes = await gasStorage.from('attachments').upload(file.name, file);
        if (uploadRes.error) throw new Error(uploadRes.error);
        
        const fileUrl = uploadRes.data.publicUrl;
        const fileId = uploadRes.data.fileId;

        // Insert into tbl_docs
        const docRes = await gasFetch({
            action: 'insert',
            payload: {
                table: 'tbl_docs',
                data: {
                    title,
                    pic,
                    category,
                    file_url: fileUrl,
                    file_id: fileId,
                    status: 'Pending'
                }
            }
        });
        return docRes;
    } catch (e) {
        return { data: null, error: e };
    }
};

export const addDocTags = async (docId, userIds) => {
    const tags = userIds.map(uid => ({
        doc_id: docId,
        user_id: uid,
        status: 'pending',
        config: '{}' // stringified JSON for coordinates
    }));
    return await gasFetch({
        action: 'insert',
        payload: { table: 'tbl_doc_tags', data: tags }
    });
};

export const addDocTagsWithConfig = async (docId, userId, configStr) => {
    return await gasFetch({
        action: 'insert',
        payload: { 
            table: 'tbl_doc_tags', 
            data: {
                doc_id: docId,
                user_id: userId || '',
                status: 'pending',
                config: configStr
            }
        }
    });
};

export const updateDocTag = async (tagId, data) => {
    return await gasFetch({
        action: 'update',
        payload: { table: 'tbl_doc_tags', id: tagId, data }
    });
};

export const updateDocStatus = async (docId, status) => {
    return await gasFetch({
        action: 'update',
        payload: { table: 'tbl_docs', id: docId, data: { status } }
    });
};

export const deleteDoc = async (docId) => {
    // Delete doc tags first (simplified, might fail if no tags, but ok for mock)
    // Then delete doc. In real DB use cascade.
    return await gasFetch({
        action: 'delete',
        payload: { table: 'tbl_docs', id: docId }
    });
};

export const replaceDocFile = async (docId, fileId, newFileBlob) => {
    try {
        const replaceRes = await gasStorage.from('attachments').replace(fileId, newFileBlob);
        if (replaceRes.error) throw new Error(replaceRes.error);
        
        // Update URL and FileId in tbl_docs
        await gasFetch({
            action: 'update',
            payload: {
                table: 'tbl_docs',
                id: docId,
                data: {
                    file_url: replaceRes.data.publicUrl,
                    file_id: replaceRes.data.fileId
                }
            }
        });

        return { data: replaceRes.data, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
};

export const downloadDocBase64 = async (fileId) => {
    return await gasStorage.from('attachments').download(fileId);
};
