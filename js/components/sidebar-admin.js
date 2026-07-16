function inicializarSidebar() {
    inicializarSubmenuEventos();
    marcarPaginaActiva();
}

function inicializarSubmenuEventos() {
    const boton = document.getElementById('botonSubmenuEventos');
    const submenu = document.getElementById('submenuEventos');

    boton.addEventListener('click', () => {
        submenu.classList.toggle('abierto');
        boton.classList.toggle('desplegado');
    });
}

function marcarPaginaActiva() {
    const rutaActual = window.location.pathname;
    const items = document.querySelectorAll('.item-nav[data-ruta]');

    items.forEach(item => {
        const ruta = item.dataset.ruta;
        if (rutaActual.includes(`/${ruta}/`) || rutaActual.includes(`${ruta}.html`)) {
            item.classList.add('activo');
            const submenuPadre = item.closest('.submenu-sidebar');
            if (submenuPadre) {
                submenuPadre.classList.add('abierto');
                document.getElementById('botonSubmenuEventos').classList.add('desplegado');
            }
        }
    });
}