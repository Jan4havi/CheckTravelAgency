import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	// helpful runtime warning for developer setup
	// In production, ensure env vars are provided by your deployment platform.
	// eslint-disable-next-line no-console
	console.warn('Missing Supabase env vars: REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);