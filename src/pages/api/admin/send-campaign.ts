import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { title, body } = await request.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'Título y cuerpo requeridos' }), { status: 400 });
    }

    // Verificar el barbero autenticado desde locals (inyectado por el middleware)
    // @ts-ignore
    const barbero = locals.barbero;
    if (!barbero) {
      return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), { status: 401 });
    }

    const onesignalAppId = "8aae6512-4249-479d-a04a-2a1dd6e9d193";
    const onesignalApiKey = import.meta.env.PUBLIC_ONESIGNAL_REST_API_KEY || process.env.PUBLIC_ONESIGNAL_REST_API_KEY || import.meta.env.ONESIGNAL_REST_API_KEY || process.env.ONESIGNAL_REST_API_KEY;

    if (!onesignalApiKey || onesignalApiKey === 'TU-ONESIGNAL-API-KEY') {
      return new Response(JSON.stringify({ error: 'Llave de API de OneSignal no configurada en el servidor' }), { status: 500 });
    }

    // Enviar push masivo a través de OneSignal
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
