import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

// 🔐 VALIDAR USUARIO + ROL
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

document.getElementById("usuarioInfo").innerHTML =
    `👤 Bienvenido: ${usuario.nombre} (${usuario.rol})`;

/* ===========================
        BUSCAR VENTA
=========================== */

let ventaActual = null;

async function buscarVenta() {

    const id = document.getElementById("ventaId").value;

    const { data } = await supabase
        .from("ventas")
        .select("*")
        .eq("id", id)
        .single();

    if (!data) {
        alert("Venta no encontrada");
        return;
    }

    ventaActual = data;

    document.getElementById("infoVenta").innerHTML = `
        <p><b>Cliente:</b> ${data.cliente}</p>
        <p><b>Total:</b> $${data.total_general}</p>
        <p><b>Pagado:</b> $${data.total_pagado}</p>
        <p><b>Saldo:</b> $${data.saldo}</p>
        <p><b>Estado:</b> ${data.estado}</p>
    `;

    cargarAbonos(id);
}

/* ===========================
        REGISTRAR ABONO
=========================== */

async function registrarAbono() {

    const id = document.getElementById("ventaId").value;
    const monto = Number(document.getElementById("montoAbono").value);
    const medio = document.getElementById("medioPago").value;
    const obs = document.getElementById("observacion").value;

    if (!monto) {
        alert("Ingresa monto");
        return;
    }

    // 1. insertar pago
    await supabase.from("pagos").insert([{
        venta_id: id,
        monto,
        medio_pago: medio,
        observacion: obs
    }]);

    // 2. recalcular saldo (IMPORTANTE)
    await actualizarSaldo(id);

    alert("Abono registrado");

    cargarAbonos(id);
    buscarVenta();
}

/* ===========================
        ACTUALIZAR SALDO
=========================== */
async function actualizarSaldo(ventaId) {

    const { data: venta } = await supabase
        .from("ventas")
        .select("*")
        .eq("id", ventaId)
        .single();

    const { data: pagos } = await supabase
        .from("pagos")
        .select("monto")
        .eq("venta_id", ventaId);

    let totalPagado = pagos.reduce((a, b) => a + Number(b.monto), 0);

    let saldo = venta.total_general - totalPagado;

    await supabase
        .from("ventas")
        .update({
            total_pagado: totalPagado,
            saldo: saldo,
            estado: saldo <= 0 ? "Pagado" : "Parcial"
        })
        .eq("id", ventaId);
}

/* ===========================
      HISTORIAL ABONOS
=========================== */

async function cargarAbonos(ventaId) {

    const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("venta_id", ventaId)
        .order("fecha", { ascending: false });

    const tbody = document.getElementById("tablaAbonos");

    tbody.innerHTML = "";

    data.forEach(p => {

        tbody.innerHTML += `
            <tr>
                <td>${p.fecha}</td>
                <td>$${p.monto}</td>
                <td>${p.medio_pago}</td>
            </tr>
        `;
    });
}
