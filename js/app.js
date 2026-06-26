/* ============================================
   APP.JS — POS Vendedor
   Sin módulos ES · Supabase UMD
   ============================================ */

const { createClient } = supabase;

const sb = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

/* --- Sesión --- */

window.addEventListener("DOMContentLoaded", async () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) window.location.href = "login.html";

  const info = document.getElementById("usuarioInfo");
  if (info) info.textContent = `👤 ${usuario.nombre}`;

  await cargarInventario();

  // 👇 IMPORTANTE: inicializa selects vacíos
  document.getElementById("categoria").innerHTML =
    '<option value="">Seleccione categoría</option>';

  document.getElementById("publico").innerHTML =
    '<option value="">Seleccione público</option>';

  document.getElementById("producto").innerHTML =
    '<option value="">Seleccione producto</option>';

  await cargarHistorialHoy();
});

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) {
  return Number(n || 0).toLocaleString("es-CO");
}

/* ============================================
   CARGAR INVENTARIO
   ============================================ */
async function cargarInventario() {
  const { data, error } = await sb
    .from("inventario")
    .select("*")
    .order("producto");

  if (error) {
    console.error("Error cargando inventario:", error);
    return;
  }

  inventario = data;
  cargarCategorias();
}

/* ============================================
   CATEGORÍAS
   ============================================ */
function cargarCategorias() {
  const categorias = [...new Set(inventario.map(x => x.categoria?.trim()).filter(Boolean))];
  const combo = document.getElementById("categoria");
  combo.innerHTML = '<option value="">Seleccione categoría</option>';
  categorias.forEach(cat => {
    combo.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

/* ============================================
   PÚBLICOS
   ============================================ */
function cargarPublicos() {
  const categoria = document.getElementById("categoria").value;

  const publicos = [...new Set(
    inventario
      .filter(x => x.categoria?.trim() === categoria)
      .map(x => x.publico?.trim())
      .filter(Boolean)
  )];

  const combo = document.getElementById("publico");
  combo.innerHTML = '<option value="">Seleccione público</option>';
  publicos.forEach(pub => {
    combo.innerHTML += `<option value="${pub}">${pub}</option>`;
  });

  document.getElementById("producto").innerHTML = '<option value="">Seleccione producto</option>';
  document.getElementById("detalleProducto").innerHTML = "";
}

/* ============================================
   PRODUCTOS
   ============================================ */
function cargarProductos() {
  const categoria = document.getElementById("categoria").value;
  const publico   = document.getElementById("publico").value;

  const productos = inventario.filter(
    x => x.categoria?.trim() === categoria && x.publico?.trim() === publico
  );

  const combo = document.getElementById("producto");
  combo.innerHTML = '<option value="">Seleccione producto</option>';
  productos.forEach(prod => {
    combo.innerHTML += `<option value="${prod.codigo}">${prod.producto}</option>`;
  });

  document.getElementById("detalleProducto").innerHTML = "";
}

/* ============================================
   DETALLE DEL PRODUCTO
   ============================================ */
function mostrarProducto() {
  const codigo  = document.getElementById("producto").value;
  if (!codigo) return;

  const prod = inventario.find(x => x.codigo === codigo);
  if (!prod) return;

  // Usar stock_final si existe, si no stock_inicial
  const stockDisponible = prod.stock_final ?? prod.stock_inicial ?? 0;
  const stockClase = stockDisponible <= 0 ? "stock-bajo" : stockDisponible <= 5 ? "stock-medio" : "stock-ok";

  document.getElementById("detalleProducto").innerHTML = `
    <div class="producto-detalle">
      ${prod.imagenes
        ? `<img src="${prod.imagenes}" alt="${prod.producto}" class="producto-img">`
        : `<div class="producto-img-placeholder">Sin imagen</div>`
      }
      <div class="producto-info">
        <p class="producto-nombre">${prod.producto}</p>
        <p><span class="info-label">Código</span> ${prod.codigo}</p>
        <p><span class="info-label">Categoría</span> ${prod.categoria}</p>
        <p><span class="info-label">Público</span> ${prod.publico}</p>
        <p><span class="info-label">Precio</span> <strong>$${fmt(prod.precio_unitario)}</strong></p>
        <p><span class="info-label">Stock disponible</span> <span class="${stockClase}">${stockDisponible}</span></p>
        ${stockDisponible <= 0 ? `<p class="stock-bajo">⚠ Sin stock</p>` : ""}
      </div>
    </div>
  `;
}

/* ============================================
   AGREGAR AL CARRITO
   ============================================ */
function agregarAlCarrito() {
  const codigo   = document.getElementById("producto").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const prod     = inventario.find(x => x.codigo === codigo);

  if (!prod) return mostrarMensaje("Seleccione un producto", "error");
  if (!cantidad || cantidad <= 0) return mostrarMensaje("Ingrese una cantidad válida", "error");

  const stockDisponible = prod.stock_final ?? prod.stock_inicial ?? 0;
  if (cantidad > stockDisponible) return mostrarMensaje(`Stock insuficiente. Disponible: ${stockDisponible}`, "error");

  // Si ya está en el carrito, sumar cantidad
  const existente = carrito.find(x => x.codigo === codigo);
  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > stockDisponible) return mostrarMensaje("No hay suficiente stock", "error");
    existente.cantidad = nuevaCantidad;
    existente.subtotal = nuevaCantidad * existente.precio;
  } else {
    carrito.push({
      codigo:   prod.codigo,
      producto: prod.producto,
      cantidad,
      precio:   prod.precio_unitario,
      subtotal: cantidad * prod.precio_unitario
    });
  }

  document.getElementById("cantidad").value = "";
  renderCarrito();
}

/* ============================================
   RENDER CARRITO
   ============================================ */
function renderCarrito() {
  const contenedor = document.getElementById("carrito");

  if (carrito.length === 0) {
    contenedor.innerHTML = `<p class="texto-vacio">El carrito está vacío</p>`;
    return;
  }

  let total = carrito.reduce((a, b) => a + b.subtotal, 0);

  let html = `
    <div class="tabla-wrapper">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
  `;

  carrito.forEach((item, i) => {
    html += `
      <tr>
        <td>${item.producto}</td>
        <td style="text-align:center;">${item.cantidad}</td>
        <td style="text-align:right;">$${fmt(item.precio)}</td>
        <td style="text-align:right;">$${fmt(item.subtotal)}</td>
        <td style="text-align:center;">
          <button class="btn-peligro btn-icono btnEliminar" data-index="${i}">🗑</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
    <div class="carrito-total">
      <span>Total</span>
      <strong>$${fmt(total)}</strong>
    </div>
  `;

  contenedor.innerHTML = html;

  document.querySelectorAll(".btnEliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarItem(parseInt(btn.dataset.index)));
  });
}

function eliminarItem(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

/* ============================================
   PANEL DE PAGO
   ============================================ */
function mostrarPanelPago() {
  if (carrito.length === 0) return mostrarMensaje("El carrito está vacío", "error");

  actualizarResumenPago();
  document.getElementById("panelPago").hidden = false;
  document.getElementById("panelPago").scrollIntoView({ behavior: "smooth" });
}

function ocultarPanelPago() {
  document.getElementById("panelPago").hidden = true;
  document.getElementById("montoPago").value = "";
}

function actualizarResumenPago() {
  const total = carrito.reduce((a, b) => a + b.subtotal, 0);
  const abono = parseFloat(document.getElementById("montoPago").value) || 0;
  const saldo = Math.max(total - abono, 0);
  const medio = document.getElementById("medioPagoFinal").value;

  let estado = "Pendiente";
  if (medio === "Pendiente") {
    estado = "Pendiente";
  } else if (saldo <= 0) {
    estado = "Pagado";
  } else if (abono > 0) {
    estado = "Parcial";
  }

  document.getElementById("clienteResumen").textContent    = document.getElementById("cliente").value || "Cliente General";
  document.getElementById("productosResumen").textContent  = carrito.length;
  document.getElementById("totalResumen").textContent      = fmt(total);
  document.getElementById("saldoResumen").textContent      = fmt(saldo);
  document.getElementById("estadoResumen").textContent     = estado;
}

/* ============================================
   CONFIRMAR VENTA
   ============================================ */
async function confirmarVenta() {
  if (carrito.length === 0) return mostrarMensaje("El carrito está vacío", "error");

  const btn = document.getElementById("btnConfirmarVenta");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  const cliente   = document.getElementById("cliente").value.trim() || "Cliente General";
  const medioPago = document.getElementById("medioPagoFinal").value;
  const abono     = parseFloat(document.getElementById("montoPago").value) || 0;
  const total     = carrito.reduce((a, b) => a + b.subtotal, 0);

  const total_pagado = medioPago === "Pendiente" ? 0 : abono;
  const saldo        = Math.max(total - total_pagado, 0);
  const estado       = saldo <= 0 ? "Pagado" : total_pagado > 0 ? "Parcial" : "Pendiente";

  try {
    // 1. Crear venta
    const { data: venta, error: errVenta } = await sb
      .from("ventas")
      .insert([{
        cliente,
        usuario:       usuario.username,
        estado,
        total_general: total,
        total_pagado,
        saldo
      }])
      .select()
      .single();

    if (errVenta) throw errVenta;

    // 2. Insertar detalles (el trigger de Supabase descuenta stock automáticamente)
    const detalles = carrito.map(item => ({
      venta_id:       venta.id,
      codigo:         item.codigo,
      producto:       item.producto,
      cantidad:       item.cantidad,
      precio_unitario: item.precio,
      subtotal:       item.subtotal
    }));

    const { error: errDetalle } = await sb.from("detalle_ventas").insert(detalles);
    if (errDetalle) throw errDetalle;

    // 3. Registrar pago si hubo abono
    if (total_pagado > 0) {
      await sb.from("pagos").insert([{
        venta_id:   venta.id,
        monto:      total_pagado,
        medio_pago: medioPago,
        observacion: "Pago inicial"
      }]);
    }

    // 4. Limpiar
    carrito = [];
    renderCarrito();
    ocultarPanelPago();
    document.getElementById("cliente").value   = "";
    document.getElementById("cantidad").value  = "";
    document.getElementById("detalleProducto").innerHTML = "";

    // 5. Recargar inventario con stock actualizado
    await cargarInventario();
    await cargarHistorialHoy();

    mostrarMensaje("✔ Venta registrada correctamente", "exito");

  } catch (err) {
    console.error("Error en venta:", err);
    mostrarMensaje("Error al registrar la venta. Intenta de nuevo.", "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "✔ Confirmar venta";
  }
}

/* ============================================
   HISTORIAL DEL DÍA (solo del vendedor)
   ============================================ */
async function cargarHistorialHoy() {
  const hoy       = new Date();
  const inicio    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const fin       = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

  const { data, error } = await sb
    .from("ventas")
    .select("*")
    .eq("usuario", usuario.username)
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha", { ascending: false });

  const contenedor = document.getElementById("historialHoy");

  if (error || !data || data.length === 0) {
    contenedor.innerHTML = `<p class="texto-vacio">Sin ventas registradas hoy</p>`;
    return;
  }

  contenedor.innerHTML = `
    <div class="tabla-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Pagado</th>
            <th>Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(v => `
            <tr>
              <td>${v.id}</td>
              <td>${v.cliente}</td>
              <td>$${fmt(v.total_general)}</td>
              <td>$${fmt(v.total_pagado)}</td>
              <td>$${fmt(v.saldo)}</td>
              <td>
                <span class="badge badge-${
                  v.estado === 'Pagado'   ? 'pagado' :
                  v.estado === 'Parcial'  ? 'parcial' : 'pendiente'
                }">${v.estado}</span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
 ============================================
   MENSAJE FLASH
   ============================================ */
function mostrarMensaje(texto, tipo) {
  const el = document.createElement("div");
  el.className = tipo === "exito" ? "msg-exito" : "msg-error";
  el.textContent = texto;
  el.style.position = "fixed";
  el.style.bottom   = "20px";
  el.style.right    = "20px";
  el.style.zIndex   = "999";
  el.style.maxWidth = "300px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ============================================
   EVENTOS
   ============================================ */
document.getElementById("categoria").addEventListener("change", cargarPublicos);
document.getElementById("publico").addEventListener("change", cargarProductos);
document.getElementById("producto").addEventListener("change", mostrarProducto);
document.getElementById("btnAgregar").addEventListener("click", agregarAlCarrito);
document.getElementById("btnFinalizar").addEventListener("click", mostrarPanelPago);
document.getElementById("btnConfirmarVenta").addEventListener("click", confirmarVenta);
document.getElementById("btnCancelarPago").addEventListener("click", ocultarPanelPago);
document.getElementById("montoPago").addEventListener("input", actualizarResumenPago);
document.getElementById("medioPagoFinal").addEventListener("change", actualizarResumenPago);
document.getElementById("cliente").addEventListener("input", actualizarResumenPago);

/* ============================================
   INICIO
   ============================================ */
cargarInventario();
cargarHistorialHoy();
