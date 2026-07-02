import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, body, pin } = await request.json();

    if (!title || !body || !pin) {
      return new Response(JSON.stringify({ error: 'Título, cuerpo y PIN requeridos' }), { status: 400 });
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

    // 2. Enviar push masivo mediante OneSignal
    const onesignalAppId = "8aae6512-4249-479d-a04a-2a1dd6e9d193";
    const onesignalApiKey = import.meta.env.PUBLIC_ONESIGNAL_REST_API_KEY || process.env.PUBLIC_ONESIGNAL_REST_API_KEY || import.meta.env.ONESIGNAL_REST_API_KEY || process.env.ONESIGNAL_REST_API_KEY;

    if (!onesignalApiKey || onesignalApiKey === 'TU-ONESIGNAL-API-KEY') {
      return new Response(JSON.stringify({ error: 'Llave de API de OneSignal no configurada en el servidor' }), { status: 500 });
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${onesignalApiKey}`
      },
      body: JSON.stringify({
        app_id: onesignalAppId,
        included_segments: ["Total Subscriptions"],
        target_channel: "push",
        headings: { "en": title, "es": title },
        contents: { "en": body, "es": body }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.errors?.[0] || 'Error en OneSignal API');
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
