import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return redirect('/admin?error=Email y contraseña son requeridos');
  }

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect('/admin?error=Credenciales inválidas');
  }

  return redirect('/admin');
};