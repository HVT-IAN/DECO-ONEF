const CLAVE_ALMACENAMIENTO_AGENDA = 'deco_one_agenda_simulada';

function fechaRelativaISO(diasDesdeHoy) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasDesdeHoy);
    return fecha.toISOString().split('T')[0];
}

function obtenerEventosAgendaGuardados() {
    const datos = localStorage.getItem(CLAVE_ALMACENAMIENTO_AGENDA);
    if (datos) return JSON.parse(datos);
    const porDefecto = obtenerEventosAgendaPorDefecto();
    guardarEventosAgenda(porDefecto);
    return porDefecto;
}

function guardarEventosAgenda(lista) {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_AGENDA, JSON.stringify(lista));
}

/** Usada por agenda.js (vista semanal) */
async function obtenerEventosPorSemana(desde, hasta) {
    await simularRetraso(300);
    const todos = obtenerEventosAgendaGuardados();
    return todos.filter(evento => evento.fecha >= desde && evento.fecha <= hasta);
}

/** Usada por historial.js (vista mensual, con más detalle) */
async function obtenerEventosPorMes(anio, mes) {
    await simularRetraso(300);
    const todos = obtenerEventosAgendaGuardados();
    return todos.filter(evento => {
        const [a, m] = evento.fecha.split('-');
        return Number(a) === anio && Number(m) === mes + 1;
    });
}

/** Usada por historial.js cuando llega desde la Agenda con ?evento=ID */
async function obtenerEventoPorId(id) {
    await simularRetraso(200);
    const todos = obtenerEventosAgendaGuardados();
    return todos.find(evento => evento.id === Number(id)) || null;
}

async function agregarEventoAgenda(nuevoEvento) {
    await simularRetraso(300);
    const eventos = obtenerEventosAgendaGuardados();
    const nuevoId = eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1;
    const completo = { id: nuevoId, estado: 'proceso', ...nuevoEvento };
    eventos.push(completo);
    guardarEventosAgenda(eventos);
    return completo;
}
/** Función para editar un evento existente en el almacenamiento simulado */
async function editarEventoAgenda(id, datosActualizados) {
    await simularRetraso(300);
    let eventos = obtenerEventosAgendaGuardados();
    
    const indice = eventos.findIndex(e => e.id === Number(id));
    if (indice !== -1) {
        eventos[indice] = {
            ...eventos[indice],
            ...datosActualizados,
            id: Number(id), // Aseguramos mantener el ID original
            horaInicio: Number(datosActualizados.horaInicio),
            horaRecogerMaterial: Number(datosActualizados.horaRecogerMaterial)
        };
        guardarEventosAgenda(eventos);
    }
    return eventos[indice];
}

function calcularEstadoEvento(evento) {
    if (evento.estadoManual === 'curso') return { texto: 'En curso', clase: 'curso' };
    if (evento.estadoManual === 'terminado') return { texto: 'Terminado', clase: 'terminado' };

    const ahora = new Date();
    const inicio = new Date(evento.fecha + 'T00:00:00');
    inicio.setTime(inicio.getTime() + (evento.horaInicio * 60 * 60 * 1000));
    const fin = new Date(inicio.getTime() + ((evento.duracionHoras || 2) * 60 * 60 * 1000));

    if (ahora > fin) return { texto: 'Terminado', clase: 'terminado' };
    if (ahora >= inicio && ahora <= fin) return { texto: 'En curso', clase: 'curso' };
    return { texto: 'En proceso', clase: 'proceso' };
}