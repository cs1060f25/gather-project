import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

// Parse OAuth tokens from URL hash
const parseOAuthTokens = () => {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;
    
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const providerToken = params.get('provider_token');
    
    if (accessToken && refreshToken) {
        // Store the Google provider token separately for Calendar API access
        if (providerToken) {
            localStorage.setItem('gatherly_google_token', providerToken);
            console.log('Stored Google provider token for Calendar access');
        }
        
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: params.get('expires_at') ? parseInt(params.get('expires_at')!) : undefined,
            expires_in: params.get('expires_in') ? parseInt(params.get('expires_in')!) : undefined,
            provider_token: providerToken,
            token_type: 'bearer'
        };
    }
    return null;
};

// Check if this is an OAuth callback with tokens
const oauthTokens = parseOAuthTokens();
const storageKey = supabaseUrl ? `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token` : '';

if (oauthTokens && storageKey) {
    console.log('OAuth callback detected, storing tokens...');
    
    // Clear any stale session data and store new tokens
    localStorage.removeItem(storageKey);
    localStorage.setItem(storageKey, JSON.stringify(oauthTokens));
    
    // Clean the URL immediately
    window.history.replaceState(null, '', window.location.pathname);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // We handle this manually above
        flowType: 'implicit'
    }
});

// Helper to get Google Calendar token
export const getGoogleToken = () => {
    return localStorage.getItem('gatherly_google_token');
};

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    });
    return { data, error };
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/app`,
            scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/contacts.readonly',
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        },
    });
    return { data, error };
};

export const signInWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: window.location.origin,
        },
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

