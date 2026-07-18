import { gasFetch } from '../../../lib/gasClient';

export async function getAllEmployees() {
    const { data, error } = await gasFetch({
        action: 'read',
        payload: {
            table: 'tbl_employees',
            query: { order: { field: 'created_at', ascending: true } }
        }
    });
    return { data, error };
}

export async function createEmployee(nik, nama_lengkap, role, password) {
    const email = `${nik}@tambang.local`;
    
    const { data, error } = await gasFetch({
        action: 'insert',
        payload: {
            table: 'tbl_employees',
            data: {
                nik,
                email,
                nama_lengkap,
                role,
                password, // Store password (should be hashed on server in production)
                status: 'Aktif'
            }
        }
    });
    
    return { data, error };
}

export async function updateEmployeeStatus(id, status) {
    const { data, error } = await gasFetch({
        action: 'update',
        payload: {
            table: 'tbl_employees',
            id,
            data: { status }
        }
    });
        
    return { data, error };
}

export async function updateEmployeePassword(id, newPassword) {
    const { data, error } = await gasFetch({
        action: 'update',
        payload: {
            table: 'tbl_employees',
            id,
            data: { password: newPassword }
        }
    });
    return { data, error };
}
