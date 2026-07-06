/**
 * Inicializa la animación 3D de la tarjeta VIP cuando entra en la vista.
 * @param {string} wrapperId - El ID del contenedor de la tarjeta.
 */
export function inicializarTarjeta3D(wrapperId) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  // Añadimos clases para la animación de giro y flotación
  wrap.classList.add('card-3d-wrap');

  function doSpin() {
    wrap.classList.remove('is-floating');
    wrap.classList.add('is-spinning');
    setTimeout(() => {
      wrap.classList.remove('is-spinning');
      wrap.classList.add('is-floating');
    }, 850); // Duración de la animación de giro
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        doSpin(); // Girar una vez al aparecer
        setInterval(doSpin, 6000); // Repetir el giro cada 6 segundos
        observer.unobserve(entry.target); // Dejar de observar una vez activado
      }
    });
  }, { threshold: 0.5 }); // Activar cuando el 50% de la tarjeta sea visible

  observer.observe(wrap);
}