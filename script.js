
/* MODAL SELECTOR DE PAÍS */

document.addEventListener("DOMContentLoaded", function () {
    const modalPais = new bootstrap.Modal(
        document.getElementById("modalPais")
    );
    modalPais.show();
    document.querySelectorAll(".btn-pais").forEach(btn => {
        btn.addEventListener("click", function () {
            const pais = this.dataset.pais;
            localStorage.setItem("pais", pais);
            console.log("País seleccionado:", pais);
            modalPais.hide();
        });
    });
});

/* BOTÓN CAMBIAR PAÍS */

document.addEventListener("DOMContentLoaded", function () {
    const cambiarPais = document.getElementById("cambiarPais");
    const paisActual = document.getElementById("paisActual");
    const monedaActual = document.getElementById("monedaActual");
    const banderaActual = document.getElementById("banderaActual");
    const banderas = {
        "España": "es",
        "Estados Unidos": "us",
        "México": "mx"
    };
    function actualizarPaisNavbar() {
        const pais = localStorage.getItem("pais") || "México";
        paisActual.textContent = pais;
        const codigoPais = banderas[pais] || "mx";
        banderaActual.className = `fi fi-${codigoPais}`;
    }
    actualizarPaisNavbar();
    cambiarPais.addEventListener("click", function () {
        const modalElemento = document.getElementById("modalPais");
        const modalPais = bootstrap.Modal.getOrCreateInstance(
            modalElemento
        );
        modalPais.show();
    });
    document.querySelectorAll(".btn-pais").forEach(btn => {
        btn.addEventListener("click", function () {
            setTimeout(() => {
                actualizarPaisNavbar();
            }, 50);
        });
    });
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
        let texto = `*Hola IC DigTec!*%0A%0A`;
        texto += `*Nombre:* ${nombre}%0A`;
        if (correo) {
            texto += `*Correo:* ${correo}%0A`;
        }
        texto += `*Asunto:* ${asunto}%0A%0A`;
        texto += `*Mensaje:*%0A${mensaje}`;
        const telefono = "522221106016";
        const url = `https://wa.me/${telefono}?text=${texto}`;
        window.open(url, "_blank");
    });
});