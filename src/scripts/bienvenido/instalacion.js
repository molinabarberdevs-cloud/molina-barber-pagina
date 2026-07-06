let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Evitar que Chrome muestre el prompt inmediatamente
  e.preventDefault();
  // Guardar el evento para dispararlo luego
  deferredPrompt = e;
  
  // Como estamos en Android/Desktop soportado, mostramos nuestro banner
  mostrarBannerAndroid();
});

/**
 * Inicializa la lógica para mostrar los banners de instalación de la PWA.
 */
export function inicializarPWA() {
  // Si ya está instalada (Standalone), no mostramos nada
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    return;
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  
  if (isIOS) {
    mostrarBannerIOS();
    mostrarTooltipIOS();
  }
  // En otros sistemas (como Android), esperamos al evento 'beforeinstallprompt'.
}

function mostrarBannerAndroid() {
  const banner = document.getElementById('install-banner');
  const androidUI = document.getElementById('android-install-ui');
  const btn = document.getElementById('btn-install');
  
  if (banner && androidUI && btn) {
    banner.style.display = 'block';
    androidUI.style.display = 'block';
    
    btn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          banner.style.display = 'none';
        }
        deferredPrompt = null;
      }
    });
  }
}

function mostrarBannerIOS() {
  const banner = document.getElementById('install-banner');
  const iosUI = document.getElementById('ios-install-ui');
  
  if (banner && iosUI) {
    banner.style.display = 'block';
    iosUI.style.display = 'block';
  }
}

function mostrarTooltipIOS() {
  // No mostrar si ya fue cerrada previamente
  if (localStorage.getItem('ios-tooltip-dismissed') === 'true') {
    return;
  }

  const tooltip = document.getElementById('ios-tooltip');
  const closeBtn = document.getElementById('btn-close-ios-tooltip');

  if (!tooltip || !closeBtn) return;

  // Esperar un poco para no ser tan intrusivo
  setTimeout(() => {
    tooltip.style.display = 'block';
  }, 2000);

  closeBtn.addEventListener('click', () => {
    tooltip.style.display = 'none';
    localStorage.setItem('ios-tooltip-dismissed', 'true');
  });
}