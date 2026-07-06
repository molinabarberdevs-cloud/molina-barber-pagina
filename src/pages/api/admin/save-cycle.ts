import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { title, body, freq, active } = await request.json();

    if (!title || !body || typeof freq !== 'number') {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }

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

    // Obtener el ID del ciclo (asumimos 1 solo ciclo en la tabla config_campanas)
    const getRes = await fetch(`${supabaseUrl}/rest/v1/config_campanas?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!getRes.ok) {
      throw new Error('Error al conectar con la base de datos para obtener el ciclo.');
    }

    const rows = await getRes.json();
    if (rows.length === 0) {
      // Si no existe, lo creamos
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/config_campanas`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          titulo: title,
          cuerpo: body,
          frecuencia_horas: freq,
          activo: active
        })
      });
      if (!insertRes.ok) throw new Error('Error al insertar el ciclo.');
    } else {
      // Si existe, lo actualizamos
      const cycleId = rows[0].id;
      const patchRes = await fetch(`${supabaseUrl}/rest/v1/config_campanas?id=eq.${cycleId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: title,
          cuerpo: body,
          frecuencia_horas: freq,
          activo: active
        })
      });
      if (!patchRes.ok) throw new Error('Error al actualizar el ciclo.');
    }

    return new Response(JSON.stringify({ success: true }), {
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
