import { gasFetch } from '../../../lib/gasClient';
import { createSystemLog } from '../../admin/services/apiLogs';
import { createNotification } from '../../notifications/services/apiNotifications';

function mapToFrontend(row) {
    if (!row) return null;
    let kat = row.kategori;
    if (kat === 'Lain-lain' || kat === 'Lain lain') kat = 'Lainnya';
    
    let picArray = [];
    try {
        picArray = row.pic ? JSON.parse(row.pic) : [];
    } catch(e) {
        picArray = row.pic ? [row.pic] : [];
    }
    
    return {
        ID_Event: row.id,
        Nama_Kegiatan: row.nama_kegiatan,
        Kategori: kat,
        PIC: picArray,
        Start_Date: row.start_date,
        End_Date: row.end_date,
        Timeline_JSON: row.timeline_json ? (typeof row.timeline_json === 'string' ? row.timeline_json : JSON.stringify(row.timeline_json)) : '[]',
        Status: row.status,
        Checklist_JSON: row.checklist_json ? (typeof row.checklist_json === 'string' ? row.checklist_json : JSON.stringify(row.checklist_json)) : '[]'
    };
}

export async function fetchEvents() {
  try {
    const { data, error } = await gasFetch({
        action: 'read',
        payload: {
            table: 'tbl_events',
            query: {
                order: { field: 'start_date', ascending: true }
            }
        }
    });
        
    if (error) throw error;
    
    return data ? data.map(mapToFrontend) : [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function createEvent(payload) {
  try {
    const insertData = {
        nama_kegiatan: payload.Nama_Kegiatan,
        kategori: payload.Kategori,
        pic: Array.isArray(payload.PIC) ? JSON.stringify(payload.PIC) : JSON.stringify([payload.PIC]),
        start_date: payload.Start_Date,
        end_date: payload.End_Date,
        timeline_json: typeof payload.Timeline_JSON === 'string' ? payload.Timeline_JSON : JSON.stringify(payload.Timeline_JSON || []),
        status: 'Open',
        checklist_json: '[]'
    };

    const { data, error } = await gasFetch({
        action: 'insert',
        payload: {
            table: 'tbl_events',
            data: insertData
        }
    });
        
    if (error) throw error;
    
    // Trigger Log & Notification
    await createSystemLog('CREATE_EVENT', `Membuat kegiatan baru: ${payload.Nama_Kegiatan}`);
    
    let targetUserIds = [];
    const picArray = Array.isArray(payload.PIC) ? payload.PIC : [payload.PIC];
    
    if (picArray.includes('ALL')) {
        const { data: emps } = await gasFetch({
            action: 'read',
            payload: {
                table: 'tbl_employees',
                query: { eq: { status: 'Aktif' } }
            }
        });
        if (emps) targetUserIds = emps.map(e => e.id);
    } else if (picArray.length > 0) {
        targetUserIds = picArray;
    }
    if (targetUserIds.length > 0) {
        await createNotification(targetUserIds, 'Tugas Baru (PIC)', `Anda ditugaskan sebagai PIC untuk event: ${payload.Nama_Kegiatan}`, data.id);
    }

    return { status: 'success', data: mapToFrontend(data) };
  } catch (error) {
    console.error("Error creating event:", error);
    return null;
  }
}

export async function updateEvent(payload) {
  try {
    const id = payload.ID_Event;
    if (!id) throw new Error("ID_Event is required");

    const updateData = {};
    if (payload.Status !== undefined) updateData.status = payload.Status;
    if (payload.Checklist_JSON !== undefined) updateData.checklist_json = typeof payload.Checklist_JSON === 'string' ? payload.Checklist_JSON : JSON.stringify(payload.Checklist_JSON);
    if (payload.Timeline_JSON !== undefined) updateData.timeline_json = typeof payload.Timeline_JSON === 'string' ? payload.Timeline_JSON : JSON.stringify(payload.Timeline_JSON);
    
    // We only send keys that have values to update
    if (Object.keys(updateData).length === 0) return { status: 'success' };

    const { data, error } = await gasFetch({
        action: 'update',
        payload: {
            table: 'tbl_events',
            id: id,
            data: updateData
        }
    });

    if (error) throw error;
    
    // Trigger Log & Notification for Updates
    let changes = [];
    if (payload.Status !== undefined) changes.push(`Status menjadi ${payload.Status}`);
    if (payload.Checklist_JSON !== undefined) changes.push(`Checklist diperbarui`);
    if (payload.Timeline_JSON !== undefined) changes.push(`Timeline diperbarui`);
    
    if (changes.length > 0) {
        await createSystemLog('UPDATE_EVENT', `Memperbarui event ${data.nama_kegiatan}: ${changes.join(', ')}`);
        
        let targetUserIds = [];
        let dbPicArray = [];
        try { dbPicArray = JSON.parse(data.pic); } catch(e) { dbPicArray = data.pic ? [data.pic] : []; }

        if (dbPicArray.includes('ALL')) {
             const { data: emps } = await gasFetch({
                 action: 'read',
                 payload: {
                     table: 'tbl_employees',
                     query: { eq: { status: 'Aktif' } }
                 }
             });
             if (emps) targetUserIds = emps.map(e => e.id);
        } else if (dbPicArray.length > 0) {
             targetUserIds = dbPicArray;
        }
        
        if (targetUserIds.length > 0) {
            await createNotification(targetUserIds, 'Pembaruan Event', `Terdapat pembaruan pada event: ${data.nama_kegiatan}`, data.id);
        }
    }

    return { status: 'success', data: mapToFrontend(data) };
  } catch (error) {
    console.error("Error updating event:", error);
    return null;
  }
}
