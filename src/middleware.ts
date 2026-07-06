import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';

export const onRequest = defineMiddleware(async (context, next) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // Creamos un cliente de Supabase en el servidor
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      // Le decimos que busque las cookies de sesión que Astro guarda
      storage: {
        getItem: (key) => context.cookies.get(key)?.value || null,
        setItem: (key, value) => context.cookies.set(key, value, { path: '/' }),
        removeItem: (key) => context.cookies.delete(key, { path: '/' }),
      },
    },
  });

  // Obtenemos la sesión y el usuario completo
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  let barbero = null;

  if (user) {
    // 1. Obtener el rol desde la tabla de perfiles
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();
    
    const userRole = profile?.rol;

    // 2. Buscar si el usuario tiene un perfil de barbero asociado en la tabla de barberos
    const { data: barberoData } = await supabase
      .from('barberos')
      .select('*')
      .eq('id', user.id)
      .single();

    if (barberoData) {
      barbero = barberoData;
    }

    // 3. Determinar si tiene acceso al panel
    // Accede si es rol 'admin' o si es un 'barbero' activo asociado en la tabla 'barberos'
    if (userRole === 'admin') {
      isAdmin = true;
      if (!barbero) {
        barbero = { nombre: 'Administrador' };
      }
    } else if (userRole === 'barbero' && barbero && barbero.activo) {
      isAdmin = true;
    }
  }

  // Guardamos la información de la sesión para que esté disponible en las páginas .astro
  context.locals.session = session;
  context.locals.isLoggedIn = !!session;
  context.locals.isAdmin = isAdmin;
  // @ts-ignore
  context.locals.barbero = barbero;

  // Si el usuario intenta acceder a una ruta de API de admin y no es admin, lo bloqueamos.
  if (context.url.pathname.startsWith('/api/admin') && !context.locals.isAdmin) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  return next();
});