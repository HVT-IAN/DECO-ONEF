document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    inicializarBotonCerrarSesion();
});

function actualizarNavbar() {
    const token = localStorage.getItem('token');
    const sinRegistro = document.getElementById('sinRegistro');
    const conRegistro = document.getElementById('conRegistro');

    if (!sinRegistro || !conRegistro) return; // la página no tiene este navbar

    if (token) {
        sinRegistro.classList.add('oculto');
        conRegistro.classList.remove('oculto');

        const usuario = {
            nombre: localStorage.getItem('usuarioNombre'),
            rol: localStorage.getItem('usuarioRol')
        };

        actualizarNombreUsuario(usuario.nombre);
        configurarMenuPorRol(usuario);
    } else {
        sinRegistro.classList.remove('oculto');
        conRegistro.classList.add('oculto');
    }
}

function actualizarNombreUsuario(nombre) {
    const span = document.getElementById('nombreUsuarioMenu');
    if (span && nombre) {
        span.textContent = nombre;
    }
}

/**
 * Muestra u oculta las opciones del menú desplegable según el rol.
 * Espera que el HTML tenga:
 *   <li class="item-cliente">...</li>    -> solo clientes
 *   <li class="item-decorador">...</li>  -> solo decoradores/admin
 * y usa la clase utilitaria .ocultar-por-rol (definida en cliente.css)
 * para esconder la que no corresponda.
 */
function configurarMenuPorRol(usuario) {
    const itemsCliente = document.querySelectorAll('.item-cliente');
    const itemsDecorador = document.querySelectorAll('.item-decorador');

    if (usuario.rol === 'decorador') {
        itemsCliente.forEach(item => item.classList.add('ocultar-por-rol'));
        itemsDecorador.forEach(item => item.classList.remove('ocultar-por-rol'));
    } else {
        // Cliente por defecto si el rol no es reconocido
        itemsCliente.forEach(item => item.classList.remove('ocultar-por-rol'));
        itemsDecorador.forEach(item => item.classList.add('ocultar-por-rol'));
    }
}

function inicializarBotonCerrarSesion() {
    const boton = document.getElementById('botonCerrarSesion');
    if (!boton) return;

    boton.addEventListener('click', (evento) => {
        evento.preventDefault();
        cerrarSesionSimulado(); 
        window.location.reload();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const btnMenu = document.getElementById('btnMenuMovil');
    const navbar = document.querySelector('.clienteGeneral');

    if (btnMenu && navbar) {
        btnMenu.addEventListener('click', () => {
            // Activa o desactiva la clase que muestra los enlaces
            navbar.classList.toggle('menu-abierto');
            
            // Cambia el icono visualmente (☰ a ✕)
            if(navbar.classList.contains('menu-abierto')) {
                btnMenu.innerHTML = '✕';
            } else {
                btnMenu.innerHTML = '☰';
            }
        });
    }
});