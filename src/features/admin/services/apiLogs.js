import { gasFetch } from '../../../lib/gasClient';
import { getCurrentUser } from '../../auth/services/apiAuth';

export async function fetchSystemLogs() {
    const { data, error } = await gasFetch({
        action: 'read',
        payload: {
            table: 'tbl_action_logs',
            query: {
                order: { field: 'created_at', ascending: false }
            }
        }
    });
        
    if (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
    
    // Note: since GAS doesn't join automatically, you might need to map users manually 
    // if you want to display nama_lengkap instead of user_id. 
    // We assume the frontend handles it or we send user object from GAS in a custom read function.
    return data || [];
}

export async function createSystemLog(action, description) {
    const user = await getCurrentUser();
    if (!user) return;
    
    const { error } = await gasFetch({
        action: 'insert',
        payload: {
            table: 'tbl_action_logs',
            data: {
                user_id: user.id,
                action,
                description
            }
        }
    });
        
    if (error) console.error("Error creating log:", error);
}
