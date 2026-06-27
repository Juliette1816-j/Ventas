/* ============================================
   COMPRAS.JS — Registro de lotes
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

function cerrarSesion() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html?t=" + Date.now();
}

/* --- Estado --- */
let filasLote      = [];
let historialData  = [];

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function fmtFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

function fmtPct(n) {
  return Number(n || 0).toFixed(1) + "%";
}

/* ============================================
   DESCARGAR PLANTILLA CSV
   ============================================ */
document.getElementById("btnDescargarPlantilla").addEventListener("click", () => {
  const cabecera = "codigo,producto,categoria,publico,cantidad,costo_unitario,precio_venta,imagenes";
  const ejemplos = [
    "Surtifacil-0001,Media valeta surtida_1,Medias,Adulto,12,3500,8000,https://url.com/imagen.jpg",
    "NUEVO-001,Producto nuevo,Accesorios,Mujer,5,5000,15000,"
  ].join("\n");

  const blob = new Blob([cabecera + "\n" + ejemplos], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "plantilla_compras.csv";
  a.click();
  URL.revokeObjectURL(url);
});

/* ============================================
   LEER CSV Y MOSTRAR PREVIEW
   ============================================ */
document.getElementById("archivoCSV").addEventListener("change", async (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lote = document.getElementById("nombreLote").value.trim();
  if (!lote) {
    mostrarMensaje("Ingresa el nombre del lote antes de subir el CSV", "error");
    e.target.value = "";
    return;
  }

  const texto   = await archivo.text();
  const lineas  = texto.trim().split("\n");
  const cabecera = lineas[0].split(",").map(c => c.trim().toLowerCase());

  filasLote = [];

  for (let i = 1; i < lineas.length; i++) {
    const valores = lineas[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const fila    = {};
    cabecera.forEach((col, idx) => fila[col] = valores[idx] || "");

    if (!fila.codigo || !fila.producto) continue;

    const cantidad      = parseInt(fila.cantidad)        || 0;
    const costoUnit     = parseFloat(fila.costo_unitario) || 0;
    const precioVenta   = parseFloat(fila.precio_venta)  || 0;
    const valorMayorista = cantidad * costoUnit;
    const pctGanancia   = costoUnit > 0
      ? ((precioVenta - costoUnit) / costoUnit) * 100
      : 0;
    const gananciaEsperada = valorMayorista * (pctGanancia / 100);

    filasLote.push({
      lote,
      codigo:             fila.codigo,
      producto:           fila.producto,
      categoria:          fila.categoria   || null,
      publico:            fila.publico     || null,
      cantidad,
      costo_unitario:     costoUnit,
      precio_venta:       precioVenta,
      imagenes:           fila.imagenes    || null,
      valor_total:        valorMayorista,
      porcentaje_ganancia: parseFloat(pctGanancia.toFixed(2)),
      ganancia_esperada:  parseFloat(gananciaEsperada.toFixed(2)),
      usuario:            usuario.username
    });
  }

  if (filasLote.length === 0) {
    mostrarMensaje("El CSV no tiene filas válidas", "error");
    return;
  }

  mostrarPreview();
  e.target.value = "";
});

/* ============================================
   MOSTRAR PREVIEW
   ============================================ */
async function mostrarPreview() {
  // Verificar cuáles códigos ya existen en inventario
  const codigos = filasLote.map(f => f.codigo);
  const { data: existentes } = await sb
    .from("inventario")
    .select("codigo")
    .in("codigo", codigos);

  const codigosExistentes = new Set((existentes || []).map(e => e.codigo));

  // Calcular totales
  const totalMayorista = filasLote.reduce((a, f) => a + f.valor_total, 0);
  const totalVenta     = filasLote.reduce((a, f) => a + (f.cantidad * f.precio_venta), 0);
  const totalGanancia  = filasLote.reduce((a, f) => a + f.ganancia_esperada, 0);

  document.getElementById("resumenProductos").textContent  = filasLote.length;
  document.getElementById("resumenMayorista").textContent  = fmt(totalMayorista);
  document.getElementById("resumenVenta").textContent      = fmt(totalVenta);
  document.getElementById("resumenGanancia").textContent   = fmt(totalGanancia);

  // Render tabla preview
  document.getElementById("tablaPreview").innerHTML = filasLote.map(f => {
    const esNuevo = !codigosExistentes.has(f.codigo);
    return `
      <tr>
        <td><span class="codigo-tag">${f.codigo}</span></td>
        <td>${f.producto}</td>
        <td style="text-align:center;">${f.cantidad}</td>
        <td style="text-align:right;">${fmt(f.costo_unitario)}</td>
        <td style="text-align:right;">${fmt(f.precio_venta)}</td>
        <td style="text-align:center;">
          <span class="${f.porcentaje_ganancia >= 100 ? 'stock-ok' : 'stock-medio'}">
            ${fmtPct(f.porcentaje_ganancia)}
          </span>
        </td>
        <td style="text-align:right;">${fmt(f.valor_total)}</td>
        <td style="text-align:right;">${fmt(f.ganancia_esperada)}</td>
        <td>
          <span class="badge ${esNuevo ? 'badge-pendiente' : 'badge-pagado'}">
            ${esNuevo ? '🆕 Nuevo' : '📦 Suma stock'}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  document.getElementById("previewCard").hidden = false;
  document.getElementById("previewCard").scrollIntoView({ behavior: "smooth" });
}

/* ============================================
   CANCELAR IMPORT
   ============================================ */
document.getElementById("btnCancelarImport").addEventListener("click", () => {
  filasLote = [];
  document.getElementById("previewCard").hidden = true;
  document.getElementById("nombreLote").value   = "";
});

/* ============================================
   CONFIRMAR E IMPORTAR
   ============================================ */
document.getElementById("btnConfirmarImport").addEventListener("click", async () => {
  if (filasLote.length === 0) return;

  const btn = document.getElementById("btnConfirmarImport");
  btn.disabled    = true;
  btn.textContent = "Importando...";

  try {
    let insertados   = 0;
    let actualizados = 0;
    let errores      = 0;
    let totalCapital = 0;

    for (const fila of filasLote) {
      // 1. Registrar en tabla compras
      const { error: errCompra } = await sb.from("compras").insert([{
        lote:                fila.lote,
        codigo:              fila.codigo,
        producto:            fila.producto,
        cantidad:            fila.cantidad,
        costo_unitario:      fila.costo_unitario,
        valor_total:         fila.valor_total,
        precio_venta:        fila.precio_venta,
        porcentaje_ganancia: fila.porcentaje_ganancia,
        ganancia_esperada:   fila.ganancia_esperada,
        usuario:             fila.usuario
      }]);

      if (errCompra) { errores++; continue; }

      const esHistorico = document.getElementById("esHistorico").checked;

// 2. Solo tocar inventario si NO es histórico
if (!esHistorico) {
  const { data: prodExistente } = await sb
    .from("inventario")
    .select("codigo, stock_inicial, stock_salida, stock_final")
    .eq("codigo", fila.codigo)
    .single();

  if (prodExistente) {
    const nuevoInicial = (prodExistente.stock_inicial || 0) + fila.cantidad;
    const nuevoFinal   = Math.max(nuevoInicial - (prodExistente.stock_salida || 0), 0);

    await sb.from("inventario").update({
      stock_inicial:   nuevoInicial,
      stock_final:     nuevoFinal,
      precio_unitario: fila.precio_venta,
      ...(fila.imagenes ? { imagenes: fila.imagenes } : {})
    }).eq("codigo", fila.codigo);

    actualizados++;
  } else {
    await sb.from("inventario").insert([{
      codigo:          fila.codigo,
      producto:        fila.producto,
      categoria:       fila.categoria,
      publico:         fila.publico,
      stock_inicial:   fila.cantidad,
      stock_salida:    0,
      stock_final:     fila.cantidad,
      precio_unitario: fila.precio_venta,
      imagenes:        fila.imagenes || null,
      fecha:           new Date().toISOString()
    }]);
    insertados++;
  }
} else {
  // Histórico — contar como "registrado" sin tocar inventario
  insertados++;
}

    // 3. Registrar salida de capital en caja
    if (totalCapital > 0) {
      const loteNombre = filasLote[0].lote;
      await sb.from("caja").insert([{
        tipo:       "capital",
        concepto:   `Compra lote: ${loteNombre}`,
        monto:      totalCapital,
        referencia: loteNombre,
        usuario:    usuario.username
      }]);
    }

    mostrarMensaje(
      `✔ Lote importado — ${insertados} nuevos · ${actualizados} actualizados · ${errores} errores`,
      errores > 0 ? "error" : "exito"
    );

    filasLote = [];
    document.getElementById("previewCard").hidden = true;
    document.getElementById("nombreLote").value   = "";
    await cargarHistorial();

  } catch (err) {
    console.error(err);
    mostrarMensaje("Error al importar el lote. Revisa la consola.", "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "✔ Confirmar e importar lote";
  }
});

/* ============================================
   CARGAR HISTORIAL
   ============================================ */
async function cargarHistorial() {
  const tbody = document.getElementById("tablaHistorial");
  tbody.innerHTML = `<tr><td colspan="10" class="texto-vacio">Cargando...</td></tr>`;

  const { data, error } = await sb
    .from("compras")
    .select("*")
    .order("fecha", { ascending: false });

  if (error || !data) {
    tbody.innerHTML = `<tr><td colspan="10" class="texto-vacio">Error cargando historial</td></tr>`;
    return;
  }

  historialData = data;
  renderHistorial(data);
}

/* ============================================
   RENDER HISTORIAL
   ============================================ */
function renderHistorial(datos) {
  const tbody = document.getElementById("tablaHistorial");

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="texto-vacio">Sin registros</td></tr>`;
    return;
  }

  tbody.innerHTML = datos.map(c => `
    <tr>
      <td>${fmtFecha(c.fecha)}</td>
      <td><span class="badge badge-parcial">${c.lote}</span></td>
      <td><span class="codigo-tag">${c.codigo}</span></td>
      <td>${c.producto}</td>
      <td style="text-align:center;">${c.cantidad}</td>
      <td style="text-align:right;">${fmt(c.costo_unitario)}</td>
      <td style="text-align:right;">${fmt(c.precio_venta)}</td>
      <td style="text-align:center;">
        <span class="${c.porcentaje_ganancia >= 100 ? 'stock-ok' : 'stock-medio'}">
          ${fmtPct(c.porcentaje_ganancia)}
        </span>
      </td>
      <td style="text-align:right;">${fmt(c.valor_total)}</td>
      <td style="text-align:right;">${fmt(c.ganancia_esperada)}</td>
    </tr>
  `).join("");
}

document.getElementById("esHistorico").checked = false;

/* ============================================
   FILTROS HISTORIAL
   ============================================ */
function aplicarFiltros() {
  const buscar = document.getElementById("buscarLote").value.toLowerCase();
  const fecha  = document.getElementById("filtroFecha").value;

  const filtrado = historialData.filter(c => {
    const coincide = (c.lote || "").toLowerCase().includes(buscar) ||
                     (c.producto || "").toLowerCase().includes(buscar);
    const coincideFecha = fecha
      ? new Date(c.fecha).toISOString().split("T")[0] === fecha
      : true;
    return coincide && coincideFecha;
  });

  renderHistorial(filtrado);
}

document.getElementById("buscarLote").addEventListener("input", aplicarFiltros);
document.getElementById("filtroFecha").addEventListener("change", aplicarFiltros);
document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
  document.getElementById("buscarLote").value  = "";
  document.getElementById("filtroFecha").value = "";
  renderHistorial(historialData);
});

/* ============================================
   MENSAJE FLASH
   ============================================ */
function mostrarMensaje(texto, tipo) {
  const el = document.createElement("div");
  el.className   = tipo === "exito" ? "msg-exito" : "msg-error";
  el.textContent = texto;
  el.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:999;max-width:320px;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ============================================
   CLASES CSS FALTANTES — agregar al style.css
   .codigo-tag, .tabla-img, .texto-ayuda, .btn-upload, .preview-img
   ============================================ */

/* ============================================
   INICIO
   ============================================ */
cargarHistorial();
