import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const pin = url.searchParams.get('pin');

    if (!pin) {
      return new Response(JSON.stringify({ error: 'PIN requerido' }), { status: 400 });
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

    // 2. Obtener lista de todos los clientes
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
