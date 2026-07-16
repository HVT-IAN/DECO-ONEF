
const CLAVE_ALMACENAMIENTO_SOLICITUDES = 'deco_one_solicitudes_simuladas';

function fechaRelativaISOSolicitud(diasAtras) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    return fecha.toISOString().split('T')[0];
}

function obtenerSolicitudesGuardadas() {
    const datos = localStorage.getItem(CLAVE_ALMACENAMIENTO_SOLICITUDES);
    if (datos) return JSON.parse(datos);
    const porDefecto = obtenerSolicitudesPorDefecto();
    guardarSolicitudes(porDefecto);
    return porDefecto;
}

function guardarSolicitudes(lista) {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_SOLICITUDES, JSON.stringify(lista));
}

async function obtenerSolicitudesPorMes(anio, mes) {
    await simularRetraso(300);
    const todas = obtenerSolicitudesGuardadas();
    return todas.filter(s => {
        const [a, m] = s.fechaEvento.split('-');
        return Number(a) === anio && Number(m) === mes + 1;
    });
}

/**
 * Simula: PATCH /api/admin/solicitudes/:id  { estado: 'contactado' | 'descartado' }
 */
async function actualizarEstadoSolicitud(id, nuevoEstado) {
    await simularRetraso(300);
    const solicitudes = obtenerSolicitudesGuardadas();
    const actualizadas = solicitudes.map(s =>
        s.id === id ? { ...s, estado: nuevoEstado } : s
    );
    guardarSolicitudes(actualizadas);
    return actualizadas;
}

/**
 * Se llama al llenar el formulario de faq.html — así es como
 * llegaría una solicitud nueva desde el lado público del sitio.
 */
async function crearSolicitudDesdeContacto(datosFormulario) {
    await simularRetraso(300);
    const solicitudes = obtenerSolicitudesGuardadas();
    const nuevoId = solicitudes.length > 0 ? Math.max(...solicitudes.map(s => s.id)) + 1 : 1;
    const nueva = {
        id: nuevoId,
        telefono: '-',
        estado: 'pendiente',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        imagen: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=600&q=80',
        ...datosFormulario
    };
    solicitudes.push(nueva);
    guardarSolicitudes(solicitudes);
    return nueva;
}
/**
 * Usada por misEventos.js — el cliente solo ve SUS PROPIAS solicitudes,
 * filtradas por el correo con el que las envió (o con el que inició sesión).
 */
async function obtenerSolicitudesPorCorreo(correo) {
    await simularRetraso(300);
    const todas = obtenerSolicitudesGuardadas();
    return todas.filter(s => s.correo.toLowerCase() === correo.toLowerCase());
}