import { inicializarBusqueda } from './busqueda.js';
import { inicializarDirectorio } from './directorio.js';
import { inicializarCampanas } from './campanas.js';
import { inicializarCiclos } from './ciclos.js';

function inicializarAdminPanel() {
  const state = { clienteActual: null };
  inicializarBusqueda(state);
  inicializarDirectorio(state);
  inicializarCampanas();
  inicializarCiclos();
}

inicializarAdminPanel();