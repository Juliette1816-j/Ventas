/* ============================================
   CAJA.JS — Movimientos y bolsas
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
let movimientosData = [];

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function fmtFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/* ============================================
   TIPO → badge color
   ============================================ */
function tipoBadge(tipo) {
  const map = {
    ingreso:  { cls: "badge-pagado",    label: "💵 Ingreso"  },
    capital:  { cls: "badge-parcial",   label: "🔄 Capital"  },
    ganancia: { cls: "badge-pendiente", label: "💸 Ganancia" },
    gasto:    { cls: "badge-pendiente", label: "🧾 Gasto"    }
  };
  const t = map[tipo] || { cls: "", label: tipo };
  return `<span class="badge ${t.cls}">${t.label}</span>`;
}

/* ============================================
   CALCULAR BOLSAS
   ============================================ */
function calcularBolsas(datos) {
  let caja      = 0;
  let capital   = 0;
  let ganancias = 0;
  let socia1    = 0;
  let socia2    = 0;

  datos.forEach(m => {
    const monto = Number(m.monto || 0);
    switch (m.tipo) {
      case "ingreso":
        caja += monto;
        break;
      case "capital":
        caja    -= monto;
        capital += monto;
        break;
      case "ganancia":
        caja      -= monto;
        ganancias += monto;
        if (m.socia === "Socia 1")  socia1 += monto;
        else if (m.socia === "Socia 2") socia2 += monto;
        else if (m.socia === "Ambas") {
          socia1 += monto / 2;
          socia2 += monto / 2;
        }
        break;
      case "gasto":
        caja -= monto;
        break;
    }
  });

  document.getElementById("saldoCaja").textContent     = fmt(caja);
  document.getElementById("saldoCapital").textContent  = fmt(capital);
  document.getElementById("saldoGanancias").textContent= fmt(ganancias);
  document.getElementById("saldoSocia1").textContent   = fmt(socia1);
  document.getElementById("saldoSocia2").textContent   = fmt(socia2);

  // Color negativo en caja
  document.getElementById("saldoCaja").style.color = caja < 0 ? "var(--error)" : "var(--dorado)";
}

/* ============================================
   CARGAR MOVIMIENTOS
   ============================================ */
async function cargarMovimientos() {
  const tbody = document.getElementById("tablaMovimientos");
  tbody.innerHTML = `<tr><td colspan="8" class="texto-vacio">Cargando...</td></tr>`;

  const { data, error } = await sb
    .from("caja")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="texto-vacio">Error: ${error.message}</td></tr>`;
    return;
  }

  movimientosData = data || [];
  calcularBolsas(movimientosData);
  renderMovimientos(movimientosData);
}

/* ============================================
   RENDER TABLA
   ============================================ */
function renderMovimientos(datos) {
  const tbody = document.getElementById("tablaMovimientos");

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="texto-vacio">Sin movimientos</td></tr>`;
    return;
  }

  tbody.innerHTML = datos.map(m => {
    const esEgreso = ["capital", "ganancia", "gasto"].includes(m.tipo);
    const montoStr = `<span style="color:${esEgreso ? "var(--error)" : "var(--exito)"}; font-weight:700;">
      ${esEgreso ? "−" : "+"}${fmt(m.monto)}
    </span>`;

    return `
      <tr>
        <td>#${m.id}</td>
        <td style="white-space:nowrap;">${fmtFecha(m.fecha)}</td>
        <td>${tipoBadge(m.tipo)}</td>
        <td>${m.concepto || "—"}</td>
        <td>${m.socia || "—"}</td>
        <td>${m.referencia || "—"}</td>
        <td style="text-align:right;">${montoStr}</td>
        <td style="text-align:right;">${m.saldo_caja != null ? fmt(m.saldo_caja) : "—"}</td>
      </tr>
    `;
  }).join("");
}

/* ============================================
   MOSTRAR/OCULTAR CAMPO SOCIA
   ============================================ */
document.getElementById("tipoMovimiento").addEventListener("change", function () {
  document.getElementById("grupoSocia").hidden = this.value !== "ganancia";
});

/* ============================================
   REGISTRAR MOVIMIENTO
   ============================================ */
document.getElementById("btnRegistrarMovimiento").addEventListener("click", async function () {
  const errorEl  = document.getElementById("movimientoError");
  errorEl.hidden = true;

  const tipo      = document.getElementById("tipoMovimiento").value;
  const monto     = parseFloat(document.getElementById("montoMovimiento").value);
  const concepto  = document.getElementById("conceptoMovimiento").value.trim();
  const referencia= document.getElementById("referenciaMovimiento").value.trim();
  const socia     = tipo === "ganancia"
    ? document.getElementById("sociaMovimiento").value
    : null;

  if (!monto || monto <= 0) {
    errorEl.textContent = "Ingresa un monto válido.";
    errorEl.hidden = false;
    return;
  }

  if (!concepto) {
    errorEl.textContent = "Ingresa un concepto.";
    errorEl.hidden = false;
    return;
  }

  // Calcular saldo_caja actual
  let saldoActual = 0;
  movimientosData.forEach(m => {
    const v = Number(m.monto || 0);
    if (m.tipo === "ingreso") saldoActual += v;
    else saldoActual -= v;
  });

  const nuevoSaldo = tipo === "ingreso"
    ? saldoActual + monto
    : saldoActual - monto;

  this.disabled    = true;
  this.textContent = "Guardando...";

  try {
    // Si es ganancia para "Ambas", insertar dos registros
    if (tipo === "ganancia" && socia === "Ambas") {
      const mitad = monto / 2;

      for (const s of ["Socia 1", "Socia 2"]) {
        const saldoParcial = s === "Socia 1" ? saldoActual - mitad : saldoActual - monto;
        const { error } = await sb.from("caja").insert([{
          tipo,
          concepto: concepto + ` (${s})`,
          monto:    mitad,
          socia:    s,
          referencia: referencia || null,
          saldo_caja: saldoParcial,
          usuario:  usuario.username
        }]);
        if (error) throw error;
      }
    } else {
      const { error } = await sb.from("caja").insert([{
        tipo,
        concepto,
        monto,
        socia:     socia || null,
        referencia: referencia || null,
        saldo_caja: nuevoSaldo,
        usuario:   usuario.username
      }]);
      if (error) throw error;
    }

    // Limpiar form
    document.getElementById("montoMovimiento").value    = "";
    document.getElementById("conceptoMovimiento").value  = "";
    document.getElementById("referenciaMovimiento").value= "";

    mostrarMensaje("✔ Movimiento registrado", "exito");
    await cargarMovimientos();

  } catch (err) {
    console.error(err);
    errorEl.textContent = `Error: ${err.message}`;
    errorEl.hidden = false;
  } finally {
    this.disabled    = false;
    this.textContent = "✔ Registrar movimiento";
  }
});

/* ============================================
   FILTROS
   ============================================ */
function aplicarFiltros() {
  const tipo  = document.getElementById("filtroTipo").value;
  const desde = document.getElementById("filtroDesde").value;
  const hasta = document.getElementById("filtroHasta").value;

  const filtrado = movimientosData.filter(m => {
    const coincideTipo  = tipo  ? m.tipo === tipo : true;
    const fecha         = m.fecha ? m.fecha.slice(0, 10) : "";
    const coincideDesde = desde ? fecha >= desde : true;
    const coincideHasta = hasta ? fecha <= hasta : true;
    return coincideTipo && coincideDesde && coincideHasta;
  });

  renderMovimientos(filtrado);
}

document.getElementById("filtroTipo").addEventListener("change", aplicarFiltros);
document.getElementById("filtroDesde").addEventListener("change", aplicarFiltros);
document.getElementById("filtroHasta").addEventListener("change", aplicarFiltros);
document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
  document.getElementById("filtroTipo").value  = "";
  document.getElementById("filtroDesde").value = "";
  document.getElementById("filtroHasta").value = "";
  renderMovimientos(movimientosData);
});

/* ============================================
   MENSAJE FLASH
   ============================================ */
function mostrarMensaje(texto, tipo) {
  const el = document.createElement("div");
  el.className   = tipo === "exito" ? "msg-exito" : "msg-error";
  el.textContent = texto;
  el.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;max-width:320px;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ============================================
   INICIO
   ============================================ */
cargarMovimientos();
