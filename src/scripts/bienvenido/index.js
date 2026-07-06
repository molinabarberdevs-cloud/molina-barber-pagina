import { actualizarUI, generarQR } from './interfaz.js';
import { inicializarPWA } from './instalacion.js';
import { inicializarGeolocalizacion } from './geolocalizacion.js';
import { inicializarBannerPush } from './notificaciones.js';
import { inicializarTarjeta3D } from './tarjeta.js';

/**
 * Carga los datos del usuario desde la API y actualiza toda la UI.
 */
async function cargarDatosUsuario() {
  const params = new URLSearchParams(window.location.search);
  const rut = params.get('rut');
  const esNuevo = params.get('nuevo') !== 'false';
  const nombreFallback = params.get('nombre') || '';

  let userData = {
    nombre: nombreFallback,
    cortes: esNuevo ? 1 : 0,
    barberoName: '',
  };

  // Si viene un RUT, consultamos a la API para obtener los datos reales.
  if (rut) {
    try {
      const cleanRut = rut.replace(/[^0-9kK]/gi, '').toUpperCase();
      const res = await fetch(`/api/clientes/get-info?rut=${cleanRut}`);
      
      if (res.ok) {
        const clientData = await res.json();
        userData.nombre = clientData.nombre;
        userData.cortes = clientData.cortes;
        userData.barberoName = clientData.barbero || clientData.Barbero || clientData.BARBERO || 'Sin asignar';
        localStorage.setItem('userRut', cleanRut);
        
        if (esNuevo && userData.cortes === 0) {
          userData.cortes = 1;
        }
      }
    } catch (e) {
      console.error("Error cargando progreso del cliente:", e);
    }
  }

  // Actualizar toda la interfaz de usuario con los datos obtenidos.
  actualizarUI(userData, esNuevo);
  
  // Generar QR y registrar en OneSignal si hay un RUT.
  if (rut) {
    const cleanRut = rut.replace(/[^0-9kK]/gi, '').toUpperCase();
    generarQR(cleanRut, userData.barberoName);

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.login(cleanRut);
      });
    }
  }

  // Inicializar el resto de funcionalidades.
  inicializarPWA();
  inicializarBannerPush();
  inicializarGeolocalizacion();
  inicializarTarjeta3D('card-3d-bienvenido');

  // Lógica de Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('userRut');
    window.location.href = '/';
  });
}

// Ejecutar todo al cargar el DOM.
document.addEventListener('DOMContentLoaded', cargarDatosUsuario);