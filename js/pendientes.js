import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(

// ===============================
// LOGIN CHECK
// ===============================
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

// ===============================
// CARGAR CARTERA
// ===============================
async function cargarCartera() {

    const { data, error } = await supabase
        .from("ventas")
        .select("*")
        .order("fecha", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const tbody = document.getElementById("tablaPendientes");
    tbody.innerHTML = "";

    data.forEach(v => {

        tbody.innerHTML += `
            <tr>
                <td>#${v.id}</td>
                <td>${v.cliente || "Sin cliente"}</td>
                <td>$${v.total_general}</td>
                <td>$${v.total_pagado}</td>
                <td>$${v.saldo}</td>
                <td>${v.estado}</td>
                <td>
                    <button onclick="verDetalle(${v.id})">Detalle</button>
                    <button onclick="abrirAbono(${v.id})">Abonar</button>
                </td>
            </tr>
        `;
    });
}

// ===============================
// VER DETALLE
// ===============================
window.verDetalle = async function (id) {

    const { data } = await supabase
        .from("detalle_ventas")
        .select("*")
        .eq("venta_id", id);

    if (!data) return;

    let texto = data.map(d =>
        `${d.producto} - ${d.cantidad} x $${d.precio_unitario}`
    ).join("\n");

    alert(texto);
};

// ===============================
// ABRIR ABONO
// ===============================
window.abrirAbono = function (id) {

    const monto = prompt("Ingrese monto del abono:");

    if (!monto || isNaN(monto)) return;

    const medio = prompt("Medio de pago: Efectivo / Transferencia Breve") || "Efectivo";

    registrarAbono(id, Number(monto), medio);
};

// ===============================
// REGISTRAR ABONO
// ===============================
async function registrarAbono(id, monto, medioPago) {

    console.log("💰 Abono venta:", id, monto);

    // 1. guardar pago
    const { error: errorPago } = await supabase
        .from("pagos")
        .insert([{
            venta_id: id,
            monto: monto,
            medio_pago: medioPago,
            observacion: "Abono desde cartera"
        }]);

    if (errorPago) {
        console.error("Error pago:", errorPago);
        return;
    }

    // 2. actualizar venta
    await actualizarSaldoVenta(id);

    // 3. refrescar tabla
    await cargarCartera();

    alert("✔ Abono registrado correctamente");
}

// ===============================
// ACTUALIZAR VENTA (CRÍTICO)
// ===============================
async function actualizarSaldoVenta(ventaId) {

    const { data: venta } = await supabase
        .from("ventas")
        .select("total_general")
        .eq("id", ventaId)
        .single();

    const { data: pagos } = await supabase
        .from("pagos")
        .select("monto")
        .eq("venta_id", ventaId);

    let totalPagado = (pagos || []).reduce(
        (a, b) => a + Number(b.monto),
        0
    );

    let total = Number(venta.total_general);
    let saldo = total - totalPagado;

    console.log("TOTAL:", total);
    console.log("PAGADO:", totalPagado);
    console.log("SALDO:", saldo);

    const { error } = await supabase
        .from("ventas")
        .update({
            total_pagado: totalPagado,
            saldo: saldo,
            estado: saldo <= 0 ? "Pagado" : "Parcial"
        })
        .eq("id", ventaId);

    if (error) {
        console.error("ERROR UPDATE VENTA:", error);
    }
}

// ===============================
// INIT
// ===============================
cargarCartera(); "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);
