import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { rut } = await request.json();

    if (!rut) {
      return new Response(JSON.stringify({ error: 'RUT requerido' }), { status: 400 });
    }

    // Verificar el barbero autenticado desde locals (inyectado por el middleware)
    // @ts-ignore
    const barbero = locals.barbero;
    if (!barbero) {
      return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), { status: 401 });
    }

    const cleanRut = rut.replace(/[^0-9kK]/gi, '').toUpperCase();
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), { status: 500 });
    }

    // Eliminar el cliente en Supabase
    const res = await fetch(`${supabaseUrl}/rest/v1/clientes?rut=eq.${cleanRut}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error en Supabase: ${errText}`);
    }

    const deletedData = await res.json();

    return new Response(JSON.stringify({ success: true, client: deletedData }), {
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

export const DELETE = POST;
