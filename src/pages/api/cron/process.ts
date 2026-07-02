import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Verificación básica de seguridad.
    // Buscamos el secreto en los headers o en la URL como parámetro (?secret=...)
    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const secretQuery = url.searchParams.get('secret');
    const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && secretQuery !== cronSecret) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), { status: 500 });
    }

    // 2. Obtener el ciclo activo desde la BD
    const getRes = await fetch(`${supabaseUrl}/rest/v1/config_campanas?select=*&activo=eq.true&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!getRes.ok) {
      throw new Error('Error al conectar con la base de datos.');
    }

    const rows = await getRes.json();
    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'No hay ciclos activos para procesar.' }), { status: 200 });
    }

    const cycle = rows[0];

    // 3. Verificar si ya es hora de enviar
    let shouldSend = false;
    const ahora = new Date();

    if (!cycle.ultimo_envio) {
      // Si nunca se ha enviado, se envía ahora
      shouldSend = true;
    } else {
      const ultimoEnvio = new Date(cycle.ultimo_envio);
      const horasTranscurridas = (ahora.getTime() - ultimoEnvio.getTime()) / (1000 * 60 * 60);
      
      if (horasTranscurridas >= cycle.frecuencia_horas) {
        shouldSend = true;
      }
    }

    if (!shouldSend) {
      return new Response(JSON.stringify({ message: 'El ciclo está activo pero aún no es tiempo de enviar.', timeToWait: cycle.frecuencia_horas }), { status: 200 });
    }

    // 4. Enviar push masivo mediante OneSignal
    const onesignalAppId = "8aae6512-4249-479d-a04a-2a1dd6e9d193"; // Hardcoded en el código base original
    const onesignalApiKey = import.meta.env.PUBLIC_ONESIGNAL_REST_API_KEY || process.env.PUBLIC_ONESIGNAL_REST_API_KEY || import.meta.env.ONESIGNAL_REST_API_KEY || process.env.ONESIGNAL_REST_API_KEY;

    if (!onesignalApiKey || onesignalApiKey === 'TU-ONESIGNAL-API-KEY') {
      return new Response(JSON.stringify({ error: 'Llave de API de OneSignal no configurada' }), { status: 500 });
    }

    const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${onesignalApiKey}`
      },
      body: JSON.stringify({
        app_id: onesignalAppId,
        included_segments: ["Total Subscriptions"],
        target_channel: "push",
        headings: { "en": cycle.titulo, "es": cycle.titulo },
        contents: { "en": cycle.cuerpo, "es": cycle.cuerpo }
      })
    });

    if (!pushRes.ok) {
      const errData = await pushRes.json().catch(() => ({}));
      throw new Error(errData.errors?.[0] || 'Error en OneSignal API');
    }

    // 5. Actualizar la fecha del último envío en Supabase
    await fetch(`${supabaseUrl}/rest/v1/config_campanas?id=eq.${cycle.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ultimo_envio: ahora.toISOString()
      })
    });

    return new Response(JSON.stringify({ success: true, message: 'Notificación cíclica enviada' }), {
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
