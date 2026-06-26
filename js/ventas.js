/* ============================================
   VENTAS.JS — Historial de Ventas
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

function cerrarSesion() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html?t=" + Date.now();
}

/* --- Estado --- */
let ventasData = [];

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(f);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function fmtFechaSolo(f) {
  if (!f) return "";
  return new Date(f).toISOString().split("T")[0];
}

/* ============================================
   CARGAR VENTAS
   ============================================ */
async function cargarVentas() {
  const tbody = document.getElementById("tablaVentas");
  tbody.innerHTML = `<tr><td colspan="9" class="texto-vacio">Cargando...</td></tr>`;

  const { data, error } = await sb
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="texto-vacio">Error cargando ventas</td></tr>`;
    return;
  }

  ventasData = data;
  renderTabla(ventasData);
}

/* ============================================
   RENDER TABLA
   ============================================ */
function renderTabla(datos) {
  const tbody = document.getElementById("tablaVentas");

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="texto-vacio">Sin registros</td></tr>`;
    actualizarResumen([]);
    return;
  }

  tbody.innerHTML = datos.map(v => `
    <tr>
      <td>#${v.id}</td>
      <td>${fmtFecha(v.fecha)}</td>
      <td>${v.cliente || "Sin cliente"}</td>
      <td>${v.usuario || "—"}</td>
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
        <button class="btn-outline btn-icono" onclick="verDetalle(${v.id})">Ver</button>
      </td>
    </tr>
  `).join("");

  actualizarResumen(datos);
}

/* ============================================
   RESUMEN RÁPIDO
   ============================================ */
function actualizarResumen(datos) {
  const total   = datos.reduce((a, v) => a + Number(v.total_general || 0), 0);
  const cobrado = datos.reduce((a, v) => a + Number(v.total_pagado  || 0), 0);
  const saldo   = datos.reduce((a, v) => a + Number(v.saldo         || 0), 0);

  document.getElementById("resumenCantidad").textContent = datos.length;
  document.getElementById("resumenTotal").textContent    = fmt(total);
  document.getElementById("resumenCobrado").textContent  = fmt(cobrado);
  document.getElementById("resumenSaldo").textContent    = fmt(saldo);
}

/* ============================================
   FILTROS
   ============================================ */
function aplicarFiltros() {
  const buscar = document.getElementById("buscarCliente").value.toLowerCase();
  const estado = document.getElementById("filtroEstado").value;
  const fecha  = document.getElementById("filtroFecha").value;

  const filtrado = ventasData.filter(v => {
    const coincideCliente = (v.cliente || "").toLowerCase().includes(buscar);
    const coincideEstado  = estado ? v.estado === estado : true;
    const coincideFecha   = fecha  ? fmtFechaSolo(v.fecha) === fecha : true;
    return coincideCliente && coincideEstado && coincideFecha;
  });

  renderTabla(filtrado);
}

function limpiarFiltros() {
  document.getElementById("buscarCliente").value = "";
  document.getElementById("filtroEstado").value  = "";
  document.getElementById("filtroFecha").value   = "";
  renderTabla(ventasData);
}

document.getElementById("buscarCliente").addEventListener("input", aplicarFiltros);
document.getElementById("filtroEstado").addEventListener("change", aplicarFiltros);
document.getElementById("filtroFecha").addEventListener("change", aplicarFiltros);
document.getElementById("btnLimpiarFiltros").addEventListener("click", limpiarFiltros);

/* ============================================
   MODAL DETALLE
   ============================================ */
async function verDetalle(ventaId) {
  document.getElementById("detalleId").textContent     = `#${ventaId}`;
  document.getElementById("detalleContenido").innerHTML = `<p class="texto-vacio">Cargando...</p>`;
  document.getElementById("modalDetalle").hidden        = false;

  const [{ data: detalle }, { data: pagos }] = await Promise.all([
    sb.from("detalle_ventas").select("*").eq("venta_id", ventaId),
    sb.from("pagos").select("*").eq("venta_id", ventaId).order("fecha")
  ]);

  let html = "";

  // Productos
  if (detalle && detalle.length > 0) {
    html += `
      <p class="card-titulo" style="margin-bottom:10px;">Productos</p>
      <div class="tabla-wrapper">
        <table>
          <thead>
            <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${detalle.map(d => `
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
  }

  // Pagos
  if (pagos && pagos.length > 0) {
    html += `
      <p class="card-titulo" style="margin:16px 0 10px;">Pagos registrados</p>
      <div class="tabla-wrapper">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Monto</th><th>Medio</th><th>Observación</th></tr>
          </thead>
          <tbody>
            ${pagos.map(p => `
              <tr>
                <td>${fmtFecha(p.fecha)}</td>
                <td style="text-align:right;">${fmt(p.monto)}</td>
                <td>${p.medio_pago || "—"}</td>
                <td>${p.observacion || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (!html) html = `<p class="texto-vacio">Sin información disponible</p>`;

  document.getElementById("detalleContenido").innerHTML = html;
}

function cerrarModal() {
  document.getElementById("modalDetalle").hidden = true;
}

// Cerrar con click fuera
document.getElementById("modalDetalle").addEventListener("click", e => {
  if (e.target === document.getElementById("modalDetalle")) cerrarModal();
});

/* ============================================
   INICIO
   ============================================ */
cargarVentas();
