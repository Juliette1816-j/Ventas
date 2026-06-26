import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

// 🔐 LOGIN CHECK
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
                    <button onclick="verDetalle(${v.id})">
                        Detalle
                    </button>

                    <button onclick="abrirAbono(${v.id})">
                        Abonar
                    </button>
                </td>
            </tr>
        `;
    });
}

// ===============================
// VER DETALLE
// ===============================
window.verDetalle = async function(id) {

    const { data } = await supabase
        .from("detalle_ventas")
        .select("*")
        .eq("venta_id", id);

    let texto = data.map(d =>
        `${d.producto} - ${d.cantidad} x $${d.precio_unitario}`
    ).join("\n");

    alert(texto);
};

// ===============================
// ABONAR
// ===============================
window.abrirAbono = function(id) {

    const monto = prompt("Ingrese monto del abono:");

    if (!monto) return;

    registrarAbono(id, Number(monto));
};

async function registrarAbono(id, monto) {

    // 1. guardar pago
    await supabase
        .from("pagos")
        .insert([{
            venta_id: id,
            monto: monto,
            medio_pago: "Manual",
            observacion: "Abono desde cartera"
        }]);

    // 2. recalcular saldo (TU FUNCIÓN EXISTENTE)
    await actualizarSaldoVenta(ventaId);

    alert("Abono registrado");

    cargarCartera();
}

/* ===============================
     ACTUALIZAR PAGO
=============================== */

async function actualizarSaldoVenta(ventaId) {

    console.log("🔵 actualizando venta:", ventaId);

    const { data: venta, error: errVenta } = await supabase
        .from("ventas")
        .select("*")
        .eq("id", ventaId)
        .single();

    if (errVenta || !venta) {
        console.error("❌ error venta:", errVenta);
        return;
    }

    const { data: pagos, error: errPagos } = await supabase
        .from("pagos")
        .select("monto")
        .eq("venta_id", ventaId);

    if (errPagos) {
        console.error("❌ error pagos:", errPagos);
        return;
    }

    let totalPagado = (pagos || []).reduce(
        (a, b) => a + Number(b.monto),
        0
    );

    let saldo = Number(venta.total_general) - totalPagado;

    console.log("💰 totalPagado:", totalPagado);
    console.log("💰 saldo:", saldo);

    const { error: errUpdate } = await supabase
        .from("ventas")
        .update({
            total_pagado: totalPagado,
            saldo: saldo,
            estado: saldo <= 0 ? "Pagado" : "Parcial"
        })
        .eq("id", ventaId);

    if (errUpdate) {
        console.error("❌ error update ventas:", errUpdate);
    } else {
        console.log("✔ venta actualizada correctamente");
    }
}

cargarCartera();
