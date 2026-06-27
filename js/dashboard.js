/* ============================================
   DASHBOARD.JS — Vistazo ejecutivo
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
if (usuario.rol !== "Administrador") window.location.href = "index.html";

document.getElementById("usuarioInfo").textContent = `👤 ${usuario.nombre} (${usuario.rol})`;

window.cerrarSesion = function () {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html?t=" + Date.now();
};

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) { return "$" + Number(n || 0).toLocaleString("es-CO"); }

function badgeEstado(estado) {
  const cls = estado === "Pagado" ? "pagado" : estado === "Parcial" ? "parcial" : "pendiente";
  return `<span class="badge badge-${cls}">${estado}</span>`;
}

function rangoHoy() {
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth(), h.getDate()).toISOString();
  const fin = new Date(h.getFullYear(), h.getMonth(), h.getDate(), 23, 59, 59).toISOString();
  return { ini, fin };
}

/* ============================================
   1. VENTAS
   ============================================ */
async function cargarVentas() {
  const { data: ventas } = await sb.from("ventas").select("total_general, total_pagado, saldo, fecha");
  if (!ventas) return;

  const { ini, fin } = rangoHoy();
  let totalV = 0, totalC = 0, totalCart = 0, pendientes = 0, ventasHoy = 0, cobradoHoy = 0;

  ventas.forEach(v => {
    totalV    += Number(v.total_general || 0);
    totalC    += Number(v.total_pagado  || 0);
    if (v.saldo > 0) { totalCart += Number(v.saldo || 0); pendientes++; }
    if (v.fecha >= ini && v.fecha <= fin) {
      ventasHoy++;
      cobradoHoy += Number(v.total_pagado || 0);
    }
  });

  document.getElementById("totalVentas").textContent      = fmt(totalV);
  document.getElementById("totalCobrado").textContent     = fmt(totalC);
  document.getElementById("totalCartera").textContent     = fmt(totalCart);
  document.getElementById("ventasPendientes").textContent = pendientes;
  document.getElementById("ventasHoy").textContent        = ventasHoy;
  document.getElementById("cobradoHoy").textContent       = fmt(cobradoHoy);
}

/* ============================================
   2. CAJA
   ============================================ */
async function cargarCaja() {
  const [{ data: pagos }, { data: movs }] = await Promise.all([
    sb.from("pagos").select("monto"),
    sb.from("caja").select("*").order("fecha", { ascending: false })
  ]);

  const totalPagos = (pagos || []).reduce((a, p) => a + Number(p.monto || 0), 0);
  let ingresosManuales = 0, capital = 0, ganancias = 0, paola = 0, juliette = 0, egresos = 0;

  (movs || []).forEach(m => {
    const v = Number(m.monto || 0);
    switch (m.tipo) {
      case "ingreso":  ingresosManuales += v; break;
      case "capital":  capital += v; egresos += v; break;
      case "ganancia":
        ganancias += v; egresos += v;
        if (m.socia === "Paola")    paola    += v;
        if (m.socia === "Juliette") juliette += v;
        break;
      case "gasto": egresos += v; break;
    }
  });

  const caja = (totalPagos + ingresosManuales) - egresos;

  document.getElementById("cajaCaja").textContent      = fmt(caja);
  document.getElementById("cajaCapital").textContent   = fmt(capital);
  document.getElementById("cajaGanancias").textContent = fmt(ganancias);
  document.getElementById("cajaPaola").textContent     = fmt(paola);
  document.getElementById("cajaJuliette").textContent  = fmt(juliette);
  document.getElementById("cajaCaja").style.color      = caja < 0 ? "var(--error)" : "var(--dorado)";

  const tipoLabel = { ingreso:"💵", capital:"🔄", ganancia:"💸", gasto:"🧾" };
  document.getElementById("ultimosMovimientos").innerHTML = (movs || []).slice(0, 5).length === 0
    ? `<p class="texto-vacio">Sin movimientos</p>`
    : (movs || []).slice(0, 5).map(m => {
        const esEgreso = ["capital","ganancia","gasto"].includes(m.tipo);
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;
                      padding:7px 0;border-bottom:1px solid var(--beige-borde);font-size:0.85rem;">
            <span>${tipoLabel[m.tipo] || "•"} ${m.concepto || m.tipo}</span>
            <span style="font-weight:700;color:${esEgreso?"var(--error)":"var(--exito)"};">
              ${esEgreso?"−":"+"}${fmt(m.monto)}
            </span>
          </div>`;
      }).join("");
}

/* ============================================
   3. ALERTAS CRÍTICAS
   Agotados que más venden (top 5)
   ============================================ */
async function cargarAlertas() {
  const [{ data: inv }, { data: det }] = await Promise.all([
    sb.from("inventario").select("codigo, producto, categoria, stock_final, stock_inicial"),
    sb.from("detalle_ventas").select("codigo, cantidad")
  ]);

  const ventasMap = {};
  (det || []).forEach(d => {
    ventasMap[d.codigo] = (ventasMap[d.codigo] || 0) + Number(d.cantidad || 0);
  });

  const agotadosConVentas = (inv || [])
    .filter(p => (p.stock_final ?? p.stock_inicial ?? 0) <= 0 && ventasMap[p.codigo] > 0)
    .map(p => ({ ...p, vendido: ventasMap[p.codigo] }))
    .sort((a, b) => b.vendido - a.vendido)
    .slice(0, 5);

  document.getElementById("alertasCriticas").innerHTML = agotadosConVentas.length === 0
    ? `<p class="texto-vacio">✅ Sin alertas críticas de stock</p>`
    : agotadosConVentas.map(p => `
        <div class="alerta-stock alerta-roja">
          <div>
            <strong style="font-size:0.88rem;">${p.producto}</strong>
            <span style="display:block;font-size:0.78rem;color:var(--texto-claro);">${p.categoria || "—"}</span>
          </div>
          <span class="stock-bajo">${p.vendido} vendidas — AGOTADO</span>
        </div>`).join("");
}

/* ============================================
   4. CRM
   ============================================ */
async function cargarCRM() {
  const { data: ventas } = await sb
    .from("ventas")
    .select("id, cliente, total_general, total_pagado, saldo, estado, usuario, fecha")
    .order("fecha", { ascending: false });

  if (!ventas) return;

  // Agrupar por cliente
  const clientes = {};
  ventas.forEach(v => {
    const c = v.cliente || "Sin nombre";
    if (!clientes[c]) clientes[c] = { totalComprado: 0, saldoTotal: 0, ventas: 0 };
    clientes[c].totalComprado += Number(v.total_general || 0);
    clientes[c].saldoTotal    += Number(v.saldo         || 0);
    clientes[c].ventas++;
  });

  // Con saldo — top 5
  const conSaldo = Object.entries(clientes)
    .filter(([, d]) => d.saldoTotal > 0)
    .sort((a, b) => b[1].saldoTotal - a[1].saldoTotal)
    .slice(0, 5);

  document.getElementById("crmPendientes").innerHTML = conSaldo.length === 0
    ? `<tr><td colspan="4" class="texto-vacio">Sin clientes con saldo</td></tr>`
    : conSaldo.map(([nombre, d]) => `
        <tr>
          <td>${nombre}</td>
          <td style="color:var(--error);font-weight:700;">${fmt(d.saldoTotal)}</td>
          <td style="text-align:center;">${d.ventas}</td>
          <td><a href="pendientes.html" class="btn-outline btn-icono">Abonar</a></td>
        </tr>`).join("");

  // Mejores — top 5
  const top = Object.entries(clientes)
    .sort((a, b) => b[1].totalComprado - a[1].totalComprado)
    .slice(0, 5);

  document.getElementById("crmTop").innerHTML = top.length === 0
    ? `<tr><td colspan="3" class="texto-vacio">Sin datos</td></tr>`
    : top.map(([nombre, d]) => `
        <tr>
          <td>${nombre}</td>
          <td style="color:var(--exito);font-weight:700;">${fmt(d.totalComprado)}</td>
          <td style="text-align:center;">${d.ventas}</td>
        </tr>`).join("");

  // Ventas recientes — últimas 10
  document.getElementById("ventasRecientes").innerHTML = ventas.slice(0, 10).map(v => `
    <tr>
      <td>#${v.id}</td>
      <td>${v.cliente || "—"}</td>
      <td style="font-size:0.8rem;color:var(--texto-claro);">${v.usuario || "—"}</td>
      <td style="text-align:right;">${fmt(v.total_general)}</td>
      <td style="text-align:right;">${fmt(v.total_pagado)}</td>
      <td style="text-align:right;color:${v.saldo>0?"var(--error)":"var(--exito)"};">${fmt(v.saldo)}</td>
      <td>${badgeEstado(v.estado)}</td>
    </tr>`).join("");
}

/* ============================================
   INICIO
   ============================================ */
Promise.all([cargarVentas(), cargarCaja(), cargarAlertas(), cargarCRM()]);
