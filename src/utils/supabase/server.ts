'use server';

import { createClient } from '@supabase/supabase-js';

export async function createServerSupabaseClient() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	);
}
