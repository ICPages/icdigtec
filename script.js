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

/* SECCIONES DISPONIBLES ÚNICAMENTE EN MÉXICO */
document.addEventListener("DOMContentLoaded", function () {
    const secciones = document.querySelectorAll(".solo-mexico");
    if (!secciones.length) return;
    function actualizarSeccionesMexico(monedaSeleccionada) {
        const moneda = monedaSeleccionada || localStorage.getItem("moneda") || "MXN";
        secciones.forEach(seccion => {
            seccion.classList.toggle("d-none", moneda !== "MXN");
        });
    }
    actualizarSeccionesMexico();
    document.querySelectorAll(".btn-pais").forEach(boton => {
        boton.addEventListener("click", function () {
            actualizarSeccionesMexico(this.dataset.moneda);
        });
    });
    window.addEventListener("storage", function (event) {
        if (event.key === "moneda") {
            actualizarSeccionesMexico();
        }
    });
});

/* COTIZACIÓN SOPORTE TI */
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("modalCotizacion");
    const formulario = document.getElementById("formCotizacion");
    if (!modal || !formulario) return;
    const inputPlan = document.getElementById("cotPlan");
    const inputNombre = document.getElementById("cotNombre");
    const inputCorreo = document.getElementById("cotCorreo");
    const inputDispositivos = document.getElementById("cotDispositivos");
    modal.addEventListener("show.bs.modal", function (event) {
        const boton = event.relatedTarget;
        const plan = boton?.getAttribute("data-plan") || "";
        formulario.reset();
        inputPlan.value = plan ? `Plan ${plan}` : "";
    });
    formulario.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }
        const nombre = inputNombre.value.trim();
        const correo = inputCorreo.value.trim();
        const plan = inputPlan.value.trim();
        const dispositivos = Number(inputDispositivos.value);
        if (
            !nombre || !plan || !Number.isSafeInteger(dispositivos) || dispositivos < 1
        ) {
            return;
        }
        const mensaje =
            `¡Hola *IC DigTec*! Me gustaría recibir cotización sobre _${plan}_ de *Soporte TI Remoto*.\n\n` +
            `*Nombre:* ${nombre}\n` +
            `*Correo:* ${correo || "No proporcionado"}\n` +
            `*Plan:* ${plan}\n` +
            `*Número de dispositivos:* ${dispositivos}`;
        const telefono = "522221106016";
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    });
});

/* P & R*/
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        const answer = item.querySelector('.faq-answer');
        document.querySelectorAll('.faq-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        item.classList.toggle('active');
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

/* CREADORES-Y-EMPRENDEDORES.HTML */

/* REPRODUCTOR DE MUESTRA DE AUDIO */
document.addEventListener("DOMContentLoaded", function () {
    const boton = document.getElementById("btnMuestraAudio");
    const audio = document.getElementById("audioVentaPescado");
    if (!boton || !audio) return;
    const icono = boton.querySelector("i");
    boton.addEventListener("click", function () {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });
    audio.addEventListener("play", function () {
        icono.className = "bi bi-pause-fill";
        boton.setAttribute("aria-label", "Pausar muestra");
    });
    audio.addEventListener("pause", function () {
        icono.className = "bi bi-play-fill";
        boton.setAttribute("aria-label", "Escuchar muestra");
    });
});

document.querySelectorAll('[data-bs-toggle="popover"]').forEach((elemento) => {
    bootstrap.Popover.getOrCreateInstance(elemento);
});

/* FUNCIONAMIENTO DE: MODAL DE COMPRA / COTIZACIÓN */

/* FUNCIONAMIENTO DE: MODAL DE COMPRA / COTIZACIÓN */
document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("modalCompra");
    const formulario = document.getElementById("formCompra");

    if (!modal || !formulario) return;

    /* CATÁLOGO DE PRODUCTOS */
    const productos = {
        audio: {
            nombre: "Audio publicidad",
            tipo: "opciones",
            etiqueta: "Duración"
        },
        flyers: {
            nombre: "Flyers publicitarios",
            tipo: "cantidad"
        },
        miniaturas: {
            nombre: "Miniaturas para YouTube",
            tipo: "cantidad"
        },
        videos: {
            nombre: "Videos para Reels, Shorts y TikTok",
            tipo: "opciones",
            etiqueta: "Duración"
        },
        starter: {
            nombre: "Plan Despega",
            tipo: "fijo"
        },
        business: {
            nombre: "Plan Impulsa",
            tipo: "fijo"
        },
        premium: {
            nombre: "Plan Promociona",
            tipo: "fijo"
        },
        landing: {
            nombre: "Landing page",
            tipo: "mensual"
        },
        chatbot: {
            nombre: "Chatbot para tu sitio",
            tipo: "cotizar"
        },
        merch: {
            nombre: "Paquete Merch",
            tipo: "fijo"
        },
        campana: {
            nombre: "Paquete Campaña",
            tipo: "fijo"
        },

        /* SOLUCIONES TÉCNICAS */
        "conf-wifi": {
            nombre: "Configuración de Wi-Fi",
            tipo: "fijo"
        },
        "inst-programas": {
            nombre: "Instalación de programas",
            tipo: "opciones",
            etiqueta: "Programa"
        },
        "opt-sistema": {
            nombre: "Optimización de sistema",
            tipo: "fijo"
        },
        "mant-computo": {
            nombre: "Mantenimiento de equipo de cómputo",
            tipo: "opciones",
            etiqueta: "Tipo de equipo"
        },
        reparaciones: {
            nombre: "Reparaciones",
            tipo: "cotizar"
        }
    };

    /* ELEMENTOS DEL MODAL */
    const porId = id => document.getElementById(id);

    const grupoOpcion = porId("grupoOpcion");
    const grupoCantidad = porId("grupoCantidad");

    const opcion = porId("compraOpcion");
    const cantidad = porId("compraCantidad");

    const total = porId("compraTotal");
    const detalle = porId("compraDetalle");

    /* CAMPOS ADICIONALES */
    const grupoProgramaExtra = porId("grupoProgramaExtra");
    const programaExtra = porId("compraProgramaExtra");

    const grupoEquipoReparacion = porId("grupoEquipoReparacion");
    const equipoReparacion = porId("compraEquipoReparacion");
    const descripcionReparacion = porId("compraDescripcionReparacion");

    let productoActivo = null;
    let monedaTemporal = null;

    /* MONEDA SELECCIONADA */
    function monedaActual() {
        const moneda =
            monedaTemporal ||
            localStorage.getItem("moneda") ||
            "MXN";

        return ["MXN", "EUR", "USD"].includes(moneda)
            ? moneda
            : "MXN";
    }

    /* OBTENER PRECIO SEGÚN MONEDA */
    function precioVisible(elemento) {
        if (!elemento) return "";

        if (["merch", "campana"].includes(productoActivo)) {
            return elemento.dataset.mxn || "";
        }

        return elemento.dataset[
            monedaActual().toLowerCase()
        ] || "";
    }

    /* OBTENER VARIANTES DE PRODUCTO */
    function variantes(clave) {
        return Array.from(
            document.querySelectorAll(
                `.precio[data-precio-producto="${clave}"][data-precio-opcion]`
            )
        );
    }

    /* OBTENER PRECIO FIJO */
    function precioFijo(clave, tipo) {
        return document.querySelector(
            `.precio[data-precio-producto="${clave}"][data-precio-tipo="${tipo}"]`
        );
    }

    /* OBTENER NOMBRE DE VARIANTE */
    function textoVariante(elemento) {
        return elemento
            ?.closest("h5")
            ?.querySelector("span")
            ?.textContent.trim() || "";
    }

    /* PRODUCTO SELECCIONADO */
    function seleccionActual() {
        const producto = productos[productoActivo];

        if (!producto) return null;

        if (
            producto.tipo === "cantidad" ||
            producto.tipo === "opciones"
        ) {
            const selector = producto.tipo === "cantidad"
                ? cantidad
                : opcion;

            return variantes(productoActivo)[
                Number(selector.value)
            ] || null;
        }

        return producto.tipo === "cotizar"
            ? null
            : precioFijo(productoActivo, "actual");
    }

    /* IDENTIFICAR SI REQUIERE COTIZACIÓN */
    function requiereCotizacion() {
        const producto = productos[productoActivo];

        if (!producto) return false;

        if (producto.tipo === "cotizar") {
            return true;
        }

        const precio = precioVisible(
            seleccionActual()
        ).trim();

        return !precio || /^a cotizar$/i.test(precio);
    }

    /* MOSTRAR CAMPOS ADICIONALES */
    function actualizarCamposExtra() {

        /* INSTALACIÓN DE OTROS PROGRAMAS */
        const esOtroPrograma =
            productoActivo === "inst-programas" &&
            textoVariante(seleccionActual()) === "Otros Programas";

        if (grupoProgramaExtra) {
            grupoProgramaExtra.hidden = !esOtroPrograma;
        }

        if (programaExtra) {
            programaExtra.required = esOtroPrograma;
        }

        /* REPARACIONES */
        const esReparacion =
            productoActivo === "reparaciones";

        if (grupoEquipoReparacion) {
            grupoEquipoReparacion.hidden = !esReparacion;
        }

        if (equipoReparacion) {
            equipoReparacion.required = esReparacion;
        }
    }

    /* ACTUALIZAR PRECIO DEL MODAL */
    function actualizarTotalCompra() {
        const producto = productos[productoActivo];

        if (!producto) return;

        actualizarCamposExtra();

        const elegido = seleccionActual();
        const precio = precioVisible(elegido);
        const cotizar = requiereCotizacion();

        total.textContent = cotizar
            ? "A cotizar"
            : precio + (
                producto.tipo === "mensual"
                    ? " /mes"
                    : ""
            );

        porId("modalCompraTitulo").textContent = cotizar
            ? "Solicitar cotización"
            : "Solicitar servicio";

        porId("compraTextoBoton").textContent = cotizar
            ? "Solicitar cotización"
            : "Enviar solicitud";

        porId("etiquetaTotal").textContent = cotizar
            ? "Precio por confirmar"
            : "Precio total";

        if (cotizar) {
            detalle.textContent =
                "Te confirmaremos el precio de acuerdo con tu solicitud.";

        } else if (producto.tipo === "cantidad") {
            detalle.textContent =
                textoVariante(elegido) +
                " · Precio del paquete elegido";

        } else if (producto.tipo === "opciones") {
            detalle.textContent =
                textoVariante(elegido);

        } else if (producto.tipo === "mensual") {
            detalle.textContent =
                "Suscripción mensual desde el precio indicado";

        } else {
            const anticipo = precioVisible(
                precioFijo(productoActivo, "anticipo")
            );

            if (anticipo) {
                detalle.textContent = anticipo;

            } else {
                const anterior = precioVisible(
                    precioFijo(productoActivo, "antes")
                );

                const ahorro = precioVisible(
                    precioFijo(productoActivo, "ahorro")
                );

                detalle.textContent = [
                    anterior ? `Antes ${anterior}` : "",
                    ahorro
                ].filter(Boolean).join(" · ");
            }
        }
    }

    /* ACTUALIZAR OPCIONES */
    function actualizarOpciones() {
        const producto = productos[productoActivo];

        if (!producto) return;

        if (
            producto.tipo === "cantidad" ||
            producto.tipo === "opciones"
        ) {
            const selector = producto.tipo === "cantidad"
                ? cantidad
                : opcion;

            const indiceAnterior = selector.value;

            selector.replaceChildren();

            variantes(productoActivo).forEach(
                (elemento, indice) => {

                    selector.add(
                        new Option(
                            `${textoVariante(elemento)} — ${
                                precioVisible(elemento) || "A cotizar"
                            }`,
                            String(indice)
                        )
                    );
                }
            );

            if (
                indiceAnterior !== "" &&
                Number(indiceAnterior) < selector.options.length
            ) {
                selector.value = indiceAnterior;
            }
        }

        actualizarTotalCompra();
    }

    /* ABRIR MODAL */
    modal.addEventListener("show.bs.modal", function (event) {

        const clave = event.relatedTarget?.dataset.producto;

        if (
            !Object.prototype.hasOwnProperty.call(
                productos,
                clave
            )
        ) {
            event.preventDefault();
            return;
        }

        productoActivo = clave;
        monedaTemporal = null;

        const producto = productos[clave];

        formulario.reset();

        porId("compraProducto").value = producto.nombre;

        grupoCantidad.hidden =
            producto.tipo !== "cantidad";

        grupoOpcion.hidden =
            producto.tipo !== "opciones";

        grupoOpcion.querySelector("label").textContent =
            producto.etiqueta || "Duración";

        cantidad.replaceChildren();
        opcion.replaceChildren();

        actualizarOpciones();
    });

    /* CAMBIAR SELECCIÓN */
    cantidad.addEventListener(
        "change",
        actualizarTotalCompra
    );

    opcion.addEventListener(
        "change",
        actualizarTotalCompra
    );

    /* CAMBIAR MONEDA */
    document.querySelectorAll(".btn-pais").forEach(boton => {

        boton.addEventListener("click", function () {
            monedaTemporal = boton.dataset.moneda || null;
            actualizarOpciones();
        });

    });

    /* CAMBIOS DE PAÍS EN OTRAS PESTAÑAS */
    window.addEventListener("storage", function (event) {

        if (
            event.key === "pais" ||
            event.key === "moneda"
        ) {
            monedaTemporal = null;
            actualizarOpciones();
        }

    });

    /* ENVIAR PEDIDO POR WHATSAPP */
    formulario.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!formulario.reportValidity()) return;

        const producto = productos[productoActivo];

        if (!producto) return;

        const nombre = porId("compraNombre").value.trim();
        const correo = porId("compraCorreo").value.trim();

        if (!nombre) return;

        const elegido = seleccionActual();
        const cotizacion = requiereCotizacion();

        const mensaje = [
            `¡Hola *IC DigTec*! Me gustaría ${
                cotizacion
                    ? "recibir una cotización de"
                    : "solicitar"
            } _${producto.nombre}_.`,
            "",
            `*Nombre:* ${nombre}`,
            `*Correo:* ${correo || "No proporcionado"}`,
            `*País:* ${
                localStorage.getItem("pais") || "México"
            }`,
            `*Producto:* ${producto.nombre}`
        ];

        /* CANTIDAD */
        if (producto.tipo === "cantidad") {
            mensaje.push(
                `*Cantidad:* ${textoVariante(elegido)}`
            );
        }

        /* OPCIONES */
        if (producto.tipo === "opciones") {
            mensaje.push(
                `*${producto.etiqueta || "Duración"}:* ${
                    textoVariante(elegido)
                }`
            );
        }

        /* OTROS PROGRAMAS */
        if (
            productoActivo === "inst-programas" &&
            textoVariante(elegido) === "Otros Programas" &&
            programaExtra
        ) {
            mensaje.push(
                `*Programa solicitado:* ${
                    programaExtra.value.trim()
                }`
            );
        }

        /* REPARACIONES */
        if (productoActivo === "reparaciones") {

            if (equipoReparacion) {
                mensaje.push(
                    `*Equipo:* ${equipoReparacion.value}`
                );
            }

            if (descripcionReparacion?.value.trim()) {
                mensaje.push(
                    `*Problema:* ${
                        descripcionReparacion.value.trim()
                    }`
                );
            }
        }

        /* PRECIO */
        mensaje.push(
            `*Precio:* ${
                cotizacion
                    ? "A cotizar"
                    : precioVisible(elegido) +
                      (
                          producto.tipo === "mensual"
                              ? " /mes"
                              : ""
                      )
            }`
        );

        /* ANTICIPOS Y PRECIOS ANTERIORES */
        if (producto.tipo === "fijo") {

            const anticipo = precioVisible(
                precioFijo(productoActivo, "anticipo")
            );

            const anterior = precioVisible(
                precioFijo(productoActivo, "antes")
            );

            if (anticipo) {
                mensaje.push(
                    `*Anticipo:* ${
                        anticipo.replace(
                            /^Anticipo de\s*/i,
                            ""
                        )
                    }`
                );

            } else if (anterior) {
                mensaje.push(
                    `*Precio anterior:* ${anterior}`
                );
            }
        }

        /* SUSCRIPCIÓN */
        if (producto.tipo === "mensual") {
            mensaje.push(
                "*Modalidad:* Suscripción mensual"
            );
        }

        /* ABRIR WHATSAPP */
        const url =
            "https://wa.me/522221106016?text=" +
            encodeURIComponent(
                mensaje.join("\n")
            );

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    });

});


/* MODAL PERSONALIZAR PLAYERAS Y GORRAS */
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("modalPersonalizarMerch");
    const formulario = document.getElementById("formPersonalizarMerch");
    if (!modal || !formulario) return;
    const porId = id => document.getElementById(id);
    const playeras = porId("merchCantidadPlayeras");
    const gorras = porId("merchCantidadGorras");
    const valorPlayeras = porId("merchValorPlayeras");
    const valorGorras = porId("merchValorGorras");
    const totalPiezas = porId("merchTotalPiezas");
    const avisoDiseno = porId("merchAvisoDiseno");
    const mensajeError = porId("merchError");
    function valorSeleccionado(nombre) {
        return formulario.querySelector(
            `input[name="${nombre}"]:checked`
        )?.value || "";
    }
    function tallasSeleccionadas() {
        return Array.from(
            formulario.querySelectorAll('input[name="tallaPlayeras"]:checked')
        ).map(input => input.value);
    }
    const estampados = Array.from(
        formulario.querySelectorAll('input[name="estampadoPlayeras"]')
    );
    function estampadosSeleccionados() {
        return estampados
            .filter(input => input.checked)
            .map(input => input.value);
    }
    function actualizarCompatibilidadEstampados() {
        const pecho = estampados.find(input => input.value === "Pecho");
        const logo = estampados.find(input => input.value === "Logo");
        pecho.disabled = logo.checked;
        logo.disabled = pecho.checked;
    }
    estampados.forEach(input => {
        input.addEventListener("change", actualizarCompatibilidadEstampados);
    });
    function actualizarPersonalizador() {
        const cantidadPlayeras = Number(playeras.value);
        const cantidadGorras = Number(gorras.value);
        const total = cantidadPlayeras + cantidadGorras;
        valorPlayeras.textContent = cantidadPlayeras;
        valorGorras.textContent = cantidadGorras;
        totalPiezas.textContent = total;
        const necesitaDiseno =
            valorSeleccionado("disenoMerch") === "Necesita diseño";
        if (necesitaDiseno && total >= 25) {
            avisoDiseno.textContent = "¡Tu pedido incluye diseño sin costo!";
        } else if (necesitaDiseno) {
            avisoDiseno.textContent = "El diseño se cotiza por separado en pedidos menores a 25 piezas.";
        } else {
            avisoDiseno.textContent = "Diseño sin costo a partir de 25 piezas totales.";
        }
        if (total > 0) {
            mensajeError.hidden = true;
        }
        return {
            cantidadPlayeras,
            cantidadGorras,
            total
        };
    }
    playeras.addEventListener("input", actualizarPersonalizador);
    gorras.addEventListener("input", actualizarPersonalizador);
    formulario.querySelectorAll('input[name="disenoMerch"]').forEach(radio => {
        radio.addEventListener("change", actualizarPersonalizador);
    });
    modal.addEventListener("show.bs.modal", function () {
        formulario.reset();
        mensajeError.hidden = true;
        actualizarCompatibilidadEstampados();
        actualizarPersonalizador();
    });
    formulario.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!formulario.reportValidity()) return;
        const datos = actualizarPersonalizador();
        if (datos.total < 1) {
            mensajeError.textContent =
                "Selecciona al menos una playera o gorra.";
            mensajeError.hidden = false;
            playeras.focus();
            return;
        }
        if (datos.cantidadPlayeras > 0 && estampadosSeleccionados().length === 0) {
            mensajeError.textContent = "Selecciona al menos una ubicación de estampado para las playeras.";
            mensajeError.hidden = false;
            estampados[0].focus();
            return;
        }
        if (datos.cantidadPlayeras > 0 && tallasSeleccionadas().length === 0) {
            mensajeError.textContent = "Selecciona al menos una talla para las playeras.";
            mensajeError.hidden = false;
            formulario.querySelector('input[name="tallaPlayeras"]').focus();
            return;
        }
        mensajeError.hidden = true;
        const nombre = porId("merchNombre").value.trim();
        const correo = porId("merchCorreo").value.trim();
        const tieneDiseno = valorSeleccionado("disenoMerch");
        const mensaje = [
            "¡Hola *IC DigTec*! Quiero solicitar una cotización de playeras y gorras personalizadas.",
            "",
            `*Nombre:* ${nombre}`,
            `*Correo:* ${correo || "No proporcionado"}`,
            "",
            "*DETALLES DEL PEDIDO*"
        ];
        if (datos.cantidadPlayeras > 0) {
            mensaje.push(
                "",
                "*PLAYERAS*",
                `Cantidad: ${datos.cantidadPlayeras}`,
                `Color: ${valorSeleccionado("colorPlayeras")}`,
                `Estampado: ${estampadosSeleccionados().join(" + ")}`,
                `Tallas: ${tallasSeleccionadas().join(" + ")}`
            );
        }
        if (datos.cantidadGorras > 0) {
            mensaje.push(
                "",
                "*GORRAS*",
                `Cantidad: ${datos.cantidadGorras}`,
                `Color: ${valorSeleccionado("colorGorras")}`
            );
        }
        mensaje.push(
            "",
            `*Total de piezas:* ${datos.total}`,
            `*Diseño:* ${tieneDiseno}`
        );
        if (tieneDiseno === "Necesita diseño") {
            mensaje.push(
                datos.total >= 25
                    ? "*Costo del diseño:* Sin costo"
                    : "*Costo del diseño:* A cotizar"
            );
        }
        mensaje.push(
            "",
            "Quedo pendiente de la cotización. ¡Gracias!"
        );
        const url = "https://wa.me/522221106016?text=" +
            encodeURIComponent(mensaje.join("\n"));
        window.open(url, "_blank", "noopener,noreferrer");
    });
    actualizarPersonalizador();
});

