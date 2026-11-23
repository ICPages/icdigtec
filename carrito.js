/* IC DigTec | Catálogo JSON + carrito de pedidos por WhatsApp.
   Las cantidades, precios y cupones se vuelven a evaluar contra servicios.json
   cada vez que se abre el sitio. Sin pasarela de cobro ni validación de servidor. */
(() => {
  'use strict';

  const RUTA_CATALOGO = './servicios.json';
  const CLAVE_ALMACENAMIENTO = 'icdigtec_carrito_v1';
  // Datos que se añaden al mensaje según el método elegido por el cliente.
  // Cambia aquí la cuenta o el enlace de cobro si IC DigTec los actualiza.
  const DATOS_PAGO = Object.freeze({
    transferencia: {
      clabe: '722969010693570149',
      beneficiario: 'Marcos Imer Coria Sánchez',
      institucion: 'Mercado Pago W'
    },
    mercadopago: {
      enlace: 'https://link.mercadopago.com.mx/icdigtec'
    }
  });
  const estado = { catalogo: null, articulos: [], cupon: '' };
  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));
  const dinero = (monto) => `${new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(monto)} MXN`;
  const redondear = (numero) => Math.round((numero + Number.EPSILON) * 100) / 100;
  const esPrecio = (numero) => typeof numero === 'number' && Number.isFinite(numero) && numero >= 0;
  const entero = (numero, max = 99) => Math.max(1, Math.min(max, Math.trunc(Number(numero) || 1)));

  function obtenerVariante(productoId, opcionId) {
    const producto = estado.catalogo?.productos?.[productoId];
    if (!producto || !Array.isArray(producto.opciones)) return null;
    const opcion = producto.opciones.find((elemento) => elemento.id === opcionId);
    return opcion ? { producto, opcion } : null;
  }

  // Descuentos por volumen: el contador representa UNIDADES, no paquetes.
  // Los precios se leen de las opciones ya existentes en servicios.json.
  function reglaPorCantidad(producto) {
    return producto?.descuentoPorCantidad || null;
  }

  function precioPorCantidad(producto, opcion, cantidad) {
    if (!esPrecio(opcion.precio)) return null;
    const regla = reglaPorCantidad(producto);
    if (!regla || opcion.id !== regla.opcionBase) return redondear(opcion.precio * cantidad);
    if (Number.isInteger(regla.cotizarDesde) && cantidad >= regla.cotizarDesde) return null;
    const especial = regla.preciosEspeciales?.[String(cantidad)];
    if (esPrecio(especial)) return redondear(especial);
    const tramos = (regla.tramos || [])
      .filter((tramo) => Number.isInteger(tramo.cantidad) && tramo.cantidad > 0 && tramo.cantidad <= cantidad)
      .sort((a, b) => b.cantidad - a.cantidad);
    const tramo = tramos[0];
    const precioTramo = producto.opciones.find((o) => o.id === tramo?.opcion)?.precio;
    if (!tramo || !esPrecio(precioTramo)) return redondear(opcion.precio * cantidad);
    // En un tramo el precio por unidad se mantiene para cantidades superiores,
    // hasta que se alcanza el siguiente tramo. Ej. 6 flyers = 6 * (1100/5).
    return redondear(cantidad * precioTramo / tramo.cantidad);
  }

  function textoCantidad(producto, cantidad) {
    const regla = reglaPorCantidad(producto);
    if (!regla) return `${cantidad} paquete(s) o servicio(s)`;
    return `${cantidad} ${cantidad === 1 ? regla.nombreUnidadSingular : regla.nombreUnidad}`;
  }

  function migrarArticulo(item) {
    const producto = estado.catalogo.productos[item.productoId];
    if (!producto) return item;
    const regla = reglaPorCantidad(producto);
    if (!regla) return item;
    // Carritos antiguos guardaban paquetes: opción 3 x cantidad 2 = 6 unidades.
    const paquete = (regla.tramos || []).find((tramo) => tramo.opcion === item.opcionId);
    if (!paquete || item.opcionId === regla.opcionBase) return item;
    return {
      ...item,
      opcionId: regla.opcionBase,
      cantidad: item.cantidad * paquete.cantidad
    };
  }

  function recuperarCarrito() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO) || '{}');
      if (Array.isArray(datos.articulos)) {
        estado.articulos = datos.articulos
          .filter((item) => item && typeof item.productoId === 'string' && typeof item.opcionId === 'string')
          .map((item) => ({
            productoId: item.productoId,
            opcionId: item.opcionId,
            cantidad: entero(item.cantidad)
          }));
      }
      if (typeof datos.cupon === 'string') estado.cupon = datos.cupon.trim().toUpperCase().slice(0, 40);
    } catch (_) {
      estado.articulos = [];
      estado.cupon = '';
    }
  }

  function guardarCarrito() {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify({
        articulos: estado.articulos, cupon: estado.cupon
      }));
    } catch (_) { /* Puede estar bloqueado en navegación privada; el carrito sigue funcionando. */ }
  }

  function normalizarCarrito() {
    const articulos = [];
    const max = entero(estado.catalogo.configuracion.cantidadMaxima || 99, 999);
    for (const antiguo of estado.articulos) {
      if (!obtenerVariante(antiguo.productoId, antiguo.opcionId)) continue;
      const item = migrarArticulo(antiguo);
      const encontrado = articulos.find((a) => a.productoId === item.productoId && a.opcionId === item.opcionId);
      if (encontrado) encontrado.cantidad = entero(encontrado.cantidad + item.cantidad, max);
      else articulos.push({ ...item, cantidad: entero(item.cantidad, max) });
    }
    estado.articulos = articulos;
    guardarCarrito();
  }

  function calcularResumen() {
    let subtotal = 0;
    let promociones = 0;
    let cotizaciones = 0;
    let estimados = 0;
    const detalles = estado.articulos.map((item) => {
      const { producto, opcion } = obtenerVariante(item.productoId, item.opcionId);
      const importe = precioPorCantidad(producto, opcion, item.cantidad);
      const cotizar = importe === null;
      // El importe se calcula ANTES de redondear el promedio unitario;
      // 3 flyers = 700 exactos, nunca 233.33 * 3 = 699.99.
      const lista = cotizar ? null :
        (esPrecio(opcion.precioAnterior) && opcion.precioAnterior > opcion.precio ? opcion.precioAnterior : opcion.precio);
      const precio = cotizar ? null : importe / item.cantidad;
      const importeLista = cotizar ? null : redondear(lista * item.cantidad);
      if (cotizar) cotizaciones++;
      else {
        subtotal += importeLista;
        promociones += importeLista - importe;
        if (opcion.estimado) estimados++;
      }
      return { item, producto, opcion, precio, lista, importe, importeLista, cotizar };
    });

    subtotal = redondear(subtotal);
    promociones = redondear(promociones);
    const despuesPromociones = redondear(subtotal - promociones);
    let descuentoCupon = 0;
    let mensajeCupon = '';
    const codigo = estado.cupon.toUpperCase();
    if (codigo) {
      const cupon = estado.catalogo.cupones?.[codigo];
      if (!cupon?.activo) mensajeCupon = 'Cupón no válido.';
      else {
        const elegible = redondear(detalles.reduce((acumulado, detalle) => {
          const permitido = !Array.isArray(cupon.productos) || cupon.productos.includes(detalle.item.productoId);
          return acumulado + (!detalle.cotizar && permitido ? detalle.importe : 0);
        }, 0));
        const minimo = esPrecio(cupon.compraMinima) ? cupon.compraMinima : 0;
        if (!elegible) mensajeCupon = 'El cupón no aplica a los servicios de este carrito.';
        else if (elegible < minimo) mensajeCupon = `Compra mínima para el cupón: ${dinero(minimo)}.`;
        else if (!esPrecio(cupon.valor)) mensajeCupon = 'Cupón no válido.';
        else if (cupon.tipo === 'porcentaje') {
          descuentoCupon = redondear(elegible * Math.min(cupon.valor, 100) / 100);
        } else if (cupon.tipo === 'fijo') {
          descuentoCupon = redondear(cupon.valor);
        } else mensajeCupon = 'Tipo de cupón no válido.';
        if (esPrecio(cupon.maximoDescuento)) {
          descuentoCupon = Math.min(descuentoCupon, cupon.maximoDescuento);
        }
        descuentoCupon = Math.min(descuentoCupon, elegible);
      }
    }
    return {
      detalles, subtotal, promociones, despuesPromociones,
      descuentoCupon: redondear(descuentoCupon),
      total: redondear(Math.max(0, despuesPromociones - descuentoCupon)),
      cotizaciones, estimados, mensajeCupon
    };
  }

  function actualizarPreciosCatalogo() {
    $$('[data-catalogo-producto]').forEach((nodo) => {
      const producto = estado.catalogo.productos[nodo.dataset.catalogoProducto];
      if (!producto) { nodo.textContent = 'No disponible'; return; }
      const indice = Number(nodo.dataset.catalogoOpcion || 0);
      const opcion = producto.opciones?.[indice];
      if (!opcion) { nodo.textContent = 'No disponible'; return; }
      const tipo = nodo.dataset.catalogoTipo || 'actual';
      if (tipo === 'antes') {
        const anterior = esPrecio(opcion.precioAnterior) && opcion.precioAnterior > opcion.precio;
        nodo.textContent = anterior ? dinero(opcion.precioAnterior) : '';
        if (nodo.closest('.plan-old-price')) nodo.closest('.plan-old-price').hidden = !anterior;
      } else if (tipo === 'ahorro') {
        const ahorro = esPrecio(opcion.precioAnterior) && esPrecio(opcion.precio)
          ? Math.max(0, opcion.precioAnterior - opcion.precio) : 0;
        nodo.textContent = ahorro ? `Ahorras ${dinero(ahorro)}` : '';
        nodo.hidden = !ahorro;
      } else {
        nodo.textContent = esPrecio(opcion.precio) ? dinero(opcion.precio) : 'A cotizar';
      }
    });
    $$('[data-catalogo-inicial]').forEach((nodo) => {
      const producto = estado.catalogo.productos[nodo.dataset.catalogoInicial];
      nodo.textContent = esPrecio(producto?.desarrolloInicialDesde)
        ? `Desarrollo inicial desde ${dinero(producto.desarrolloInicialDesde)} (no incluido en la mensualidad).`
        : 'Desarrollo inicial sujeto a cotización.';
    });
    const moneda = $('#monedaCatalogo');
    if (moneda) moneda.textContent = 'MXN';
  }

  function prepararModalProducto(productoId) {
    const producto = estado.catalogo.productos[productoId];
    if (!producto) return;
    $('#elegirProductoId').value = productoId;
    $('#elegirServicioTitulo').textContent = producto.nombre;
    const selector = $('#elegirOpcion');
    selector.replaceChildren();
    const regla = reglaPorCantidad(producto);
    const opcionesVisibles = regla
      ? producto.opciones.filter((opcion) =>
          opcion.id === regla.opcionBase || !(regla.tramos || []).some((tramo) => tramo.opcion === opcion.id))
      : producto.opciones;
    opcionesVisibles.forEach((opcion) => {
      const option = document.createElement('option');
      option.value = opcion.id;
      const titulo = regla && opcion.id === regla.opcionBase && productoId === 'inst-programas'
        ? 'Office remoto' : opcion.nombre;
      option.textContent = `${titulo} — ${esPrecio(opcion.precio) ? dinero(opcion.precio) : 'A cotizar'}`;
      selector.appendChild(option);
    });
    selector.parentElement.hidden = opcionesVisibles.length === 1;
    const cantidadLabel = document.querySelector('label[for="elegirCantidad"]');
    if (cantidadLabel) cantidadLabel.textContent = regla
      ? `Cantidad de ${regla.nombreUnidad}` : 'Cantidad de paquetes o servicios';
    $('#elegirCantidad').value = '1';
    $('#elegirCantidad').max = String(estado.catalogo.configuracion.cantidadMaxima || 99);
    $('#elegirNota').textContent = producto.nota || '';
    $('#elegirNota').hidden = !producto.nota;
    actualizarDetalleModal();
    bootstrap.Modal.getOrCreateInstance($('#modalElegirServicio')).show();
  }

  function actualizarDetalleModal() {
    const productoId = $('#elegirProductoId').value;
    const opcionId = $('#elegirOpcion').value;
    const seleccionado = obtenerVariante(productoId, opcionId);
    if (!seleccionado) return;
    const { producto, opcion } = seleccionado;
    const regla = reglaPorCantidad(producto);
    const usaUnidades = regla && opcion.id === regla.opcionBase;
    const cantidadLabel = document.querySelector('label[for="elegirCantidad"]');
    if (cantidadLabel) cantidadLabel.textContent = usaUnidades
      ? `Cantidad de ${regla.nombreUnidad}` : 'Cantidad de paquetes o servicios';
    const cantidad = entero($('#elegirCantidad').value, estado.catalogo.configuracion.cantidadMaxima || 99);
    const importe = precioPorCantidad(producto, opcion, cantidad);
    const unidad = importe === null ? null : importe / cantidad;
    const ahorro = importe === null ? 0 : redondear(opcion.precio * cantidad - importe);
    $('#elegirPrecioUnitario').textContent = unidad === null ? 'A cotizar' : dinero(redondear(unidad));
    $('#elegirTotal').textContent = importe === null ? 'A cotizar' : dinero(importe);
    $('#elegirAclaracion').textContent = opcion.estimado
      ? 'Precio desde; la tarifa final y los cargos adicionales se confirman por WhatsApp.'
      : (importe === null
          ? 'Esta cantidad se agregará como pendiente de cotización.'
          : (ahorro > 0
              ? `${textoCantidad(producto, cantidad)}: ahorras ${dinero(ahorro)}. Precio unitario promedio.`
              : (usaUnidades
                  ? `${textoCantidad(producto, cantidad)}. Se aplicarán automáticamente las tarifas por volumen.`
                  : 'Cantidad de paquetes o servicios seleccionados.')));
  }

  function agregarArticulo(productoId, opcionId, cantidad) {
    const max = estado.catalogo.configuracion.cantidadMaxima || 99;
    const existente = estado.articulos.find((item) => item.productoId === productoId && item.opcionId === opcionId);
    if (existente) existente.cantidad = entero(existente.cantidad + cantidad, max);
    else estado.articulos.push({ productoId, opcionId, cantidad: entero(cantidad, max) });
    guardarCarrito();
    dibujarCarrito();
  }

  function crear(tag, clase, texto) {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function dibujarArticulo(detalle, indice) {
    const { producto, opcion, item, precio, lista, importe, cotizar } = detalle;
    const bloque = crear('article', 'carrito-articulo');
    const cabecera = crear('div', 'carrito-articulo-cabecera');
    const titulo = crear('div');
    titulo.append(crear('strong', 'carrito-articulo-titulo', producto.nombre));
    const regla = reglaPorCantidad(producto);
    const esUnidad = regla && opcion.id === regla.opcionBase;
    titulo.append(crear('p', 'carrito-articulo-opcion', esUnidad ? textoCantidad(producto, item.cantidad) : opcion.nombre));
    cabecera.appendChild(titulo);
    const eliminar = crear('button', 'carrito-eliminar', 'Eliminar');
    eliminar.type = 'button';
    eliminar.setAttribute('aria-label', `Eliminar ${producto.nombre} - ${opcion.nombre}`);
    eliminar.addEventListener('click', () => {
      estado.articulos.splice(indice, 1);
      guardarCarrito();
      dibujarCarrito();
    });
    cabecera.appendChild(eliminar);
    bloque.appendChild(cabecera);
    const precios = crear('div', 'carrito-precios');
    if (cotizar) {
      precios.appendChild(crear('span', 'carrito-precio-final', 'Precio unitario: A cotizar'));
    } else {
      precios.appendChild(crear('span', '', `Precio unitario: ${dinero(lista)}`));
      if (lista > precio) precios.appendChild(crear('span', 'carrito-precio-descuento', `Precio con descuento: ${dinero(redondear(precio))} por unidad`));
      if (opcion.estimado) precios.appendChild(crear('small', 'carrito-estimacion', 'Precio desde; no incluye cargos adicionales.'));
    }
    bloque.appendChild(precios);
    const inferior = crear('div', 'carrito-articulo-inferior');
    const controles = crear('div', 'carrito-cantidad');
    const restar = crear('button', '', '−');
    restar.type = 'button';
    restar.disabled = item.cantidad <= 1;
    restar.setAttribute('aria-label', `Disminuir cantidad de ${producto.nombre}`);
    // Evitar que un blur del input dispare 'change' y reconstruya el carrito
    // antes de que el botón reciba su clic.
    restar.addEventListener('pointerdown', (evento) => evento.preventDefault());
    restar.addEventListener('click', () => cambiarCantidad(indice, item.cantidad - 1));
    const entrada = crear('input');
    entrada.type = 'number';
    entrada.min = '1';
    entrada.max = String(estado.catalogo.configuracion.cantidadMaxima || 99);
    entrada.step = '1';
    entrada.value = String(item.cantidad);
    entrada.setAttribute('aria-label', `Cantidad de ${producto.nombre}`);
    entrada.addEventListener('change', () => {
      const nueva = entero(entrada.value, estado.catalogo.configuracion.cantidadMaxima || 99);
      if (nueva !== item.cantidad) cambiarCantidad(indice, nueva);
    });
    const sumar = crear('button', '', '+');
    sumar.type = 'button';
    sumar.disabled = item.cantidad >= (estado.catalogo.configuracion.cantidadMaxima || 99);
    sumar.setAttribute('aria-label', `Aumentar cantidad de ${producto.nombre}`);
    sumar.addEventListener('pointerdown', (evento) => evento.preventDefault());
    sumar.addEventListener('click', () => cambiarCantidad(indice, item.cantidad + 1));
    controles.append(restar, entrada, sumar);
    inferior.appendChild(controles);
    inferior.appendChild(crear('strong', 'carrito-importe', cotizar ? 'A cotizar' : dinero(importe)));
    bloque.appendChild(inferior);
    if (producto.nota) bloque.appendChild(crear('p', 'carrito-articulo-nota', producto.nota));
    return bloque;
  }

  function cambiarCantidad(indice, cantidad) {
    const item = estado.articulos[indice];
    if (!item) return;
    item.cantidad = entero(cantidad, estado.catalogo.configuracion.cantidadMaxima || 99);
    guardarCarrito();
    dibujarCarrito();
  }

  function dibujarCarrito() {
    if (!estado.catalogo) return;
    const raiz = $('#carritoArticulos');
    raiz.replaceChildren();
    const resumen = calcularResumen();
    if (!resumen.detalles.length) {
      raiz.appendChild(crear('div', 'carrito-vacio', 'Tu carrito está vacío. Explora los servicios y agrega el que necesitas.'));
    } else {
      resumen.detalles.forEach((detalle, indice) => raiz.appendChild(dibujarArticulo(detalle, indice)));
    }

    const cantidad = estado.articulos.reduce((suma, item) => suma + item.cantidad, 0);
    $$('[data-carrito-conteo]').forEach((nodo) => { nodo.textContent = String(cantidad); });
    $('#carritoSubtotal').textContent = dinero(resumen.subtotal);
    $('#carritoDescuentoServicios').textContent = resumen.promociones ? `−${dinero(resumen.promociones)}` : dinero(0);
    $('#carritoDescuentoCupon').textContent = resumen.descuentoCupon ? `−${dinero(resumen.descuentoCupon)}` : dinero(0);
    $('#carritoTotal').textContent = resumen.detalles.length && resumen.cotizaciones === resumen.detalles.length
      ? 'A cotizar' : dinero(resumen.total);
    $('#carritoTotalEtiqueta').textContent = resumen.cotizaciones || resumen.estimados
      ? 'Total estimado con precios publicados' : 'Total después de descuentos';
    $('#carritoAclaracion').textContent = resumen.cotizaciones || resumen.estimados
      ? 'Hay servicios sin precio definido o con tarifa "desde". El total es parcial y puede variar después de cotizar.'
      : 'Importes en pesos mexicanos. El pedido se confirma directamente con IC DigTec.';
    $('#carritoAclaracion').hidden = !resumen.detalles.length;
    $('#carritoCodigoCupon').value = estado.cupon;
    const estadoCupon = $('#carritoEstadoCupon');
    estadoCupon.textContent = estado.cupon
      ? (resumen.mensajeCupon || `Cupón ${estado.cupon} aplicado: ${dinero(resumen.descuentoCupon)} de descuento.`)
      : 'Los cupones deben estar habilitados por IC DigTec.';
    estadoCupon.classList.toggle('carrito-aviso-error', Boolean(resumen.mensajeCupon));
    $('#carritoQuitarCupon').hidden = !estado.cupon;
    $('#carritoEnviar').disabled = !resumen.detalles.length;
  }

  function aplicarCupon() {
    const codigo = $('#carritoCodigoCupon').value.trim().toUpperCase().replace(/\s+/g, '').slice(0, 40);
    estado.cupon = codigo;
    guardarCarrito();
    dibujarCarrito();
  }

  function construirMensaje(nombre, correo, metodo) {
    const resumen = calcularResumen();
    const importePago = dinero(resumen.total).replace(/\s*MXN$/, '');
    const totalPorDefinir = resumen.cotizaciones > 0 || resumen.estimados > 0;
    const descuentoTotal = redondear(resumen.promociones + resumen.descuentoCupon);
    const partes = [
      '*IC DigTec | Soluc. Digitales y Técnicas*',
      '_Solicitud de Servicios_',
      '',
      `*Nombre:* ${nombre}`,
      ...(correo ? [`*Correo:* ${correo}`] : []),
      '',
      '*Detalles del carrito:*'
    ];

    resumen.detalles.forEach(({ producto, opcion, item, precio, lista, importe, cotizar }) => {
      partes.push('', `- *${producto.nombre}*`);
      const regla = reglaPorCantidad(producto);
      const usaUnidades = regla && opcion.id === regla.opcionBase;
      if (!usaUnidades) partes.push(`Opción: ${opcion.nombre}`);
      partes.push(`Cantidad: ${usaUnidades ? textoCantidad(producto, item.cantidad) : item.cantidad}`);
      if (cotizar) {
        partes.push('Precio: A cotizar');
      } else {
        partes.push(`Precio unitario: ${dinero(lista)}`);
        if (lista > precio) {
          partes.push(`Precio unitario con descuento: ${dinero(redondear(precio))}`);
        }
        partes.push(`Importe: ${dinero(importe)}`);
      }
      if (opcion.estimado) partes.push('Tarifa desde: sujeta a confirmación.');
      if (producto.nota) partes.push(`Nota: ${producto.nota}`);
    });

    partes.push('', '*Resumen:*');
    partes.push(`Subtotal: ${dinero(resumen.subtotal)}`);
    partes.push(`Descuento: -${dinero(descuentoTotal)}`);
    if (estado.cupon && resumen.descuentoCupon > 0 && !resumen.mensajeCupon) {
      partes.push(`Cupón aplicado: ${estado.cupon}`);
    } else if (estado.cupon && resumen.mensajeCupon) {
      partes.push(`Cupón ${estado.cupon}: ${resumen.mensajeCupon}`);
    }
    const totalTexto = resumen.cotizaciones === resumen.detalles.length
      ? 'A cotizar'
      : dinero(resumen.total);
    partes.push(`*${totalPorDefinir ? 'TOTAL ESTIMADO' : 'TOTAL'}: ${totalTexto}*`);
    partes.push('', `*Método de Pago:* ${metodo === 'transferencia' ? 'Transferencia bancaria' : 'Mercado Pago'}`);

    // No pedir un pago por un importe parcial o sujeto a revisión.
    if (totalPorDefinir) {
      partes.push('El monto final está pendiente de cotización o confirmación. No realices el pago hasta que IC DigTec te confirme el total.');
    } else if (resumen.total === 0) {
      partes.push('El total es $0. No es necesario realizar un pago; confirma tu solicitud con IC DigTec.');
    } else if (metodo === 'transferencia') {
      const cuenta = DATOS_PAGO.transferencia;
      partes.push(`Realiza una transferencia por *${importePago}* a los siguientes datos:`);
      partes.push(`*CLABE:* ${cuenta.clabe}`);
      partes.push(`*Beneficiario:* ${cuenta.beneficiario}`);
      partes.push(`*Institución:* ${cuenta.institucion}`);
      partes.push('', '_Verificamos el pago y procedemos a trabajar tu pedido._');
    } else if (metodo === 'mercadopago') {
      partes.push(`Ingresa al siguiente enlace e ingresa el total de tu compra *${importePago}*.`);
      partes.push(DATOS_PAGO.mercadopago.enlace);
      partes.push('', `_Verificamos el pago y procedemos a trabajar tu pedido._`);
    }
    return partes.join('\n');
  }

  async function inicializar() {
    recuperarCarrito();
    try {
      const respuesta = await fetch(RUTA_CATALOGO, { cache: 'no-store' });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      if (datos.configuracion?.moneda !== 'MXN' || !datos.productos || !Array.isArray(Object.values(datos.productos))) {
        throw new Error('Formato de servicios.json no válido');
      }
      estado.catalogo = datos;
      normalizarCarrito();
      actualizarPreciosCatalogo();
      dibujarCarrito();
    } catch (error) {
      console.error('No se pudo cargar servicios.json:', error);
      $$('[data-cart-producto]').forEach((boton) => { boton.disabled = true; });
      $$('[data-catalogo-producto]').forEach((nodo) => { nodo.textContent = 'Precio no disponible'; });
      const aviso = $('#carritoErrorCarga');
      if (aviso) {
        aviso.hidden = false;
        aviso.textContent = 'No se pudo cargar servicios.json. Verifica que esté publicado junto a index.html y abre el sitio mediante HTTP/HTTPS (no directamente como archivo local).';
      }
      return;
    }
  }

  $$('[data-cart-producto]').forEach((boton) => {
    boton.addEventListener('click', () => {
      if (estado.catalogo) prepararModalProducto(boton.dataset.cartProducto);
    });
  });
  $('#elegirOpcion').addEventListener('change', actualizarDetalleModal);
  $('#elegirCantidad').addEventListener('input', actualizarDetalleModal);
  $('#formElegirServicio').addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!estado.catalogo) return;
    const productoId = $('#elegirProductoId').value;
    const opcionId = $('#elegirOpcion').value;
    if (!obtenerVariante(productoId, opcionId)) return;
    agregarArticulo(productoId, opcionId, entero($('#elegirCantidad').value, estado.catalogo.configuracion.cantidadMaxima || 99));
    const modal = $('#modalElegirServicio');
    modal.addEventListener('hidden.bs.modal', () => bootstrap.Offcanvas.getOrCreateInstance($('#carritoPanel')).show(), { once: true });
    bootstrap.Modal.getOrCreateInstance(modal).hide();
  });
  $('#carritoAplicarCupon').addEventListener('click', aplicarCupon);
  $('#carritoCodigoCupon').addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') { evento.preventDefault(); aplicarCupon(); }
  });
  $('#carritoQuitarCupon').addEventListener('click', () => {
    estado.cupon = '';
    guardarCarrito();
    dibujarCarrito();
  });
  $('#formCarritoCheckout').addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!estado.catalogo || !estado.articulos.length) return;
    const formulario = evento.currentTarget;
    if (!formulario.reportValidity()) return;
    const nombre = $('#carritoNombre').value.trim();
    const correo = $('#carritoCorreo').value.trim();
    const metodo = $('input[name="metodoPago"]:checked')?.value;
    if (!nombre || !metodo) { formulario.reportValidity(); return; }
    const numero = String(estado.catalogo.configuracion.whatsapp || '').replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(numero)) return;
    const mensaje = construirMensaje(nombre, correo, metodo);
    const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    // Abrir WhatsApp no equivale a cobrar ni garantiza que el cliente envíe el mensaje.
    window.open(enlace, '_blank', 'noopener,noreferrer');
  });

  // Compatibilidad: la nueva compra trabaja solo en MXN. Si el antiguo script.js
  // intentara abrir el selector de país, impedirlo para no mezclar monedas.
  const modalPaisAnterior = $('#modalPais');
  if (modalPaisAnterior) {
    modalPaisAnterior.addEventListener('show.bs.modal', (evento) => evento.preventDefault());
  }
  function mostrarContenidoMexico() {
    $$('.solo-mexico').forEach((seccion) => seccion.classList.remove('d-none'));
  }
  mostrarContenidoMexico();
  document.addEventListener('DOMContentLoaded', mostrarContenidoMexico);
  window.addEventListener('load', mostrarContenidoMexico);

  inicializar();
})();
