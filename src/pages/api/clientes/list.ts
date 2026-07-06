import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Verificar el barbero autenticado desde locals (inyectado por el middleware)
    // @ts-ignore
    const barbero = locals.barbero;
    if (!barbero) {
      return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), { status: 401 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), { status: 500 });
    }

    // Obtener lista de todos los clientes
    const res = await fetch(`${supabaseUrl}/rest/v1/clientes?select=*&order=creado_en.desc`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error en Supabase: ${errText}`);
    }

    const clientes = await res.json();

    return new Response(JSON.stringify(clientes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
