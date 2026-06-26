/* ============================================
   PENDIENTES.JS — Cartera de Clientes
   Sin módulos ES · Supabase UMD
   ============================================ */

const { createClient } = supabase;

const sb = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

/* --- Sesión --- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href = "login.html";

document.getElementById("usuarioInfo").textContent = `👤 ${usuario.nombre}`;

window.cerrarSesion = function () {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html?t=" + Date.now();
};

/* --- Estado --- */
let ventasData  = [];
let ventaActual = null;

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

/* ============================================
   CARGAR CARTERA
   ============================================ */
async function cargarCartera() {
  const tbody = document.getElementById("tablaPendientes");
  tbody.innerHTML = `<tr><td colspan="7" class="texto-vacio">Cargando...</td></tr>`;

  const { data, error } = await sb
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });

  // 🔍 DIAGNÓSTICO — ver en consola del navegador (F12)
  console.log("ventas data:", data);
  console.log("ventas error:", error);

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="texto-vacio">Error: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="texto-vacio">Sin registros — verifica RLS en Supabase</td></tr>`;
    return;
  }

  ventasData = data;
  renderTabla(ventasData);
}

/* ============================================
   RENDER TABLA
   ============================================ */
function renderTabla(datos) {
  const tbody = document.getElementById("tablaPendientes");

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="texto-vacio">Sin registros</td></tr>`;
    return;
  }

  tbody.innerHTML = datos.map(v => `
    <tr>
      <td>#${v.id}</td>
      <td>${v.cliente || "Sin cliente"}</td>
      <td>${fmt(v.total_general)}</td>
      <td>${fmt(v.total_pagado)}</td>
      <td>${fmt(v.saldo)}</td>
      <td>
        <span class="badge badge-${
          v.estado === 'Pagado'  ? 'pagado' :
          v.estado === 'Parcial' ? 'parcial' : 'pendiente'
        }">${v.estado}</span>
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-outline btn-icono" onclick="verDetalle(${v.id})">Ver</button>
          ${v.saldo > 0
            ? `<button class="btn-secundario btn-icono" onclick="abrirAbono(${v.id}, '${(v.cliente || 'Sin cliente').replace(/'/g, "\\'")}', ${v.total_general}, ${v.total_pagado}, ${v.saldo})">Abonar</button>`
            : ""
          }
        </div>
      </td>
    </tr>
  `).join("");
}

/* ============================================
   FILTROS
   ============================================ */
function aplicarFiltros() {
  const buscar = document.getElementById("buscarCliente").value.toLowerCase();
  const estado = document.getElementById("filtroEstado").value;

  const filtrado = ventasData.filter(v => {
    const coincideCliente = (v.cliente || "").toLowerCase().includes(buscar);
    const coincideEstado  = estado ? v.estado === estado : true;
    return coincideCliente && coincideEstado;
  });

  renderTabla(filtrado);
}

document.getElementById("buscarCliente").addEventListener("input", aplicarFiltros);
document.getElementById("filtroEstado").addEventListener("change", aplicarFiltros);

/* ============================================
   MODAL HELPERS
   ============================================ */
window.abrirModal = function (id) {
  document.getElementById(id).hidden = false;
};

window.cerrarModal = function (id) {
  document.getElementById(id).hidden = true;
};

/* ============================================
   VER DETALLE
   ============================================ */
window.verDetalle = async function (ventaId) {
  document.getElementById("detalleVentaId").textContent = `#${ventaId}`;
  document.getElementById("detalleContenido").innerHTML = `<p class="texto-vacio">Cargando...</p>`;
  abrirModal("modalDetalle");

  const { data, error } = await sb
    .from("detalle_ventas")
    .select("*")
    .eq("venta_id", ventaId);

  console.log("detalle data:", data, "error:", error);

  if (error || !data || data.length === 0) {
    document.getElementById("detalleContenido").innerHTML = `<p class="texto-vacio">Sin productos</p>`;
    return;
  }

  document.getElementById("detalleContenido").innerHTML = `
    <div class="tabla-wrapper">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(d => `
            <tr>
              <td>${d.producto}</td>
              <td style="text-align:center;">${d.cantidad}</td>
              <td style="text-align:right;">${fmt(d.precio_unitario)}</td>
              <td style="text-align:right;">${fmt(d.subtotal)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
};

/* ============================================
   ABRIR MODAL ABONO
   ============================================ */
window.abrirAbono = function (id, cliente, total, pagado, saldo) {
  ventaActual = { id, cliente, total, pagado, saldo };

  document.getElementById("abonoResumenCliente").textContent = `Cliente: ${cliente}`;
  document.getElementById("abonoTotal").textContent   = fmt(total);
  document.getElementById("abonoPagado").textContent  = fmt(pagado);
  document.getElementById("abonoSaldo").textContent   = fmt(saldo);
  document.getElementById("montoAbono").value         = "";
  document.getElementById("abonoError").hidden        = true;

  abrirModal("modalAbono");
};

/* ============================================
   CONFIRMAR ABONO
   ============================================ */
async function confirmarAbono() {
  const monto = parseFloat(document.getElementById("montoAbono").value);
  const medio = document.getElementById("medioAbono").value;
  const errorEl = document.getElementById("abonoError");
  const btn = document.getElementById("btnConfirmarAbono");

  errorEl.hidden = true;

  if (!monto || monto <= 0) {
    errorEl.textContent = "Ingresa un monto válido.";
    errorEl.hidden = false;
    return;
  }

  if (monto > ventaActual.saldo) {
    errorEl.textContent = `El monto supera el saldo pendiente (${fmt(ventaActual.saldo)}).`;
    errorEl.hidden = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const { error: errPago } = await sb.from("pagos").insert([{
      venta_id:    ventaActual.id,
      monto,
      medio_pago:  medio,
      observacion: "Abono desde cartera"
    }]);

    if (errPago) throw errPago;

    const { data: pagos } = await sb
      .from("pagos")
      .select("monto")
      .eq("venta_id", ventaActual.id);

    const totalPagado = (pagos || []).reduce((a, b) => a + Number(b.monto), 0);
    const nuevoSaldo  = Number(ventaActual.total) - totalPagado;
    const estado      = nuevoSaldo <= 0 ? "Pagado" : "Parcial";

    const { error: errUpdate } = await sb
      .from("ventas")
      .update({ total_pagado: totalPagado, saldo: nuevoSaldo, estado })
      .eq("id", ventaActual.id);

    if (errUpdate) throw errUpdate;

    cerrarModal("modalAbono");
    mostrarMensaje("✔ Abono registrado correctamente", "exito");
    await cargarCartera();

  } catch (err) {
    console.error("Error abono:", err);
    errorEl.textContent = `Error: ${err.message || "Intenta de nuevo."}`;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar abono";
  }
}

document.getElementById("btnConfirmarAbono").addEventListener("click", confirmarAbono);

/* ============================================
   MENSAJE FLASH
   ============================================ */
function mostrarMensaje(texto, tipo) {
  const el = document.createElement("div");
  el.className  = tipo === "exito" ? "msg-exito" : "msg-error";
  el.textContent = texto;
  el.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:999;max-width:300px;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ============================================
   CERRAR MODAL CON CLICK FUERA
   ============================================ */
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.hidden = true;
  });
});

/* ============================================
   INICIO
   ============================================ */
cargarCartera();