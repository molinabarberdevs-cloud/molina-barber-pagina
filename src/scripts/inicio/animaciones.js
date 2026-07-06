/**
 * Inicializa la animación 3D de la tarjeta cuando entra en la vista.
 * @param {string} wrapperId - El ID del contenedor de la tarjeta.
 */
function inicializarTarjeta3D(wrapperId) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  let interval = null;

  function doSpin() {
    wrap.classList.remove('is-floating');
    wrap.classList.add('is-spinning');
    setTimeout(() => {
      wrap.classList.remove('is-spinning');
      wrap.classList.add('is-floating');
    }, 850);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          doSpin();
          interval = setInterval(doSpin, 5000);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(wrap);
}

/**
 * Inicializa el scroll suave y cinematográfico para el botón "Descubrir el Club".
 */
function inicializarScrollSuave() {
  const btnClub = document.getElementById('btn-ver-club');
  btnClub?.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('club');
    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  });
}

/**
 * Orquesta todas las animaciones de la página de inicio.
 */
export function inicializarAnimaciones() {
  inicializarTarjeta3D('card-3d-index');
  inicializarScrollSuave();
}