import { gasFetch } from '../../../lib/gasClient';
import { getCurrentUser } from '../../auth/services/apiAuth';

export async function fetchNotifications() {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const { data, error } = await gasFetch({
        action: 'read',
        payload: {
            table: 'tbl_notifications',
            query: {
                eq: { user_id: user.id },
                order: { field: 'created_at', ascending: false }
            }
        }
    });
        
    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
    return data || [];
}

export async function markAsRead(id) {
    const { error } = await gasFetch({
        action: 'update',
        payload: {
            table: 'tbl_notifications',
            id: id,
            data: { is_read: true }
        }
    });
    return { error };
}

export async function createNotification(userIds, title, message, entityId) {
    if (!userIds || userIds.length === 0) return;
    
    const payload = userIds.map(id => ({
        user_id: id,
        title,
        message,
        entity_id: entityId,
        is_read: false
    }));
    
    const { error } = await gasFetch({
        action: 'insert',
        payload: {
            table: 'tbl_notifications',
            data: payload
        }
    });
        
    if (error) {
         console.error("Error creating notifications:", error);
    }
}
