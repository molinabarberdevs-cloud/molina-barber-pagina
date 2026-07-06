/**
 * Inicializa la funcionalidad del directorio de clientes.
 * @param {object} state - El estado compartido de la aplicación.
 */
export function inicializarDirectorio(state) {
  const btnLoadDir = document.getElementById('btn-load-dir');
  const btnLoadText = document.getElementById('btn-load-text');
  const btnLoadLoading = document.getElementById('btn-load-loading');
  const dirList = document.getElementById('dir-list');

  btnLoadDir?.addEventListener('click', async () => {
    btnLoadDir.disabled = true;
    btnLoadText.hidden = true;
    btnLoadLoading.hidden = false;
    dirList.innerHTML = '';

    try {
      const res = await fetch(`/api/clientes/list`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al cargar clientes.');
      }

      const clientes = await res.json();
      if (clientes.length === 0) {
        dirList.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No hay clientes registrados.</p>';
        return;
      }

      clientes.forEach(cliente => renderizarCliente(cliente, dirList, state));
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      btnLoadDir.disabled = false;
      btnLoadText.hidden = false;
      btnLoadLoading.hidden = true;
    }
  });
}

function renderizarCliente(cliente, container, state) {
  const div = document.createElement('div');
  div.style.cssText = 'background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:var(--r-md); padding:1rem; display:flex; align-items:center; justify-content:space-between;';

  const barberoName = cliente.barbero || cliente.Barbero || cliente.BARBERO || 'Sin asignar';
  const info = document.createElement('div');
  info.innerHTML = `
    <h4 style="font-size:1rem; color:var(--text); margin-bottom:0.2rem;">${cliente.nombre}</h4>
    <p class="mono" style="font-size:0.8rem; color:var(--text-muted);">${cliente.rut_formateado || cliente.rut}</p>
    <div style="display:flex; gap:1rem; margin-top:0.4rem; align-items:center;">
      <p style="font-size:0.8rem; color:var(--gold); font-weight:600;">Cortes: ${cliente.cortes}</p>
      <span style="font-size:0.75rem; background:rgba(255,255,255,0.1); padding:0.1rem 0.5rem; border-radius:4px; color:var(--text-subtle);">💈 ${barberoName}</span>
    </div>
  `;

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn btn-ghost';
  btnDelete.style.cssText = 'color:var(--danger); border-color:rgba(255,70,70,0.2); padding:0.5rem 1rem;';
  btnDelete.innerHTML = '🗑️ Eliminar';

  btnDelete.addEventListener('click', async () => {
    if (!confirm(`¿Estás seguro que quieres eliminar a ${cliente.nombre} para siempre?`)) return;

    btnDelete.disabled = true;
    btnDelete.innerHTML = 'Borrando...';

    try {
      const delRes = await fetch('/api/clientes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: cliente.rut }),
      });

      if (!delRes.ok) {
        const errData = await delRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al conectar con la base de datos.');
      }

      div.style.transition = 'all 0.3s ease';
      div.style.opacity = '0';
      div.style.transform = 'translateX(-20px)';
      setTimeout(() => div.remove(), 300);

      if (state.clienteActual && state.clienteActual.rut === cliente.rut) {
        document.getElementById('result-section').style.display = 'none';
        state.clienteActual = null;
      }
    } catch (e) {
      alert('Error al borrar: ' + e.message);
      btnDelete.disabled = false;
      btnDelete.innerHTML = '🗑️ Eliminar';
    }
  });

  div.appendChild(info);
  div.appendChild(btnDelete);
  container.appendChild(div);
}