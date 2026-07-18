import { gasFetch } from '../../../lib/gasClient';
import { createSystemLog } from '../../admin/services/apiLogs';
import { getCurrentUser } from '../../auth/services/apiAuth';

// Helper for generic read
async function fetchTable(table, query = {}) {
    const { data, error } = await gasFetch({
        action: 'read',
        payload: { table, query }
    });
    if (error) console.error(error);
    return data || [];
}

// === SITES ===
export async function fetchSites() {
    return await fetchTable('tbl_sites', { order: { field: 'site_name', ascending: true } });
}

export async function createSite(site_name) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_sites', data: { site_name } } });
    if (error) return { error };
    await createSystemLog('CREATE_SITE', `Menambahkan Site baru: ${site_name}`);
    return { data };
}

export async function deleteSite(id, site_name) {
    const { error } = await gasFetch({ action: 'delete', payload: { table: 'tbl_sites', id } });
    if (!error) await createSystemLog('DELETE_SITE', `Menghapus Site: ${site_name}`);
    return { error };
}

// === BUILDINGS ===
export async function fetchBuildings() {
    return await fetchTable('tbl_buildings', { order: { field: 'building_name', ascending: true } });
}

export async function createBuilding(payload) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_buildings', data: payload } });
    if (error) return { error };
    await createSystemLog('CREATE_BUILDING', `Menambahkan Bangunan baru: ${payload.building_name}`);
    return { data };
}

export async function deleteBuilding(id, building_name) {
    const { error } = await gasFetch({ action: 'delete', payload: { table: 'tbl_buildings', id } });
    if (!error) await createSystemLog('DELETE_BUILDING', `Menghapus Bangunan: ${building_name}`);
    return { error };
}

// === ROOMS ===
export async function fetchRooms() {
    return await fetchTable('tbl_rooms', { order: { field: 'room_number', ascending: true } });
}

export async function createRoom(payload) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_rooms', data: payload } });
    if (error) return { error };
    await createSystemLog('CREATE_ROOM', `Menambahkan kamar baru: ${payload.room_number}`);
    return { data };
}

export async function updateRoom(id, payload, room_number) {
    const { data, error } = await gasFetch({ action: 'update', payload: { table: 'tbl_rooms', id, data: payload } });
    if (error) return { error };
    await createSystemLog('UPDATE_ROOM', `Memperbarui status/info kamar: ${room_number || id}`);
    return { data };
}

export async function deleteRoom(id, room_number) {
    const { error } = await gasFetch({ action: 'delete', payload: { table: 'tbl_rooms', id } });
    if (!error) {
        await createSystemLog('DELETE_ROOM', `Menghapus kamar: ${room_number || id}`);
    }
    return { error };
}

// === OCCUPANCY ===
export async function fetchActiveOccupancy() {
    return await fetchTable('tbl_occupancy', { eq: { status: 'Active' } });
}

export async function checkIn(payload, room_number) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_occupancy', data: { ...payload, status: 'Active' } } });
    if (error) return { error };
    
    // Update room status
    await gasFetch({ action: 'update', payload: { table: 'tbl_rooms', id: payload.room_id, data: { status: 'Terisi' } } });
    await createSystemLog('CHECK_IN', `Check-In tamu ${payload.occupant_name} di kamar ${room_number}`);
    return { data };
}

export async function checkOut(id, room_id, room_number, occupant_name) {
    const { error } = await gasFetch({ action: 'update', payload: { table: 'tbl_occupancy', id, data: { status: 'Completed', check_out: new Date().toISOString() } } });
    if (error) return { error };
    
    // Update room status back to Kosong
    await gasFetch({ action: 'update', payload: { table: 'tbl_rooms', id: room_id, data: { status: 'Kosong' } } });
    await createSystemLog('CHECK_OUT', `Check-Out tamu ${occupant_name} dari kamar ${room_number}`);
    return { success: true };
}

// === TICKETS ===
export async function fetchTickets() {
    return await fetchTable('tbl_tickets', { order: { field: 'created_at', ascending: false } });
}

export async function createTicket(payload, room_number) {
    const user = await getCurrentUser();
    
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_tickets', data: { ...payload, reporter_id: user?.id } } });
    if (error) return { error };
    await createSystemLog('CREATE_TICKET', `Membuat keluhan baru untuk kamar ${room_number}: ${payload.title}`);
    return { data };
}

export async function updateTicketStatus(id, status, title) {
    const { error } = await gasFetch({ action: 'update', payload: { table: 'tbl_tickets', id, data: { status } } });
    if (error) return { error };
    await createSystemLog('UPDATE_TICKET', `Mengubah status keluhan "${title}" menjadi ${status}`);
    return { success: true };
}

// === INVENTORY (LOGISTIK & BHP) ===
export async function fetchInventory() {
    return await fetchTable('tbl_inventory', { order: { field: 'item_name', ascending: true } });
}

export async function mutateStock(inventory_id, type, quantity, notes, item_name) {
    // Step 1: Get current stock
    const inventoryData = await fetchTable('tbl_inventory', { eq: { id: inventory_id } });
    if (inventoryData.length === 0) return { error: { message: 'Item not found' } };
    
    const item = inventoryData[0];
    let newStock = item.stock;
    if (type === 'IN') newStock += parseInt(quantity);
    else if (type === 'OUT') newStock -= parseInt(quantity);
    else newStock = parseInt(quantity); // ADJUST overrides it

    if (newStock < 0) return { error: { message: 'Stock cannot be negative' } };

    // Step 2: Update stock
    const { error: updateErr } = await gasFetch({ action: 'update', payload: { table: 'tbl_inventory', id: inventory_id, data: { stock: newStock, last_updated: new Date().toISOString() } } });
    if (updateErr) return { error: updateErr };

    // Step 3: Insert log
    const user = await getCurrentUser();
    await gasFetch({ action: 'insert', payload: { table: 'tbl_inventory_logs', data: { inventory_id, type, quantity: parseInt(quantity), notes, user_id: user?.id } } });

    await createSystemLog('MUTATE_INVENTORY', `Mutasi (${type}) pada barang ${item_name}. Qty: ${quantity}`);
    return { success: true };
}

export async function createInventoryItem(payload) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_inventory', data: payload } });
    if (error) return { error };
    await createSystemLog('CREATE_INVENTORY', `Menambahkan barang logistik baru: ${payload.item_name}`);
    return { data };
}

// === BOOKINGS (RESERVASI RUANG UMUM) ===
export async function fetchBookings() {
    return await fetchTable('tbl_bookings', { order: { field: 'start_time', ascending: false } });
}

export async function createBooking(payload) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_bookings', data: { ...payload, status: 'Pending' } } });
    if (error) return { error };
    await createSystemLog('CREATE_BOOKING', `Reservasi baru untuk ruangan: ${payload.room_name}`);
    return { data };
}

export async function updateBookingStatus(id, status, room_name) {
    const { error } = await gasFetch({ action: 'update', payload: { table: 'tbl_bookings', id, data: { status } } });
    if (error) return { error };
    await createSystemLog('UPDATE_BOOKING', `Update status reservasi ${room_name} menjadi ${status}`);
    return { success: true };
}

// === UTILITIES (PENCATATAN UTILITAS) ===
export async function fetchUtilities() {
    return await fetchTable('tbl_utilities', { order: { field: 'period_year', ascending: false } }); // Nested ordering might need front-end support for now
}

export async function createUtilityRecord(payload) {
    const { data, error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_utilities', data: payload } });
    if (error) return { error };
    await createSystemLog('CREATE_UTILITY', `Pencatatan tagihan utilitas baru: ${payload.type} - Bulan ${payload.period_month}`);
    return { data };
}
