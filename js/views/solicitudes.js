const NOMBRES_MESES_SOLICITUDES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let fechaMesSolicitudes = new Date();
let solicitudSeleccionadaId = null;

document.addEventListener('DOMContentLoaded', async () => {
    inicializarNavegacionMes();
    inicializarModal();
    await cargarYPintarMes();
});

function inicializarNavegacionMes() {
    document.getElementById('botonMesAnterior').addEventListener('click', async () => {
        fechaMesSolicitudes.setMonth(fechaMesSolicitudes.getMonth() - 1);
        await cargarYPintarMes();
    });
    document.getElementById('botonMesSiguiente').addEventListener('click', async () => {
        fechaMesSolicitudes.setMonth(fechaMesSolicitudes.getMonth() + 1);
        await cargarYPintarMes();
    });
}

async function cargarYPintarMes() {
    const anio = fechaMesSolicitudes.getFullYear();
    const mes = fechaMesSolicitudes.getMonth();
    document.getElementById('etiquetaMesSolicitudes').textContent = `${NOMBRES_MESES_SOLICITUDES[mes]} ${anio}`;

    try {
        const solicitudes = await obtenerSolicitudesPorMes(anio, mes);
        pintarTarjetas(solicitudes);
        pintarContadorPendientes(solicitudes);
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

function pintarContadorPendientes(solicitudes) {
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    document.getElementById('totalPendientes').textContent = pendientes;
}

function pintarTarjetas(solicitudes) {
    const contenedor = document.getElementById('gridSolicitudes');

    if (solicitudes.length === 0) {
        contenedor.innerHTML = `<p class="mensaje-vacio-solicitudes">No hay solicitudes este mes.</p>`;
        return;
    }

    contenedor.innerHTML = solicitudes.map(s => `
        <article class="tarjeta-solicitud ${s.estado !== 'pendiente' ? 'tarjeta-resuelta' : ''}" data-id="${s.id}">
            <img src="${s.imagen}" alt="${s.nombre}" class="imagen-solicitud">
            <div class="info-solicitud">
                <div class="encabezado-solicitud">
                    <h3>${s.nombre}</h3>
                    <span class="tiempo-solicitud">${textoTiempoRelativo(s.fechaSolicitud)}</span>
                </div>
                <p class="subtitulo-solicitud">${s.tipoEvento} | ${formatearFechaCorta(s.fechaEventoDeseada)}</p>
                <p class="ideas-solicitud">"${s.ideas}"</p>
            </div>
        </article>
    `).join('');

    document.querySelectorAll('.tarjeta-solicitud').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => abrirModal(Number(tarjeta.dataset.id)));
    });
}

function formatearFechaCorta(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
}

function textoTiempoRelativo(fechaISO) {
    const hoy = new Date();
    const fecha = new Date(fechaISO + 'T00:00:00');
    const diffDias = Math.round((hoy - fecha) / (1000 * 60 * 60 * 24));

    if (diffDias <= 0) return 'Hoy';
    if (diffDias === 1) return 'Hace 1 día';
    return `Hace ${diffDias} dias`;
}

// ==========================================================
// MODAL
// ==========================================================
function inicializarModal() {
    const overlay = document.getElementById('overlayModalSolicitud');

    document.getElementById('botonCerrarModalSolicitud').addEventListener('click', cerrarModal);
    overlay.addEventListener('click', (evento) => {
        if (evento.target === overlay) cerrarModal();
    });

    document.getElementById('botonRechazarSolicitud').addEventListener('click', () => resolverSolicitud('descartado'));
    document.getElementById('botonAprobarSolicitud').addEventListener('click', () => resolverSolicitud('contactado'));
}

async function abrirModal(id) {
    const anio = fechaMesSolicitudes.getFullYear();
    const mes = fechaMesSolicitudes.getMonth();
    const solicitudes = await obtenerSolicitudesPorMes(anio, mes);
    const solicitud = solicitudes.find(s => s.id === id);
    if (!solicitud) return;

    solicitudSeleccionadaId = id;

    document.getElementById('imagenModalSolicitud').src = solicitud.imagen;
    document.getElementById('imagenModalSolicitud').alt = solicitud.nombre;
    document.getElementById('nombreModalSolicitud').textContent = solicitud.nombre;
    document.getElementById('fechaModalSolicitud').textContent = formatearFechaLarga(solicitud.fechaEventoDeseada);
    document.getElementById('salonModalSolicitud').textContent = solicitud.salonDeseado || 'Por definir';
    document.getElementById('tipoModalSolicitud').textContent = solicitud.tipoEvento;
    document.getElementById('correoModalSolicitud').textContent = solicitud.correo;
    document.getElementById('mensajeModalSolicitud').textContent = `"${solicitud.ideas}"`;

    const badge = document.getElementById('badgeEstadoModal');
    badge.textContent = textoEstadoSolicitud(solicitud.estado);
    badge.className = `badge-estado-modal badge-modal-${solicitud.estado}`;

    const botonesDisabled = solicitud.estado !== 'pendiente';
    document.getElementById('botonAprobarSolicitud').disabled = botonesDisabled;
    document.getElementById('botonRechazarSolicitud').disabled = botonesDisabled;

    document.getElementById('overlayModalSolicitud').classList.remove('oculto');
}

function cerrarModal() {
    document.getElementById('overlayModalSolicitud').classList.add('oculto');
    solicitudSeleccionadaId = null;
}

function textoEstadoSolicitud(estado) {
    const textos = { pendiente: 'Pendiente', contactado: 'Aprobada', descartado: 'Rechazada' };
    return textos[estado] || estado;
}

function formatearFechaLarga(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${Number(dia)} de ${NOMBRES_MESES_SOLICITUDES[Number(mes) - 1].toLowerCase()}, ${anio}`;
}

async function resolverSolicitud(nuevoEstado) {
    if (!solicitudSeleccionadaId) return;

    await actualizarEstadoSolicitud(solicitudSeleccionadaId, nuevoEstado);

    // Si se aprueba, la solicitud se convierte en un evento real de la agenda
    if (nuevoEstado === 'contactado') {
        const anio = fechaMesSolicitudes.getFullYear();
        const mes = fechaMesSolicitudes.getMonth();
        const solicitudes = await obtenerSolicitudesPorMes(anio, mes);
        const solicitud = solicitudes.find(s => s.id === solicitudSeleccionadaId);

        if (solicitud) {
            await agregarEventoAgenda({
                solicitudId: solicitud.id, // <--- ligado a solicitudes.id (ver id_solicitud en schema.sql)
                titulo: solicitud.nombre,
                solicitante: solicitud.nombre,
                fecha: solicitud.fechaEventoDeseada, // se vuelve "fecha_evento" definitiva al crear el evento
                horaInicio: 12,
                horaRecogerMaterial: 9,
                duracionHoras: 3,
                tipo: solicitud.tipoEvento,
                salon: solicitud.salonDeseado,
                estadoManual: 'auto',      // <--- Estado por defecto
                // presupuestoTotal arranca en 0: el admin lo captura/edita después
                // desde el detalle del evento (pantalla de edición aún por construir).
                // Es el número contra el que se van a restar los abonos registrados.
                presupuestoTotal: 0,
                materiales: [solicitud.ideas],
                imagen: solicitud.imagen
            });
        }
    }

    cerrarModal();
    await cargarYPintarMes();
}