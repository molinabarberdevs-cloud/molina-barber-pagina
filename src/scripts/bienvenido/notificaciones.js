/**
 * Inicializa el banner inteligente para solicitar permiso de notificaciones push.
 */
export function inicializarBannerPush() {
  const banner = document.getElementById('push-consent-banner');
  const pushTitle = document.getElementById('push-title');
  const pushDesc = document.getElementById('push-desc');
  const btn = document.getElementById('btn-request-push');
  
  if (!banner || !pushTitle || !pushDesc || !btn) return;

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Si el contexto no es seguro (HTTP), OneSignal no funcionará. Mostramos una vista previa.
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    banner.style.display = 'block';
    pushTitle.textContent = "🔔 Notificaciones (Vista Previa)";
    pushDesc.textContent = "Las notificaciones requieren HTTPS. Así se verán en producción.";
    btn.textContent = "Entendido";
    btn.addEventListener('click', () => banner.style.display = 'none');
    return;
  }

  if (window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      
      // Función para actualizar la visibilidad y contenido del banner según permisos reales
      function actualizarEstadoBanner(permission) {
        if (permission === 'granted') {
          banner.style.display = 'none';
        } else if (permission === 'denied') {
          banner.style.display = 'block';
          pushTitle.textContent = "Notificaciones Bloqueadas 🔕";
          pushDesc.textContent = "Has denegado las notificaciones. Habilita los permisos en la configuración de tu navegador para recibir alertas.";
          btn.style.display = 'none';
        } else {
          banner.style.display = 'block';
        }
      }

      // Evaluar estado inicial
      actualizarEstadoBanner(OneSignal.Notifications.permission);

      // Escuchar cambios de permisos en tiempo real
      OneSignal.Notifications.addEventListener("permissionChange", function(permission) {
        actualizarEstadoBanner(permission);
      });

      // Lógica de clic según el sistema operativo
      if (isIOS && !isStandalone) {
        pushTitle.textContent = "Activar en iPhone 📲";
        pushDesc.textContent = "Apple requiere guardar la app primero. Toca Compartir y luego 'Añadir a inicio'.";
        btn.textContent = "Ver Instrucciones";
        btn.addEventListener('click', () => {
          document.getElementById('install-banner')?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        // En Android o iOS standalone, pedimos permiso directamente
        btn.addEventListener('click', async () => {
          try {
            await OneSignal.Notifications.requestPermission();
          } catch (e) {
            console.error("Error al solicitar permiso push:", e);
          }
        });
      }
    });
  }
}