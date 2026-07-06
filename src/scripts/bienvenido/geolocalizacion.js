const SHOP_LAT = -33.5952064;
const SHOP_LON = -71.6102932;

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // en metros
}

/**
 * Inicializa el banner de geolocalización para mostrar la distancia al local.
 */
export function inicializarGeolocalizacion() {
  if (!navigator.geolocation) return;

  const geoBanner = document.getElementById('geo-banner');
  const geoTitle = document.getElementById('geo-title');
  const geoDesc = document.getElementById('geo-desc');
  const geoIcon = document.getElementById('geo-icon');
  const geoMapBtn = document.getElementById('geo-map-btn');

  if (!geoBanner || !geoTitle || !geoDesc || !geoIcon || !geoMapBtn) return;

  geoBanner.style.display = 'block';

  let simulatedNear = false;
  let lastPosition = null;

  function renderUI(lat, lon) {
    let distance = calcularDistancia(lat, lon, SHOP_LAT, SHOP_LON);

    if (simulatedNear) {
      distance = 12; // Forzar a 12 metros para simulación
    }

    geoMapBtn.style.display = 'block';

    if (distance < 150) {
      geoTitle.textContent = "📍 ¡Estás en la barbería!";
      geoDesc.innerHTML = `Estás a sólo <strong>${Math.round(distance)} metros</strong> de Molina's. ¡Pasa a elevar tu estilo!`;
      geoIcon.textContent = "🔥";
      geoBanner.style.borderColor = "var(--success)";
    } else {
      geoIcon.textContent = "📍";
      geoBanner.style.borderColor = "rgba(255, 215, 0, 0.15)";
      if (distance < 1000) {
        geoTitle.textContent = `📍 A ${Math.round(distance)} metros de Molina's`;
        geoDesc.textContent = "Estás muy cerca. ¡Pasa a visitarnos!";
      } else {
        const km = (distance / 1000).toFixed(1);
        geoTitle.textContent = `📍 A ${km} km de Molina's`;
        geoDesc.textContent = "Maestranza 1703, San Antonio, Chile";
      }
    }
  }

  navigator.geolocation.watchPosition((position) => {
    lastPosition = position;
    renderUI(position.coords.latitude, position.coords.longitude);
  }, (error) => {
    console.warn("Error de geolocalización:", error);
    geoTitle.textContent = "📍 Molina's Barbería Premium";
    geoDesc.textContent = "Maestranza 1703, San Antonio, Chile";
    geoMapBtn.style.display = 'block';
  }, {
    enableHighAccuracy: true
  });

  // Huevo de pascua para desarrollador: simular cercanía
  let clickCount = 0;
  geoBanner.addEventListener('click', () => {
    clickCount++;
    if (clickCount >= 5) {
      simulatedNear = !simulatedNear;
      clickCount = 0;
      alert(simulatedNear ? "🔔 [Modo Simulación] Cercanía activada." : "🔔 [Modo Simulación] Ubicación real restaurada.");
      if (lastPosition) {
        renderUI(lastPosition.coords.latitude, lastPosition.coords.longitude);
      } else {
        renderUI(SHOP_LAT, SHOP_LON); // Simular desde la tienda si no hay GPS
      }
    }
    setTimeout(() => { clickCount = 0 }, 2000); // Resetear contador
  });
}