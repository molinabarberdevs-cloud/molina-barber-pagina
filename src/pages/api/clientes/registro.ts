import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre, rut, barbero, telefono, consentimiento } = body;

    // Validación básica en el servidor
    if (!nombre || nombre.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Nombre inválido' }), { status: 400 });
    }

    const cleanRut = rut ? rut.replace(/[^0-9kK]/gi, '').toUpperCase() : '';
    if (cleanRut.length < 7) {
      return new Response(JSON.stringify({ error: 'RUT inválido' }), { status: 400 });
    }

    if (!barbero) {
      return new Response(JSON.stringify({ error: 'Debe seleccionar un profesional' }), { status: 400 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), { status: 500 });
    }

    // Dar formato limpio al RUT para guardar
    const bodyRut = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    const formattedRut = `${bodyRut.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;

    // Payload para Supabase
    const payload = {
      nombre: nombre.trim(),
      rut: cleanRut,
      rut_formateado: formattedRut,
      barbero,
      telefono: telefono ? `+569${telefono.replace(/[^0-9]/g, '')}` : null,
      whatsapp_consent: telefono ? (consentimiento ? 'PENDIENTE' : 'INACTIVO') : null,
      consent_fecha: consentimiento ? new Date().toISOString() : null,
      cortes: 0,
      creado_en: new Date().toISOString()
    };

    // Hacer la petición a Supabase usando la clave del servidor
    const res = await fetch(`${supabaseUrl}/rest/v1/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation' // Retorna el registro insertado
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      
      // Control de error para llave duplicada (RUT ya registrado)
      if (errData.code === '23505') {
        return new Response(JSON.stringify({ 
          code: '23505', 
          message: 'El cliente ya se encuentra registrado.',
          rut: cleanRut
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      throw new Error(errData.message || 'Error al guardar en base de datos');
    }

    const insertedData = await res.json();

    return new Response(JSON.stringify({ success: true, client: insertedData[0] }), {
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
