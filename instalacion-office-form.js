(() => {
  'use strict';

  const PRECIOS = Object.freeze({ 1: 399, 2: 723, 3: 972, 4: 1146 });
  const PRECIO_DESDE_CINCO = 249;
  const PRECIO_LISTA = 399;
  const TELEFONO_WHATSAPP = '522221106016';
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

  const $ = (selector) => document.querySelector(selector);
  const dinero = (cantidad) => `${new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(cantidad)} MXN`;
  const redondear = (numero) => Math.round((numero + Number.EPSILON) * 100) / 100;
  const sanitizar = (valor) => String(valor || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const cantidadInput = $('#officeCantidad');
  const aplicaciones = Array.from(document.querySelectorAll('input[name="officeAplicacion"]'));

  function cantidadActual() {
    const cantidad = Number(cantidadInput.value);
    if (!Number.isSafeInteger(cantidad) || cantidad < 1) return 1;
    return Math.min(cantidad, 9999);
  }

  function calcular(cantidad) {
    const total = cantidad >= 5 ? cantidad * PRECIO_DESDE_CINCO : PRECIOS[cantidad];
    const subtotal = cantidad * PRECIO_LISTA;
    return { total, subtotal, descuento: subtotal - total, promedio: total / cantidad };
  }

  function actualizarResumen() {
    const cantidad = cantidadActual();
    const { total, subtotal, descuento, promedio } = calcular(cantidad);
    $('#officeResumenCantidad').textContent = `${cantidad} ${cantidad === 1 ? 'equipo' : 'equipos'}`;
    $('#officeResumenSubtotal').textContent = dinero(subtotal);
    $('#officeResumenDescuento').textContent = descuento ? `−${dinero(descuento)}` : dinero(0);
    $('#officeResumenTotal').textContent = dinero(total);
    $('#officeResumenUnitario').textContent = `${dinero(redondear(promedio))} por equipo`;
    $('#officeRestar').disabled = cantidad <= 1;
  }

  function cambiarCantidad(delta) {
    cantidadInput.value = String(Math.max(1, Math.min(9999, cantidadActual() + delta)));
    actualizarResumen();
  }

  function actualizarIdioma() {
    const otro = $('#officeIdioma').value === 'otro';
    $('#officeOtroIdiomaGrupo').hidden = !otro;
    $('#officeOtroIdioma').required = otro;
    if (!otro) $('#officeOtroIdioma').value = '';
  }

  function actualizarAgenda() {
    const porFecha = $('#officeTipoHorario').value === 'fecha';
    $('#officeHorarioFecha').hidden = !porFecha;
    $('#officeHorarioLibre').hidden = porFecha;
    $('#officeFecha').required = porFecha;
    $('#officeHora').required = porFecha;
    $('#officeDisponibilidad').required = !porFecha;
  }

  function actualizarApps() {
    const seleccionadas = aplicaciones.filter((app) => app.checked).length;
    $('#officeTodas').checked = seleccionadas === aplicaciones.length;
    $('#officeTodas').indeterminate = seleccionadas > 0 && seleccionadas < aplicaciones.length;
    if (seleccionadas) $('#officeErrorApps').hidden = true;
  }

  function fechaLocalISO() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  function textoAgenda() {
    if ($('#officeTipoHorario').value === 'disponibilidad') {
      return `Disponibilidad indicada: ${sanitizar($('#officeDisponibilidad').value)}`;
    }
    const fecha = $('#officeFecha').value;
    const hora = $('#officeHora').value;
    const textoFecha = new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(`${fecha}T12:00:00`));
    return `Fecha preferida: ${textoFecha}\nHora preferida: ${hora} h`;
  }

  function construirMensaje() {
    const nombre = sanitizar($('#officeNombre').value);
    const correo = sanitizar($('#officeCorreo').value);
    const cantidad = cantidadActual();
    const idioma = $('#officeIdioma').value === 'otro'
      ? sanitizar($('#officeOtroIdioma').value)
      : $('#officeIdioma').selectedOptions[0].textContent.trim();
    const apps = aplicaciones.filter((app) => app.checked).map((app) => app.value);
    const metodo = $('input[name="officeMetodoPago"]:checked').value;
    const { subtotal, descuento, total, promedio } = calcular(cantidad);
    const partes = [
      '*IC DigTec | Soluc. Digitales y Técnicas*',
      '_Solicitud de Servicios_',
      '',
      `*Nombre:* ${nombre}`,
      ...(correo ? [`*Correo:* ${correo}`] : []),
      '',
      '*Detalles del carrito:*',
      '',
      '- *Instalación remota de Microsoft Office*'
    ];

    if (descuento > 0) {
      const promedioTexto = dinero(redondear(promedio)).replace(/^\$/, '');
      partes.push(`De ~${dinero(PRECIO_LISTA)}~ a _${promedioTexto}_`);
    } else {
      partes.push(`Precio unitario: ${dinero(PRECIO_LISTA)}`);
    }
    partes.push(`${cantidad} ${cantidad === 1 ? 'Unidad' : 'Unidades'}: ${dinero(total)}`);
    partes.push('', '*Configuración solicitada:*');
    partes.push(`*Idioma:* ${idioma}`);
    partes.push(`*Aplicaciones:* ${apps.join(', ')}`);
    partes.push('', '*Agendar instalación:*', textoAgenda());
    partes.push($('#officeTipoHorario').value === 'fecha'
      ? '_La fecha y hora indicadas son preferencias. IC DigTec confirmará la disponibilidad antes de realizar la instalación._'
      : '_La disponibilidad indicada es una preferencia. IC DigTec confirmará el horario antes de realizar la instalación._');
    partes.push('', '*Resumen:*');
    partes.push(`Subtotal: ${dinero(subtotal)}`);
    partes.push(`Descuento: -${dinero(descuento)}`);
    partes.push(`*TOTAL: ${dinero(total)}*`);
    partes.push('', `*Método de Pago:* ${metodo === 'transferencia' ? 'Transferencia bancaria' : 'Mercado Pago'}`);

    if (metodo === 'transferencia') {
      const banco = DATOS_PAGO.transferencia;
      partes.push(`Realiza una transferencia por *${dinero(total)}* a los siguientes datos:`, '');
      partes.push(`*CLABE:* ${banco.clabe}`);
      partes.push(`*Beneficiario:* ${banco.beneficiario}`);
      partes.push(`*Institución:* ${banco.institucion}`);
    } else {
      partes.push(`Ingresa al siguiente enlace e introduce el total de tu compra *${dinero(total)}*.`, '');
      partes.push(DATOS_PAGO.mercadopago.enlace);
    }
    partes.push('', '_*NOTA:* para comenzar a trabajar tu pedido, es necesario cubrir el total de tu compra para asignar espacio de desarrollo._');
    partes.push('', '_*NOTA:* si requiere ticket de cotización, puede solicitarlo; el ticket con leyenda "PAGADO" se le enviará una vez confirmado el pago._');
    return partes.join('\n');
  }

  $('#officeRestar').addEventListener('click', () => cambiarCantidad(-1));
  $('#officeSumar').addEventListener('click', () => cambiarCantidad(1));
  cantidadInput.addEventListener('input', actualizarResumen);
  cantidadInput.addEventListener('change', () => {
    cantidadInput.value = String(cantidadActual());
    actualizarResumen();
  });
  $('#officeIdioma').addEventListener('change', actualizarIdioma);
  $('#officeTipoHorario').addEventListener('change', actualizarAgenda);
  $('#officeTodas').addEventListener('change', (evento) => {
    aplicaciones.forEach((app) => { app.checked = evento.target.checked; });
    actualizarApps();
  });
  aplicaciones.forEach((app) => app.addEventListener('change', actualizarApps));

  $('#formInstalacionOffice').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!formulario.reportValidity()) return;
    if (!Number.isSafeInteger(Number(cantidadInput.value)) || Number(cantidadInput.value) < 1 || Number(cantidadInput.value) > 9999) {
      cantidadInput.setCustomValidity('Introduce una cantidad válida de equipos.');
      cantidadInput.reportValidity();
      cantidadInput.setCustomValidity('');
      return;
    }
    if (!aplicaciones.some((app) => app.checked)) {
      $('#officeErrorApps').hidden = false;
      aplicaciones[0].focus();
      return;
    }
    if ($('#officeTipoHorario').value === 'fecha' && $('#officeFecha').value < fechaLocalISO()) {
      $('#officeFecha').setCustomValidity('Selecciona una fecha de hoy en adelante.');
      $('#officeFecha').reportValidity();
      $('#officeFecha').setCustomValidity('');
      return;
    }
    const mensaje = construirMensaje();
    const enlace = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    // La conversación abre con texto precargado; el cliente debe enviarlo.
    window.open(enlace, '_blank', 'noopener,noreferrer');
  });

  $('#officeFecha').min = fechaLocalISO();
  actualizarIdioma();
  actualizarAgenda();
  actualizarApps();
  actualizarResumen();
})();
