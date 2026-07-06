import { inicializarAnimaciones } from './animaciones.js';
import { inicializarExperienciaUsuario } from './experienciaUsuario.js';

/**
 * Función principal que se ejecuta en la página de inicio.
 */
function inicializarInicio() {
  // 1. Auto-redirección si ya hay una sesión de socio iniciada
  const savedRut = localStorage.getItem('userRut');
  if (savedRut) {
    window.location.href = `/bienvenido?rut=${savedRut}&nuevo=false`;
    return; // Detenemos la ejecución para que la redirección ocurra
  }

  // 2. Inicializar todas las demás funcionalidades
  inicializarAnimaciones();
  inicializarExperienciaUsuario();
}

document.addEventListener('DOMContentLoaded', inicializarInicio);