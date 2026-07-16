// ==========================================
// 1. CAPA DE DATOS
// ==========================================
const EventosService = {
    async obtenerEventosCliente() {
        const correo = localStorage.getItem('usuarioCorreo');

        if (!correo) {
            return []; // sin sesión, no hay a quién filtrar
        }

        try {
            const solicitudes = await obtenerSolicitudesPorCorreo(correo);
            return solicitudes.map(mapearSolicitudATarjeta);
        } catch (error) {
            console.error('Error al obtener eventos del cliente:', error);
            return [];
        }
    }
};

function mapearSolicitudATarjeta(solicitud) {
    // Caso 1: el decorador la rechazó
    if (solicitud.estado === 'descartado') {
        return construirTarjeta(solicitud, 'Rechazado', 'rechazado', solicitud.salonDeseado || 'Por definir', '—');
    }

    // Caso 2: todavía no la revisa el decorador
    if (solicitud.estado === 'pendiente') {
        return construirTarjeta(solicitud, 'Pendiente', 'pendiente', solicitud.salonDeseado || 'Por definir', '—');
    }

    // Caso 3: aprobada -> buscamos el evento real ya creado en la agenda
    const agendaData = localStorage.getItem('deco_one_agenda_simulada');
    const eventosAgenda = agendaData ? JSON.parse(agendaData) : [];
    const eventoReal = eventosAgenda.find(e => e.solicitudId === solicitud.id);

    if (!eventoReal) {
        return construirTarjeta(solicitud, 'En proceso', 'proceso', solicitud.salonDeseado || 'Por definir', 'Decorador Asignado');
    }

    // Usamos la MISMA función que usa el panel del decorador — ya no hay dos copias divergentes
    const estadoCalculado = calcularEstadoEvento(eventoReal);
    const mapaClaseCliente = { proceso: 'proceso', curso: 'curso', terminado: 'completado' };

    return construirTarjeta(
        solicitud,
        estadoCalculado.texto,
        mapaClaseCliente[estadoCalculado.clase],
        eventoReal.salon || solicitud.salonDeseado,
        'Decorador Asignado'
    );
}

function construirTarjeta(solicitud, estadoTexto, claseEstado, salon, disenador) {
    return {
        id: solicitud.id,
        tipo: solicitud.tipoEvento,
        titulo: `${solicitud.tipoEvento} de ${solicitud.nombre}`,
        estado: estadoTexto,
        claseEstado: claseEstado,
        fechaFormateada: formatearFechaLargaCliente(solicitud.fechaEvento),
        salon: salon,
        invitados: 'Por confirmar',
        disenador: disenador,
        imagenUrl: solicitud.imagen,
        servicios: [solicitud.ideas],
        galeria: []
    };
}

function formatearFechaLargaCliente(fechaISO) {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const [anio, mes, dia] = fechaISO.split('-');
    return `${Number(dia)} de ${meses[Number(mes) - 1]} del ${anio}`;
}

// ==========================================
// 2. CAPA DE VISTA (Renderizado, filtros, resumen y Modal)
// ==========================================
const UIEventos = {
    contenedorGrid: document.getElementById('gridEventos'),
    modal: document.getElementById('modalDetalleEvento'),
    eventosActuales: [],

    renderizarTarjetas(listaEventos) {
        this.eventosActuales = listaEventos;
        this.pintarResumen(listaEventos);
        this.pintarLista(listaEventos);
        this.inicializarFiltros();
    },

    pintarLista(lista) {
        this.contenedorGrid.innerHTML = '';

        if (lista.length === 0) {
            this.contenedorGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--color-texto-opaco);">No tienes eventos registrados aún. Envía tu solicitud desde la sección de Contacto.</p>';
            return;
        }

        lista.forEach(evento => {
            const eventoJSON = encodeURIComponent(JSON.stringify(evento));
            const tarjeta = `
                <article class="tarjetaEventoCliente" data-estado="${evento.claseEstado}">
                    <div class="contenedorImagenEvento">
                        <img src="${evento.imagenUrl}" alt="${evento.titulo}" class="imagenEvento">
                        <span class="estadoEvento ${evento.claseEstado}">${evento.estado}</span>
                    </div>
                    <div class="infoEvento">
                        <h3>${evento.titulo}</h3>
                        <div class="detalleEvento"><i data-lucide="calendar"></i><span>${evento.fechaFormateada}</span></div>
                        <div class="detalleEvento"><i data-lucide="map-pin"></i><span>Salon: ${evento.salon}</span></div>
                        <button class="verDetalles" onclick="UIEventos.abrirModal('${eventoJSON}')" style="background:none; border:none; cursor:pointer;">Ver detalles &rarr;</button>
                    </div>
                </article>
            `;
            this.contenedorGrid.innerHTML += tarjeta;
        });

        if (window.lucide) lucide.createIcons();
    },

        pintarResumen(lista) {
            const completados = lista.filter(e => e.claseEstado === 'completado').length;
            const enCurso = lista.filter(e => e.claseEstado === 'curso').length;
            const proceso = lista.filter(e => e.claseEstado === 'proceso' || e.claseEstado === 'pendiente').length;

            document.getElementById('contadorCompletados').textContent = completados;
            document.getElementById('contadorProximos').textContent = enCurso; // reutiliza el pill existente para "En curso"
            document.getElementById('contadorProceso').textContent = proceso;
        },

    inicializarFiltros() {
        document.querySelectorAll('.filtroEvento').forEach(boton => {
            boton.onclick = () => {
                document.querySelectorAll('.filtroEvento').forEach(b => b.classList.remove('activo'));
                boton.classList.add('activo');

                const filtro = boton.dataset.filtro;
                const filtrado = filtro === 'todos'
                    ? this.eventosActuales
                    : this.eventosActuales.filter(e => e.claseEstado === filtro);

                this.pintarLista(filtrado);
            };
        });
    },

    abrirModal(eventoCodificado) {
        const evento = JSON.parse(decodeURIComponent(eventoCodificado));

        document.getElementById('modalImgCabecera').src = evento.imagenUrl;
        document.getElementById('modalTipoEvento').innerText = evento.tipo;
        document.getElementById('modalTituloEvento').innerText = evento.titulo;

        const etiquetaEstado = document.getElementById('modalEstadoEvento');
        etiquetaEstado.innerText = evento.estado;
        etiquetaEstado.className = `estadoEvento ${evento.claseEstado}`;

        document.getElementById('modalFecha').innerText = evento.fechaFormateada;
        document.getElementById('modalUbicacion').innerText = evento.salon;
        document.getElementById('modalInvitados').innerText = evento.invitados;

        document.getElementById('modalNombreDisenador').innerText = evento.disenador;
        document.getElementById('modalAvatarDisenador').innerText = evento.disenador.charAt(0);

        const ulServicios = document.getElementById('modalServicios');
        ulServicios.innerHTML = '';
        evento.servicios.forEach(serv => {
            ulServicios.innerHTML += `<li><i data-lucide="check-circle-2"></i> ${serv}</li>`;
        });

        const divGaleria = document.getElementById('modalGaleria');
        divGaleria.innerHTML = evento.galeria.length > 0
            ? evento.galeria.map(img => `<img src="${img}" alt="Foto galería">`).join('')
            : '<p style="color:var(--color-texto-opaco); font-size: 13px;">Las fotos estarán disponibles después del evento.</p>';

        if (window.lucide) lucide.createIcons();
        this.modal.classList.remove('oculto');
    },

    cerrarModal() {
        this.modal.classList.add('oculto');
    },

    configurarCierreModal() {
        document.getElementById('btnCerrarModal')?.addEventListener('click', () => this.cerrarModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.cerrarModal();
        });
    }
};

// ==========================================
// 3. CONTROLADOR PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    UIEventos.configurarCierreModal();
    const eventos = await EventosService.obtenerEventosCliente();
    UIEventos.renderizarTarjetas(eventos);
});
