/**
 * Inicializa la funcionalidad para enviar campañas de marketing.
 */
export function inicializarCampanas() {
  const btnSendMarketing = document.getElementById('btn-send-marketing');
  const btnMarketingText = document.getElementById('btn-marketing-text');
  const btnMarketingLoading = document.getElementById('btn-marketing-loading');
  const marketingSuccess = document.getElementById('marketing-success');
  const marketingTitle = document.getElementById('marketing-title');
  const marketingBody = document.getElementById('marketing-body');

  btnSendMarketing?.addEventListener('click', async () => {
    const title = marketingTitle.value.trim();
    const body = marketingBody.value.trim();

    if (!title || !body) {
      alert('Por favor, ingresa un título y un cuerpo para la notificación.');
      return;
    }

    if (!confirm('¿Estás seguro que deseas enviar esta notificación push a todos los clientes del local?')) return;

    btnSendMarketing.disabled = true;
    btnMarketingText.hidden = true;
    btnMarketingLoading.hidden = false;
    marketingSuccess.style.display = 'none';

    try {
      const res = await fetch('/api/admin/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al enviar la campaña.');

      marketingSuccess.style.display = 'block';
      marketingTitle.value = '';
      marketingBody.value = '';
      setTimeout(() => {
        marketingSuccess.style.display = 'none';
      }, 5000);
    } catch (e) {
      alert('Error al enviar la campaña: ' + e.message);
    } finally {
      btnSendMarketing.disabled = false;
      btnMarketingText.hidden = false;
      btnMarketingLoading.hidden = true;
    }
  });
}