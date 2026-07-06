/**
 * Mejora la reproducción de videos para que sea más suave y cinematográfica.
 */
function mejorarVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach((v) => {
    v.playbackRate = 0.7; // Un poco más lento para un efecto elegante

    v.addEventListener('timeupdate', () => {
      const timeLeft = v.duration - v.currentTime;
      if (timeLeft < 1) {
        v.style.opacity = String(timeLeft); // Fade out al final
      } else if (v.currentTime < 0.5) {
        v.style.opacity = String(Math.min(v.currentTime * 2, 1)); // Fade in al inicio
      } else {
        v.style.opacity = '1';
      }
    });
  });
}

export function inicializarExperienciaUsuario() {
  mejorarVideos();
}