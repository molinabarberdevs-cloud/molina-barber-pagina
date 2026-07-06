/**
 * Inicializa la funcionalidad para guardar ciclos de notificaciones.
 */
export function inicializarCiclos() {
  const btnSaveCycle = document.getElementById('btn-save-cycle');
  const btnCycleText = document.getElementById('btn-cycle-text');
  const btnCycleLoading = document.getElementById('btn-cycle-loading');
  const cycleSuccess = document.getElementById('cycle-success');
  const cycleTitle = document.getElementById('cycle-title');
  const cycleBody = document.getElementById('cycle-body');
  const cycleFreq = document.getElementById('cycle-freq');
  const cycleActive = document.getElementById('cycle-active');

  btnSaveCycle?.addEventListener('click', async () => {
    const title = cycleTitle.value.trim();
    const body = cycleBody.value.trim();
    const freq = parseInt(cycleFreq.value, 10);
    const active = cycleActive.checked;

    if (!title || !body) {
      alert('Por favor, ingresa un título y un cuerpo para el ciclo.');
      return;
    }

    btnSaveCycle.disabled = true;
    btnCycleText.hidden = true;
    btnCycleLoading.hidden = false;
    cycleSuccess.style.display = 'none';

    try {
      const res = await fetch('/api/admin/save-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, freq, active }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al guardar el ciclo.');

      cycleSuccess.style.display = 'block';
      setTimeout(() => {
        cycleSuccess.style.display = 'none';
      }, 5000);
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      btnSaveCycle.disabled = false;
      btnCycleText.hidden = false;
      btnCycleLoading.hidden = true;
    }
  });
}