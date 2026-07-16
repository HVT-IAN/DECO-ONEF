const CLAVE_ALMACENAMIENTO_USUARIOS = 'deco_one_usuarios_simulados';

function obtenerUsuariosPorDefecto() {
    return [
        {
            id: 1,
            nombre: 'Cliente Demo',
            correo: 'cliente@decoone.com',
            contraseña: '123456',
            rol: 'cliente'
        },
        {
            id: 2,
            nombre: 'Ian Decorador',
            correo: 'ADMIN@mail.com',
            contraseña: 'admin',
            rol: 'decorador'
        }
    ];
}

function obtenerUsuariosGuardados() {
    const datos = localStorage.getItem(CLAVE_ALMACENAMIENTO_USUARIOS);
    const usuariosPorDefecto = obtenerUsuariosPorDefecto();

    if (!datos) {
        // Primera vez que se usa el sitio en este navegador: crea todo desde cero
        guardarUsuarios(usuariosPorDefecto);
        return usuariosPorDefecto;
    }

    // Ya había datos guardados (de una sesión de pruebas anterior).
    // Agregamos cualquier cuenta de demostración que falte, sin borrar
    // las cuentas reales que el usuario ya haya creado (ej. registros de prueba).
    const usuariosGuardados = JSON.parse(datos);
    let seAgregoAlguna = false;

    usuariosPorDefecto.forEach(usuarioDemo => {
        const yaExiste = usuariosGuardados.some(
            u => u.correo.toLowerCase() === usuarioDemo.correo.toLowerCase()
        );
        if (!yaExiste) {
            usuariosGuardados.push(usuarioDemo);
            seAgregoAlguna = true;
        }
    });

    if (seAgregoAlguna) {
        guardarUsuarios(usuariosGuardados);
    }

    return usuariosGuardados;
}

function guardarUsuarios(listaUsuarios) {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_USUARIOS, JSON.stringify(listaUsuarios));
}

function simularRetraso(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function iniciarSesionSimulado(correo, contraseña) {
    await simularRetraso();

    const usuarios = obtenerUsuariosGuardados();
    const usuarioEncontrado = usuarios.find(
        u => u.correo.toLowerCase() === correo.toLowerCase() && u.contraseña === contraseña
    );

    if (!usuarioEncontrado) {
        throw new Error('Correo o contraseña incorrectos');
    }

    const tokenFalso = `token-simulado-${usuarioEncontrado.id}-${Date.now()}`;

    localStorage.setItem('token', tokenFalso);
    localStorage.setItem('usuarioNombre', usuarioEncontrado.nombre);
    localStorage.setItem('usuarioCorreo', usuarioEncontrado.correo);
    localStorage.setItem('usuarioRol', usuarioEncontrado.rol);

    return {
        token: tokenFalso,
        usuario: {
            id: usuarioEncontrado.id,
            nombre: usuarioEncontrado.nombre,
            correo: usuarioEncontrado.correo,
            rol: usuarioEncontrado.rol
        }
    };
}

async function registrarUsuarioSimulado(nombre, correo, contraseña, confirmarContraseña) {
    await simularRetraso();

    if (contraseña !== confirmarContraseña) {
        throw new Error('Las contraseñas no coinciden');
    }

    if (contraseña.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const usuarios = obtenerUsuariosGuardados();
    const yaExiste = usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase());

    if (yaExiste) {
        throw new Error('Ya existe una cuenta con ese correo');
    }

    const nuevoUsuario = {
        id: usuarios.length + 1,
        nombre,
        correo,
        contraseña,
        rol: 'cliente'
    };

    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);

    const tokenFalso = `token-simulado-${nuevoUsuario.id}-${Date.now()}`;

    localStorage.setItem('token', tokenFalso);
    localStorage.setItem('usuarioNombre', nuevoUsuario.nombre);
    localStorage.setItem('usuarioCorreo', nuevoUsuario.correo);
    localStorage.setItem('usuarioRol', nuevoUsuario.rol);

    return {
        token: tokenFalso,
        usuario: {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            correo: nuevoUsuario.correo,
            rol: nuevoUsuario.rol
        }
    };
}

async function recuperarContraseñaSimulado(correo) {
    await simularRetraso();

    const usuarios = obtenerUsuariosGuardados();
    const existe = usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase());

    if (!existe) {
        throw new Error('No existe ninguna cuenta con ese correo');
    }

    console.log(`[SIMULADO] Se "envió" un correo de recuperación a: ${correo}`);
    return { mensaje: 'Correo de recuperación enviado' };
}

async function verificarSesionSimulado(token) {
    await simularRetraso(200);

    if (!token || !token.startsWith('token-simulado-')) {
        throw new Error('Sesión inválida o expirada');
    }

    return { valido: true };
}

function cerrarSesionSimulado() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioNombre');
    localStorage.removeItem('usuarioCorreo');
    localStorage.removeItem('usuarioRol');
}

/*
 * NOTA: el código que revisa la sesión al cargar la página y llama a
 * configurarMenuPorRol() se movió a js/components/navbar.js, envuelto
 * en DOMContentLoaded. Este archivo solo debe contener funciones —
 * no debe ejecutar nada por sí solo al cargarse, porque se carga
 * ANTES que navbar.js y causaba un ReferenceError.
 */