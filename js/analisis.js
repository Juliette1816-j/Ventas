/* ============================================
   ANALISIS.JS — Análisis de mercado
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

document.getElementById("usuarioInfo").textContent = `👤 ${usuario.nombre}`;

window.cerrarSesion = function () {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html?t=" + Date.now();
};

/* ============================================
   FORMATO
   ============================================ */
function fmt(n)    { return "$" + Number(n || 0).toLocaleString("es-CO"); }
function pct(n)    { return Number(n || 0).toFixed(1) + "%"; }
function dias(f)   {
  if (!f) return "—";
  const d = Math.floor((Date.now() - new Date(f).getTime()) / 86400000);
  return d + " días";
}

function roiBadge(roi) {
  if (roi >= 100) return `<span class="badge badge-pagado">🟢 Alta</span>`;
  if (roi >= 50)  return `<span class="badge badge-parcial">🟡 Media</span>`;
  if (roi >= 0)   return `<span class="badge badge-pendiente">🔴 Baja</span>`;
  return `<span class="badge badge-pendiente">⚫ No rentable</span>`;
}

function velocidadBadge(pctRot) {
  if (pctRot >= 80) return `<span class="badge badge-pagado">🚀 Rápido</span>`;
  if (pctRot >= 40) return `<span class="badge badge-parcial">🚶 Normal</span>`;
  return `<span class="badge badge-pendiente">🐌 Lento</span>`;
}

function alertaDiasBadge(d) {
  if (d > 60)  return `<span class="badge badge-pendiente">⚠ Más de 60 días</span>`;
  if (d > 30)  return `<span class="badge badge-parcial">🕐 Más de 30 días</span>`;
  return `<span class="badge badge-pagado">✅ Reciente</span>`;
}

/* ============================================
   DATOS GLOBALES
   ============================================ */
let datosProductos = [];

/* ============================================
   CARGAR TODO
   ============================================ */
async function cargarAnalisis() {

  const [
    { data: inventario },
    { data: compras },
    { data: detalles }
  ] = await Promise.all([
    sb.from("inventario").select("*"),
    sb.from("compras").select("*").order("fecha", { ascending: true }),
    sb.from("detalle_ventas").select("codigo, producto, cantidad, precio_unitario, subtotal")
  ]);

  const inv  = inventario || [];
  const comp = compras    || [];
  const det  = detalles   || [];

  /* ── Costo por producto (última compra) ── */
  const costoMap = {};
  const fechaCompraMap = {};
  comp.forEach(c => {
    costoMap[c.codigo]       = Number(c.costo_unitario || 0);
    fechaCompraMap[c.codigo] = c.fecha;
  });

  /* ── Ventas por producto ── */
  const ventasMap = {};
  det.forEach(d => {
    if (!ventasMap[d.codigo]) ventasMap[d.codigo] = { cantidad: 0, subtotal: 0 };
    ventasMap[d.codigo].cantidad += Number(d.cantidad  || 0);
    ventasMap[d.codigo].subtotal += Number(d.subtotal  || 0);
  });

  /* ── Construir tabla de productos ── */
  datosProductos = inv.map(p => {
    const costo       = costoMap[p.codigo] || 0;
    const precioVenta = Number(p.precio_unitario || 0);
    const stockIni    = Number(p.stock_inicial   || 0);
    const stockAct    = Number(p.stock_final ?? (stockIni - (p.stock_salida || 0)));
    const vendido     = ventasMap[p.codigo]?.cantidad || 0;
    const ingresoReal = ventasMap[p.codigo]?.subtotal || 0;
    const costoVendido= costo * vendido;
    const gananciaReal= ingresoReal - costoVendido;
    const margen      = costo > 0 ? ((precioVenta - costo) / costo) * 100 : 0;
    const pctRot      = stockIni > 0 ? (vendido / stockIni) * 100 : 0;
    const capitalInv  = costo * stockIni;
    const roi         = capitalInv > 0 ? (gananciaReal / capitalInv) * 100 : 0;
    const diasInv     = fechaCompraMap[p.codigo]
      ? Math.floor((Date.now() - new Date(fechaCompraMap[p.codigo]).getTime()) / 86400000)
      : null;

    return {
      codigo:      p.codigo,
      producto:    p.producto || "—",
      categoria:   p.categoria || "Sin categoría",
      costo,
      precioVenta,
      stockIni,
      stockAct,
      vendido,
      ingresoReal,
      costoVendido,
      gananciaReal,
      margen,
      pctRot,
      capitalInv,
      roi,
      diasInv,
      fechaCompra: fechaCompraMap[p.codigo] || null
    };
  });

  /* ── Totales generales ── */
  const totalCapital   = datosProductos.reduce((a, p) => a + p.capitalInv,   0);
  const totalVendido   = datosProductos.reduce((a, p) => a + p.ingresoReal,  0);
  const totalGanancia  = datosProductos.reduce((a, p) => a + p.gananciaReal, 0);
  const totalUniVend   = datosProductos.reduce((a, p) => a + p.vendido,      0);
  const totalUniStock  = datosProductos.reduce((a, p) => a + p.stockAct,     0);
  const roiGeneral     = totalCapital > 0 ? (totalGanancia / totalCapital) * 100 : 0;

  document.getElementById("capitalInvertido").textContent  = fmt(totalCapital);
  document.getElementById("totalVendido").textContent      = fmt(totalVendido);
  document.getElementById("gananciaBruta").textContent     = fmt(totalGanancia);
  document.getElementById("pctRetorno").textContent        = pct(roiGeneral);
  document.getElementById("unidadesVendidas").textContent  = totalUniVend;
  document.getElementById("unidadesStock").textContent     = totalUniStock;

  /* ── Semáforo ── */
  renderSemaforo(roiGeneral, totalGanancia, datosProductos);

  /* ── Alertas inteligentes ── */
  renderAlertas(datosProductos);

  /* ── Categorías ── */
  renderCategorias(datosProductos);

  /* ── Filtro categorías ── */
  const cats = [...new Set(datosProductos.map(p => p.categoria))].sort();
  const sel  = document.getElementById("filtroCategoria");
  sel.innerHTML = `<option value="">Todas las categorías</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join("");

  /* ── Rentabilidad ── */
  renderRentabilidad(datosProductos);

  /* ── Rotación ── */
  renderRotacion(datosProductos);
}

/* ============================================
   SEMÁFORO
   ============================================ */
function renderSemaforo(roi, ganancia, datos) {
  const noRentables = datos.filter(p => p.vendido > 0 && p.roi < 0).length;
  const lentos      = datos.filter(p => p.pctRot < 20 && p.stockIni > 0).length;
  const agotados    = datos.filter(p => p.stockAct <= 0).length;

  let color, icono, mensaje;
  if (roi >= 80)       { color = "var(--exito)"; icono = "🟢"; mensaje = "El negocio es muy rentable. Excelente retorno sobre la inversión."; }
  else if (roi >= 40)  { color = "var(--dorado)"; icono = "🟡"; mensaje = "El negocio es rentable pero hay margen de mejora."; }
  else if (roi >= 0)   { color = "#E67E22"; icono = "🟠"; mensaje = "Rentabilidad baja. Revisar costos y precios de venta."; }
  else                 { color = "var(--error)"; icono = "🔴"; mensaje = "El negocio está perdiendo dinero. Acción urgente requerida."; }

  document.getElementById("semaforoContenido").innerHTML = `
    <div style="display:flex; align-items:center; gap:14px; padding:14px; background:var(--beige-claro); border-radius:var(--radio-sm); border-left:4px solid ${color}; margin-bottom:14px;">
      <span style="font-size:2rem;">${icono}</span>
      <div>
        <p style="font-weight:700; color:${color}; margin-bottom:4px;">ROI general: ${pct(roi)}</p>
        <p style="font-size:0.9rem; color:var(--texto-medio);">${mensaje}</p>
      </div>
    </div>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <div style="flex:1; min-width:140px; padding:10px 14px; background:${noRentables>0?'#FDE8E8':'#E8F8EF'}; border-radius:var(--radio-sm); font-size:0.88rem;">
        <strong>${noRentables}</strong> productos no rentables
      </div>
      <div style="flex:1; min-width:140px; padding:10px 14px; background:${lentos>0?'var(--dorado-suave)':'#E8F8EF'}; border-radius:var(--radio-sm); font-size:0.88rem;">
        <strong>${lentos}</strong> productos con rotación lenta
      </div>
      <div style="flex:1; min-width:140px; padding:10px 14px; background:${agotados>0?'#FDE8E8':'#E8F8EF'}; border-radius:var(--radio-sm); font-size:0.88rem;">
        <strong>${agotados}</strong> productos agotados
      </div>
    </div>
  `;
}

/* ============================================
   ALERTAS INTELIGENTES
   ============================================ */
function renderAlertas(datos) {
  const agotados = datos.filter(p => p.stockAct <= 0);
  const conVentas    = agotados.filter(p => p.vendido > 0).sort((a,b) => b.vendido - a.vendido);
  const sinVentas    = agotados.filter(p => p.vendido === 0);

  document.getElementById("agotadosTop").innerHTML = conVentas.length === 0
    ? `<p class="texto-vacio">✅ Sin agotados con ventas</p>`
    : conVentas.map(p => `
        <div class="alerta-stock alerta-roja">
          <div>
            <strong style="font-size:0.88rem;">${p.producto}</strong>
            <span style="display:block; font-size:0.78rem; color:var(--texto-claro);">${p.categoria}</span>
          </div>
          <span class="stock-bajo">${p.vendido} vendidas</span>
        </div>`).join("");

  document.getElementById("agotadosSinVentas").innerHTML = sinVentas.length === 0
    ? `<p class="texto-vacio">✅ Sin agotados sin ventas</p>`
    : sinVentas.map(p => `
        <div class="alerta-stock alerta-naranja">
          <div>
            <strong style="font-size:0.88rem;">${p.producto}</strong>
            <span style="display:block; font-size:0.78rem; color:var(--texto-claro);">${p.categoria}</span>
          </div>
          <span class="stock-medio">Sin ventas</span>
        </div>`).join("");
}

/* ============================================
   ANÁLISIS POR CATEGORÍA
   ============================================ */
function renderCategorias(datos) {
  const cats = {};
  datos.forEach(p => {
    const c = p.categoria;
    if (!cats[c]) cats[c] = { productos:0, vendido:0, capital:0, ingreso:0, ganancia:0 };
    cats[c].productos++;
    cats[c].vendido  += p.vendido;
    cats[c].capital  += p.capitalInv;
    cats[c].ingreso  += p.ingresoReal;
    cats[c].ganancia += p.gananciaReal;
  });

  const filas = Object.entries(cats).sort((a,b) => b[1].ganancia - a[1].ganancia);

  document.getElementById("tablaCategorias").innerHTML = filas.map(([cat, d]) => {
    const roi = d.capital > 0 ? (d.ganancia / d.capital) * 100 : 0;
    return `
      <tr>
        <td><strong>${cat}</strong></td>
        <td style="text-align:center;">${d.productos}</td>
        <td style="text-align:center;">${d.vendido}</td>
        <td style="text-align:right;">${fmt(d.capital)}</td>
        <td style="text-align:right;">${fmt(d.ingreso)}</td>
        <td style="text-align:right; color:${d.ganancia>=0?'var(--exito)':'var(--error)'}; font-weight:700;">${fmt(d.ganancia)}</td>
        <td style="text-align:center;">${pct(roi)}</td>
        <td>${roiBadge(roi)}</td>
      </tr>`;
  }).join("");
}

/* ============================================
   RENTABILIDAD POR PRODUCTO
   ============================================ */
function renderRentabilidad(datos) {
  const filtroC = document.getElementById("filtroCategoria").value;
  const filtroR = document.getElementById("filtroRentabilidad").value;

  let filtrado = datos.filter(p => p.costo > 0);

  if (filtroC) filtrado = filtrado.filter(p => p.categoria === filtroC);
  if (filtroR) {
    filtrado = filtrado.filter(p => {
      if (filtroR === "alta")     return p.roi >= 100;
      if (filtroR === "media")    return p.roi >= 50 && p.roi < 100;
      if (filtroR === "baja")     return p.roi >= 0  && p.roi < 50;
      if (filtroR === "negativa") return p.roi < 0;
      return true;
    });
  }

  filtrado.sort((a,b) => b.roi - a.roi);

  document.getElementById("tablaRentabilidad").innerHTML = filtrado.length === 0
    ? `<tr><td colspan="8" class="texto-vacio">Sin datos con los filtros aplicados</td></tr>`
    : filtrado.map(p => `
        <tr>
          <td>${p.producto}</td>
          <td>${p.categoria}</td>
          <td style="text-align:right;">${fmt(p.costo)}</td>
          <td style="text-align:right;">${fmt(p.precioVenta)}</td>
          <td style="text-align:center; font-weight:700; color:${p.margen>=50?'var(--exito)':p.margen>=0?'var(--dorado)':'var(--error)'};">${pct(p.margen)}</td>
          <td style="text-align:center;">${p.vendido}</td>
          <td style="text-align:right; color:${p.gananciaReal>=0?'var(--exito)':'var(--error)'}; font-weight:700;">${fmt(p.gananciaReal)}</td>
          <td>${roiBadge(p.roi)}</td>
        </tr>`).join("");
}

/* ============================================
   ROTACIÓN
   ============================================ */
function renderRotacion(datos) {
  const conVentas  = datos.filter(p => p.vendido > 0).sort((a,b) => b.pctRot - a.pctRot);
  const sinVentas  = datos.filter(p => p.vendido === 0 && p.stockIni > 0);

  document.getElementById("tablaRotacionCon").innerHTML = conVentas.length === 0
    ? `<tr><td colspan="7" class="texto-vacio">Sin ventas registradas aún</td></tr>`
    : conVentas.map(p => `
        <tr>
          <td>${p.producto}</td>
          <td>${p.categoria}</td>
          <td style="text-align:center;">${p.stockIni}</td>
          <td style="text-align:center;">${p.vendido}</td>
          <td style="text-align:center;" class="${p.stockAct<=0?'stock-bajo':p.stockAct<=5?'stock-medio':'stock-ok'}">${p.stockAct}</td>
          <td style="text-align:center; font-weight:700;">${pct(p.pctRot)}</td>
          <td>${velocidadBadge(p.pctRot)}</td>
        </tr>`).join("");

  document.getElementById("tablaRotacionSin").innerHTML = sinVentas.length === 0
    ? `<tr><td colspan="7" class="texto-vacio">✅ Todos los productos tienen al menos una venta</td></tr>`
    : sinVentas.sort((a,b) => (b.diasInv||0) - (a.diasInv||0)).map(p => `
        <tr>
          <td>${p.producto}</td>
          <td>${p.categoria}</td>
          <td style="text-align:center;">${p.stockIni}</td>
          <td style="text-align:center;" class="stock-bajo">${p.stockAct}</td>
          <td style="text-align:right;">${fmt(p.capitalInv)}</td>
          <td style="text-align:center;">${p.diasInv !== null ? p.diasInv + " días" : "—"}</td>
          <td>${p.diasInv !== null ? alertaDiasBadge(p.diasInv) : "—"}</td>
        </tr>`).join("");
}

/* ============================================
   FILTROS
   ============================================ */
document.getElementById("filtroCategoria").addEventListener("change",    () => renderRentabilidad(datosProductos));
document.getElementById("filtroRentabilidad").addEventListener("change", () => renderRentabilidad(datosProductos));

/* ============================================
   INICIO
   ============================================ */
cargarAnalisis();
