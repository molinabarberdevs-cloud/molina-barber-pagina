import { formatRut } from './utilidades.js';

/**
 * Inicializa la funcionalidad de búsqueda de clientes y suma de cortes.
 * @param {object} state - El estado compartido de la aplicación.
 */
export function inicializarBusqueda(state) {
  const inputRut = document.getElementById('input-rut');
  const btnSearch = document.getElementById('btn-search');
  const btnSearchText = document.getElementById('btn-search-text');
  const btnSearchLoading = document.getElementById('btn-search-loading');
  const searchError = document.getElementById('search-error');
  const resultSec = document.getElementById('result-section');

  inputRut?.addEventListener('input', () => {
    inputRut.value = formatRut(inputRut.value);
  });

  btnSearch?.addEventListener('click', async () => {
    const rut = inputRut.value.trim().replace(/[^0-9kK]/gi, '').toUpperCase();
    if (rut.length < 7) {
      searchError.textContent = 'RUT inválido.';
      searchError.style.display = 'block';
      return;
    }

    searchError.style.display = 'none';
    resultSec.style.display = 'none';
    btnSearch.disabled = true;
    btnSearchText.hidden = true;
    btnSearchLoading.hidden = false;

    try {
      const res = await fetch(`/api/clientes/get-info?rut=${rut}`);
      if (res.status === 404) {
        throw new Error('Cliente no encontrado en el sistema.');
      }
      if (!res.ok) {
        throw new Error('Error al conectar con la base de datos.');
      }

      const data = await res.json();
      state.clienteActual = data;

      document.getElementById('client-name').textContent = data.nombre;
      document.getElementById('client-rut').textContent = data.rut_formateado;
      document.getElementById('client-cortes').innerHTML = `${data.cortes}<span style="font-size: 1.5rem; color: rgba(255,255,255,0.3);">/5</span>`;
      document.getElementById('add-success').style.display = 'none';

      const btnAdd = document.getElementById('btn-add');
      const btnAddText = document.getElementById('btn-add-text');
      if (data.cortes >= 5) {
        btnAdd.disabled = true;
        btnAddText.textContent = "Este cliente ya tiene 5 cortes (Premio)";
      } else {
        btnAdd.disabled = false;
        btnAddText.textContent = "+1 Sumar Corte Ahora";
      }

      resultSec.style.display = 'block';
    } catch (e) {
      searchError.textContent = e.message || 'Error de red.';
      searchError.style.display = 'block';
    } finally {
      btnSearch.disabled = false;
      btnSearchText.hidden = false;
      btnSearchLoading.hidden = true;
    }
  });

  // Lógica para sumar corte
  const btnAdd = document.getElementById('btn-add');
  const btnAddText = document.getElementById('btn-add-text');
  const btnAddLoading = document.getElementById('btn-add-loading');
  const addSuccess = document.getElementById('add-success');

  btnAdd?.addEventListener('click', async () => {
    if (!state.clienteActual) return;

    btnAdd.disabled = true;
    btnAddText.hidden = true;
    btnAddLoading.hidden = false;

    try {
      const res = await fetch('/api/clientes/add-corte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: state.clienteActual.rut }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al actualizar.');

      const nuevosCortes = resData.cortes;
      state.clienteActual.cortes = nuevosCortes;
      document.getElementById('client-cortes').innerHTML = `${nuevosCortes}<span style="font-size: 1.5rem; color: rgba(255,255,255,0.3);">/5</span>`;
      addSuccess.style.display = 'block';

      if (nuevosCortes >= 5) {
        btnAddText.textContent = "Este cliente ha alcanzado su premio (5 cortes)";
        btnAdd.disabled = true;
      } else {
        setTimeout(() => {
          btnAdd.disabled = false;
          addSuccess.style.display = 'none';
        }, 2500);
      }
    } catch (e) {
      alert('Hubo un error al guardar: ' + e.message);
      btnAdd.disabled = false;
    } finally {
      btnAddText.hidden = false;
      btnAddLoading.hidden = true;
    }
  });
}