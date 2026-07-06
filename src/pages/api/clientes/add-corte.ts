import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { rut } = await request.json();

    if (!rut) {
      return new Response(JSON.stringify({ error: 'RUT requerido' }), { status: 400 });
    }

    // Obtener el barbero autenticado desde el contexto (inyectado por el middleware)
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

    // 1. Obtener el cliente para saber sus cortes actuales
    const clientRes = await fetch(`${supabaseUrl}/rest/v1/clientes?select=*&rut=eq.${cleanRut}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!clientRes.ok) {
      const errText = await clientRes.text();
      throw new Error(`Error buscando cliente: ${errText}`);
    }

    const clientData = await clientRes.json();
    if (!clientData || clientData.length === 0) {
      return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), { status: 444 });
    }

    const cliente = clientData[0];
    const nuevosCortes = cliente.cortes + 1;

    // 2. Actualizar los cortes en Supabase
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/clientes?rut=eq.${cleanRut}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ 
        cortes: nuevosCortes,
        // Registrar cuál barbero hizo la última actualización (obtenido de su cuenta Google)
        barbero: barbero.nombre
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Error actualizando cortes: ${errText}`);
    }

    // 3. Enviar notificación push con OneSignal de forma segura (Server-to-Server)
    const onesignalAppId = "8aae6512-4249-479d-a04a-2a1dd6e9d193";
    const onesignalApiKey = import.meta.env.PUBLIC_ONESIGNAL_REST_API_KEY || process.env.PUBLIC_ONESIGNAL_REST_API_KEY || import.meta.env.ONESIGNAL_REST_API_KEY || process.env.ONESIGNAL_REST_API_KEY;

    if (onesignalApiKey && onesignalApiKey !== 'TU-ONESIGNAL-API-KEY') {
      try {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Basic ${onesignalApiKey}`
          },
          body: JSON.stringify({
            app_id: onesignalAppId,
            include_aliases: {
              "external_id": [cleanRut]
            },
            include_external_user_ids: [cleanRut],
            target_channel: "push",
            headings: { 
              "en": "¡Corte Registrado! 💈", 
              "es": "¡Corte Registrado! 💈" 
            },
            contents: { 
              "en": `Llevas ${nuevosCortes}/5 visitas. ¡Acercándote a tu premio!`, 
              "es": `Llevas ${nuevosCortes}/5 visitas. ¡Acercándote a tu premio!` 
            }
          })
        });
      } catch (pushErr) {
        console.error("Error enviando push a OneSignal:", pushErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cortes: nuevosCortes, 
      barbero: barbero.nombre 
    }), {
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
