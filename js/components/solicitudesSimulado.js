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

// ==========================================================
// A partir de aquí, cada función es candidata a reemplazarse por un
// fetch() real cuando el backend Javalin esté listo. Se mantiene el
// mismo NOMBRE y misma FIRMA en cada una, para que faq.js, solicitudes.js
// y misEventos.js no necesiten cambios cuando llegue ese momento —
// solo se reemplaza el CUERPO de la función.
// ==========================================================

async function obtenerSolicitudesPorMes(anio, mes) {
    // TODO(conexión backend): GET /api/solicitudes?anio=X&mes=Y
    await simularRetraso(300);
    const todas = obtenerSolicitudesGuardadas();
    return todas.filter(s => {
        // Renombrado de "fechaEvento" a "fechaEventoDeseada" para coincidir
        // con la tabla "solicitudes" del esquema (ver schema.sql)
        const [a, m] = s.fechaEventoDeseada.split('-');
        return Number(a) === anio && Number(m) === mes + 1;
    });
}

/**
 * Simula: PATCH /api/admin/solicitudes/:id  { estado: 'contactado' | 'descartado' }
 */
async function actualizarEstadoSolicitud(id, nuevoEstado) {
    // TODO(conexión backend): PATCH /api/admin/solicitudes/{id}  { estado: nuevoEstado }
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
 *
 * Con el backend real, el controlador Javalin que reciba este POST
 * debe: 1) buscar un usuario por "correo"; 2) si no existe, crearlo
 * con rol 'cliente' y contrasena NULL; 3) insertar la fila en
 * "solicitudes" ligada a ese id_usuario. El front no necesita saber
 * nada de esa lógica, solo manda los datos del formulario.
 */
async function crearSolicitudDesdeContacto(datosFormulario) {
    // TODO(conexión backend): POST /api/solicitudes  (body: datosFormulario)
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
 *
 * En el backend real, este filtro se resuelve con un JOIN a través de
 * id_usuario (ver schema.sql), no comparando el string de correo
 * directamente como hace esta simulación.
 */
async function obtenerSolicitudesPorCorreo(correo) {
    // TODO(conexión backend): GET /api/solicitudes/mias  (el correo se obtiene del token de sesión, no por query param)
    await simularRetraso(300);
    const todas = obtenerSolicitudesGuardadas();
    return todas.filter(s => s.correo.toLowerCase() === correo.toLowerCase());
}