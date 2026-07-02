import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, body, freq, active, pin } = await request.json();

    if (!title || !body || !pin || typeof freq !== 'number') {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), { status: 500 });
    }

    // 1. Validar el PIN
    let pinValido = false;
    const masterPin = import.meta.env.ADMIN_PIN || process.env.ADMIN_PIN || '6666';

    if (pin === masterPin) {
      pinValido = true;
    } else {
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/barberos?select=nombre&pin=eq.${pin}&activo=eq.true`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData && checkData.length > 0) {
          pinValido = true;
        }
      }
    }

    if (!pinValido) {
      return new Response(JSON.stringify({ error: 'No autorizado: PIN incorrecto o barbero inactivo' }), { status: 403 });
    }

    // 2. Obtener el ID del ciclo (asumimos 1 solo ciclo)
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
