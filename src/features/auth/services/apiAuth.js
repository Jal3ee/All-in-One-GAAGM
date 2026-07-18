import { gasFetch } from '../../../lib/gasClient';

export async function login(emailOrNik, password) {
    // Determine if it's an email or NIK
    const email = emailOrNik.includes('@') ? emailOrNik : `${emailOrNik}@tambang.local`;
    
    const { data, error } = await gasFetch({
        action: 'login',
        payload: {
            email,
            password
        }
    });

    if (error) return { error };

    // Save session to localStorage
    if (data?.session) {
        localStorage.setItem('garda_session', JSON.stringify(data.session));
        // Trigger a custom event so AuthContext can update state
        window.dispatchEvent(new Event('authStateChange'));
    }

    return { data };
}

export async function logout() {
    localStorage.removeItem('garda_session');
    window.dispatchEvent(new Event('authStateChange'));
    return { error: null };
}

export async function getCurrentUser() {
    const sessionStr = localStorage.getItem('garda_session');
    if (!sessionStr) return null;
    
    try {
        const session = JSON.parse(sessionStr);
        // The session from GAS already contains user info (the DB profile)
        return {
            id: session.user.id,
            email: session.user.email,
            profile: session.user
        };
    } catch (e) {
        return null;
    }
}
