import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string') {
      return new Response(JSON.stringify({ error: 'PIN requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pinLimpio = pin.trim();

    // 1. Verificar contra el PIN maestro temporal (hardcoded + variable de entorno)
    const masterPin = (
      import.meta.env.ADMIN_PIN || 
      process.env.ADMIN_PIN || 
      '6666'
    ).toString().trim();

    // Siempre aceptar '6666' como PIN maestro de respaldo
    if (pinLimpio === masterPin || pinLimpio === '6666') {
      return new Response(JSON.stringify({ valid: true, nombre: 'Administrador Master' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verificar contra la tabla 'barberos' (si existe)
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ valid: false, error: 'Configuración del servidor incompleta' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/barberos?select=nombre&pin=eq.${pinLimpio}&activo=eq.true`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return new Response(JSON.stringify({ valid: true, nombre: data[0].nombre }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // Si la tabla no existe o no encuentra al barbero, simplemente cae al PIN incorrecto
    } catch (dbErr) {
      // Si falla la consulta a la BD (tabla no existe, etc.), seguimos sin crashear
      console.error('Error consultando tabla barberos:', dbErr);
    }

    return new Response(JSON.stringify({ valid: false, error: 'PIN incorrecto o barbero inactivo' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ valid: false, error: 'Error del servidor: ' + (err.message || 'Error interno') }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
