import QRCode from 'qrcode';

/**
 * Actualiza todos los elementos de la UI con los datos del usuario.
 * @param {object} userData - Datos del usuario (nombre, cortes, etc.).
 * @param {boolean} esNuevo - Si el usuario es nuevo.
 */
export function actualizarUI(userData, esNuevo) {
  const { nombre, cortes } = userData;

  document.getElementById('user-name').textContent = nombre || 'Amigo';

  const elSub = document.getElementById('user-subtitle');
  if (elSub && !esNuevo) {
    elSub.textContent = 'Aquí tienes el resumen actualizado de tu tarjeta de lealtad.';
  }

  const MAX_CORTES = 5;
  const actuales = Math.min(cortes, MAX_CORTES);
  const faltan = MAX_CORTES - actuales;

  document.getElementById('card-count').textContent = `${actuales}/${MAX_CORTES}`;

  const elProgressDesc = document.getElementById('progress-desc');
  if (elProgressDesc) {
    if (faltan === 0) {
      elProgressDesc.innerHTML = `<strong style="color: var(--success); font-weight: 700;">¡Felicidades!</strong> Tu próximo corte es GRATIS 🎁`;
    } else if (faltan === 1) {
      elProgressDesc.innerHTML = `Solo te falta <strong style="color: var(--gold); font-weight: 700;">1 visita</strong> para tu corte gratis.`;
    } else {
      elProgressDesc.innerHTML = `Te faltan <strong style="color: var(--gold); font-weight: 700;">${faltan} visitas</strong> para tu corte gratis.`;
    }
  }

  const elProgressTrack = document.getElementById('progress-track');
  if (elProgressTrack) {
    const nodes = elProgressTrack.querySelectorAll('.progress-node');
    nodes.forEach((node, index) => {
      if (index < actuales) {
        node.classList.add('filled', 'anim-pop');
      } else {
        node.classList.remove('filled');
      }
    });
  }
}

/**
 * Genera y muestra el código QR del cliente.
 * @param {string} cleanRut - El RUT del cliente sin formato.
 * @param {string} barberoName - El nombre del barbero.
 */
export function generarQR(cleanRut, barberoName) {
  const qrContainer = document.getElementById('qr-code');
  const qrRutDisplay = document.getElementById('qr-rut-display');
  
  if (qrContainer) {
    const qrUrl = `${window.location.origin}/escaner?rut=${cleanRut}`;
    
    QRCode.toDataURL(qrUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#1a1814',
        light: '#ffffff'
      }
    }, function (err, url) {
      if (err) {
        console.error("Error al generar QR:", err);
        return;
      }
      
      const qrImg = document.createElement('img');
      qrImg.src = url;
      qrImg.alt = "Código QR de Socio";
      qrImg.style.width = "220px";
      qrImg.style.height = "220px";
      qrImg.style.borderRadius = "16px";
      
      qrContainer.innerHTML = '';
      qrContainer.appendChild(qrImg);
    });
  }
  
  if (qrRutDisplay) {
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    qrRutDisplay.textContent = `RUT: ${formatted}`;
  }

  const qrBarberoDisplay = document.getElementById('qr-barbero-display');
  if (qrBarberoDisplay && barberoName) {
    qrBarberoDisplay.style.display = 'block';
    qrBarberoDisplay.textContent = `💈 Profesional: ${barberoName}`;
  }
}