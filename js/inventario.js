/* ============================================
   INVENTARIO.JS
   Tabla: public.inventario
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
let inventarioData = [];
let productoActual = null;

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function stockClass(stock) {
  if (stock <= 0)  return "stock-bajo";
  if (stock <= 5)  return "stock-medio";
  return "stock-ok";
}

/* ============================================
   CARGAR INVENTARIO
   ============================================ */
async function cargarInventario() {
  const tbody = document.getElementById("tablaInventario");
  tbody.innerHTML = `<tr><td colspan="10" class="texto-vacio">Cargando...</td></tr>`;

  const { data, error } = await sb
    .from("inventario")
    .select("*")
    .order("categoria", { ascending: true });

  console.log("inventario data:", data);
  console.log("inventario error:", error);

  if (error) {
    tbody.innerHTML = `<tr><td colspan="10" class="texto-vacio">Error: ${error.message}</td></tr>`;
    return;
  }

  inventarioData = data || [];
  actualizarResumen(inventarioData);
  poblarCategorias(inventarioData);
  renderTabla(inventarioData);
}

/* ============================================
   RESUMEN CARDS
   ============================================ */
function actualizarResumen(datos) {
  const total         = datos.length;
  const unidadesIni   = datos.reduce((a, p) => a + (p.stock_inicial || 0), 0);
  const unidadesDisp  = datos.reduce((a, p) => a + (p.stock_final ?? calcFinal(p)), 0);
  const bajo          = datos.filter(p => { const s = p.stock_final ?? calcFinal(p); return s > 0 && s <= 5; }).length;
  const agotados      = datos.filter(p => (p.stock_final ?? calcFinal(p)) <= 0).length;

  document.getElementById("resumenTotal").textContent       = total;
  document.getElementById("resumenUnidadesIni").textContent = unidadesIni.toLocaleString("es-CO");
  document.getElementById("resumenUnidadesDisp").textContent= unidadesDisp.toLocaleString("es-CO");
  document.getElementById("resumenBajo").textContent        = bajo;
  document.getElementById("resumenAgotados").textContent    = agotados;
}

function calcFinal(p) {
  return (p.stock_inicial || 0) - (p.stock_salida || 0);
}

/* ============================================
   POBLAR FILTRO CATEGORÍAS
   ============================================ */
function poblarCategorias(datos) {
  const select = document.getElementById("filtroCategoria");
  const cats   = [...new Set(datos.map(p => p.categoria).filter(Boolean))].sort();
  select.innerHTML = `<option value="">Todas las categorías</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

/* ============================================
   RENDER TABLA
   ============================================ */
function renderTabla(datos) {
  const tbody = document.getElementById("tablaInventario");

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="texto-vacio">Sin productos</td></tr>`;
    return;
  }

  tbody.innerHTML = datos.map(p => {
    const stockFinal = p.stock_final ?? calcFinal(p);
    const cls        = stockClass(stockFinal);
    const img        = p.imagenes
      ? `<img src="${p.imagenes}" alt="${p.producto}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--beige-borde);"
             onerror="this.style.display='none'">`
      : `<span style="font-size:1.4rem;">📦</span>`;

    return `
      <tr>
        <td style="text-align:center;">${img}</td>
        <td style="font-family:monospace;font-size:0.82rem;">${p.codigo}</td>
        <td>${p.producto || "—"}</td>
        <td>${p.categoria || "—"}</td>
        <td style="text-align:center;">${p.publico || "—"}</td>
        <td style="text-align:right;">${fmt(p.precio_unitario)}</td>
        <td style="text-align:center;">${p.stock_inicial ?? "—"}</td>
        <td style="text-align:center;">${p.stock_salida ?? 0}</td>
        <td style="text-align:center;" class="${cls}"><strong>${stockFinal}</strong></td>
        <td>
          <button class="btn-outline btn-icono" onclick="abrirEditar('${p.codigo.replace(/'/g, "\\'")}')">✏️ Editar</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* ============================================
   FILTROS
   ============================================ */
function aplicarFiltros() {
  const buscar    = document.getElementById("buscarProducto").value.toLowerCase();
  const categoria = document.getElementById("filtroCategoria").value;
  const stockF    = document.getElementById("filtroStock").value;

  const filtrado = inventarioData.filter(p => {
    const nombre  = (p.producto || "").toLowerCase();
    const codigo  = (p.codigo   || "").toLowerCase();
    const sf      = p.stock_final ?? calcFinal(p);

    const coincideBuscar    = nombre.includes(buscar) || codigo.includes(buscar);
    const coincideCategoria = categoria ? p.categoria === categoria : true;
    const coincideStock     =
      stockF === "ok"     ? sf > 5 :
      stockF === "bajo"   ? sf > 0 && sf <= 5 :
      stockF === "agotado"? sf <= 0 : true;

    return coincideBuscar && coincideCategoria && coincideStock;
  });

  renderTabla(filtrado);
}

document.getElementById("buscarProducto").addEventListener("input", aplicarFiltros);
document.getElementById("filtroCategoria").addEventListener("change", aplicarFiltros);
document.getElementById("filtroStock").addEventListener("change", aplicarFiltros);

/* ============================================
   MODAL EDITAR
   ============================================ */
window.abrirEditar = function (codigo) {
  const p = inventarioData.find(x => x.codigo === codigo);
  if (!p) return;

  productoActual = p;

  document.getElementById("editCodigo").value       = p.codigo;
  document.getElementById("editProducto").value     = p.producto || "";
  document.getElementById("editPrecio").value       = p.precio_unitario || "";
  document.getElementById("editStockInicial").value = p.stock_inicial || "";
  document.getElementById("editImagen").value       = p.imagenes || "";
  document.getElementById("editError").hidden       = true;

  // Preview imagen
  actualizarPreview(p.imagenes);

  document.getElementById("modalEditar").hidden = false;
};

window.cerrarModal = function () {
  document.getElementById("modalEditar").hidden = true;
  productoActual = null;
};

// Preview en vivo al cambiar URL imagen
document.getElementById("editImagen").addEventListener("input", function () {
  actualizarPreview(this.value);
});

function actualizarPreview(url) {
  const div = document.getElementById("previewImagen");
  if (url && url.startsWith("http")) {
    div.innerHTML = `<img src="${url}" alt="preview"
      style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--beige-borde);margin-top:10px;"
      onerror="this.style.display='none'">`;
  } else {
    div.innerHTML = "";
  }
}

/* ============================================
   GUARDAR EDICIÓN
   ============================================ */
document.getElementById("btnGuardarEdicion").addEventListener("click", async function () {
  const errorEl = document.getElementById("editError");
  const btn     = this;
  errorEl.hidden = true;

  const precio       = parseFloat(document.getElementById("editPrecio").value);
  const stockInicial = parseInt(document.getElementById("editStockInicial").value);
  const imagen       = document.getElementById("editImagen").value.trim();

  if (isNaN(precio) || precio < 0) {
    errorEl.textContent = "Ingresa un precio válido.";
    errorEl.hidden = false;
    return;
  }

  if (isNaN(stockInicial) || stockInicial < 0) {
    errorEl.textContent = "Ingresa un stock inicial válido.";
    errorEl.hidden = false;
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const stockSalida = productoActual.stock_salida || 0;
  const stockFinal  = stockInicial - stockSalida;

  const { error } = await sb
    .from("inventario")
    .update({
      precio_unitario: precio,
      stock_inicial:   stockInicial,
      stock_final:     stockFinal,
      imagenes:        imagen || null
    })
    .eq("codigo", productoActual.codigo);

  if (error) {
    errorEl.textContent = `Error: ${error.message}`;
    errorEl.hidden = false;
    btn.disabled    = false;
    btn.textContent = "Guardar cambios";
    return;
  }

  cerrarModal();
  mostrarMensaje("✔ Producto actualizado", "exito");
  await cargarInventario();

  btn.disabled    = false;
  btn.textContent = "Guardar cambios";
});

/* ============================================
   CERRAR MODAL CON CLICK FUERA
   ============================================ */
document.getElementById("modalEditar").addEventListener("click", function (e) {
  if (e.target === this) cerrarModal();
});

/* ============================================
   DESCARGAR PLANTILLA CSV
   ============================================ */
document.getElementById("btnDescargarPlantilla").addEventListener("click", function () {
  const cabecera = "codigo,producto,categoria,publico,precio_unitario,stock_inicial,imagenes";
  const ejemplo  = "P001,Medias rayas,Medias,Mujer,8500,10,https://url-imagen.com/foto.jpg";
  const blob     = new Blob([cabecera + "\n" + ejemplo], { type: "text/csv;charset=utf-8;" });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement("a");
  a.href         = url;
  a.download     = "plantilla_inventario.csv";
  a.click();
  URL.revokeObjectURL(url);
});

/* ============================================
   IMPORTAR CSV
   ============================================ */
document.getElementById("archivoCSV").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const resultadoEl = document.getElementById("importarResultado");
  resultadoEl.innerHTML = `<p class="texto-ayuda">Procesando...</p>`;

  const texto  = await file.text();
  const lineas = texto.trim().split("\n");
  const cabecera = lineas[0].split(",").map(c => c.trim().toLowerCase());

  const filas = lineas.slice(1).map(l => {
    const vals = l.split(",").map(v => v.trim());
    const obj  = {};
    cabecera.forEach((col, i) => obj[col] = vals[i] || null);
    return obj;
  }).filter(f => f.codigo);

  if (filas.length === 0) {
    resultadoEl.innerHTML = `<p class="msg-error">No se encontraron filas válidas.</p>`;
    return;
  }

  // Upsert por código
  const registros = filas.map(f => ({
    codigo:          f.codigo,
    producto:        f.producto        || null,
    categoria:       f.categoria       || null,
    publico:         f.publico         || null,
    precio_unitario: f.precio_unitario ? parseInt(f.precio_unitario) : null,
    stock_inicial:   f.stock_inicial   ? parseInt(f.stock_inicial)   : null,
    stock_final:     f.stock_inicial   ? parseInt(f.stock_inicial)   : null,
    imagenes:        f.imagenes        || null,
    stock_salida:    0
  }));

  const { error } = await sb
    .from("inventario")
    .upsert(registros, { onConflict: "codigo" });

  if (error) {
    resultadoEl.innerHTML = `<p class="msg-error">Error al importar: ${error.message}</p>`;
    return;
  }

  resultadoEl.innerHTML = `<p class="msg-exito">✔ ${registros.length} productos importados/actualizados.</p>`;
  this.value = "";
  await cargarInventario();
});

/* ============================================
   MENSAJE FLASH
   ============================================ */
function mostrarMensaje(texto, tipo) {
  const el      = document.createElement("div");
  el.className  = tipo === "exito" ? "msg-exito" : "msg-error";
  el.textContent = texto;
  el.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;max-width:300px;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ============================================
   INICIO
   ============================================ */
cargarInventario();
