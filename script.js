/* SELECTOR DE PAÍS */
document.addEventListener("DOMContentLoaded", function () {
    const modalElemento = document.getElementById("modalPais");
    const cambiarPais = document.getElementById("cambiarPais");
    const paisActual = document.getElementById("paisActual");
    const banderaActual = document.getElementById("banderaActual");
    const botonesPais = document.querySelectorAll(".btn-pais");
    const banderas = {
        "España": "es",
        "Estados Unidos": "us",
        "México": "mx"
    };
    const modalPais = bootstrap.Modal.getOrCreateInstance(
        modalElemento
    );
    function actualizarPaisNavbar() {
        const pais = localStorage.getItem("pais") || "México";
        const codigoPais = banderas[pais] || "mx";
        paisActual.textContent = pais;
        banderaActual.className = `fi fi-${codigoPais}`;
    }
    const paisGuardado = localStorage.getItem("pais");
    actualizarPrecios();
    if (paisGuardado) {
        actualizarPaisNavbar();
    } else {
        actualizarPaisNavbar();
        modalPais.show();
    }
    cambiarPais.addEventListener("click", function () {
        modalPais.show();
    });
    botonesPais.forEach(btn => {
        btn.addEventListener("click", function () {
            const pais = this.dataset.pais;
            const moneda = this.dataset.moneda;
            localStorage.setItem("pais", pais);
            localStorage.setItem("moneda", moneda);
            actualizarPaisNavbar();
            actualizarPrecios();
            modalPais.hide();
            console.log("País seleccionado:", pais);
            console.log("Moneda:", moneda);
        });
    });
});

/* CAMBIADOR DE PRECIOS */
function actualizarPrecios() {

    const moneda = localStorage.getItem("moneda") || "MXN";

    document.querySelectorAll(".precio").forEach(precio => {

        const valor = precio.dataset[moneda.toLowerCase()];

        if (valor) {
            precio.textContent = valor;
        }

    });

}

/* CONTADOR 0 A 100 */
document.addEventListener("DOMContentLoaded", function () {
    const contador = document.getElementById("contadorProyectos");
    const objetivo = 100;
    const duracion = 3000;
    let inicio = null;
    function animarContador(timestamp) {
        if (!inicio) {
            inicio = timestamp;
        }
        const progreso = Math.min(
            (timestamp - inicio) / duracion, 1
        );
        const valor = Math.floor(
            progreso * objetivo
        );
        contador.textContent = valor;
        if (progreso < 1) {
            requestAnimationFrame(animarContador);
        } else {
            contador.textContent = objetivo;
        }
    }
    requestAnimationFrame(animarContador);
});

/* CONTADOR DE 0 A 4.9 */
document.addEventListener("DOMContentLoaded", function () {
    const contadorCalificacion =
        document.getElementById("contadorCalificacion");
    const objetivo = 4.9;
    const duracion = 3000;
    let inicio = null;
    function animarCalificacion(timestamp) {
        if (!inicio) {
            inicio = timestamp;
        }
        const progreso = Math.min(
            (timestamp - inicio) / duracion, 1
        );
        const valor = progreso * objetivo;
        contadorCalificacion.textContent = valor.toFixed(1);
        if (progreso < 1) {
            requestAnimationFrame(animarCalificacion);
        } else {
            contadorCalificacion.textContent = objetivo.toFixed(1);
        }
    }
    requestAnimationFrame(animarCalificacion);
});

/* FORMULARIO DE CONTACTO */
document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("formContacto");
    formulario.addEventListener("submit", function (e) {
        e.preventDefault();
        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const asunto = document.getElementById("asunto").value.trim();
        const mensaje = document.getElementById("mensaje").value.trim();
        let texto = `¡Hola *IC DigTec*!%0A%0A`;
        texto += `*Nombre:* ${nombre}%0A`;
        if (correo) {
            texto += `*Correo:* ${correo}%0A`;
        }
        texto += `*Asunto:* ${asunto}%0A`;
        texto += `*Mensaje:* ${mensaje}`;
        const telefono = "522221106016";
        const url = `https://wa.me/${telefono}?text=${texto}.`;
        window.open(url, "_blank");
    });
});
