import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
 
export const prerender = false;
 
export const GET: APIRoute = async ({ cookies, redirect }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: {
        getItem: (key) => cookies.get(key)?.value || null,
        setItem: (key, value) => cookies.set(key, value, { path: '/' }),
        removeItem: (key) => cookies.delete(key, { path: '/' }),
      },
    },
  });
 
  const { error } = await supabase.auth.signOut();
 
  if (error) {
    console.error('Error during sign out:', error.message);
    // Incluso si hay un error, intentamos redirigir al usuario.
  }
 
  return redirect('/admin');
};
 
export const POST = GET;

