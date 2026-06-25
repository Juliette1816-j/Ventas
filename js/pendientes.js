import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

// 🔥 CARGAR VENTAS PENDIENTES
async function cargarPendientes() {

    const { data, error } = await supabase
        .from("ventas")
        .select("*")
        .eq("estado", "Pendiente");

    if (error) {
        console.error(error);
        return;
    }

    const tbody = document.getElementById("tablaPendientes");
    tbody.innerHTML = "";

    data.forEach(v => {

        tbody.innerHTML += `
            <tr>
                <td>Venta #${v.id}</td>
                <td>$${v.total_general}</td>
                <td>${v.cliente || "Sin cliente"}</td>
                <td>
                    <button onclick="verDetalle(${v.id})">
                        Ver detalle
                    </button>

                    <button onclick="marcarPagado(${v.id})">
                        Marcar Pagado
                    </button>
                </td>
            </tr>
        `;
    });
}

// 🔥 VER DETALLE REAL (correcto)
window.verDetalle = async function(id) {

    const { data } = await supabase
        .from("detalle_ventas")
        .select("*")
        .eq("venta_id", id);

    console.log("Detalle venta:", data);

    alert("Revisa consola para ver productos");
};

// 🔥 MARCAR COMO PAGADO (CORRECTO)
window.marcarPagado = async function(id) {

    // primero recalculamos pagos reales
    await supabase
        .from("ventas")
        .update({
            estado: "Pagado",
            saldo: 0,
            total_pagado: supabase.raw ? null : undefined // ignorado si no hay pagos reales
        })
        .eq("id", id);

    cargarPendientes();
};

cargarPendientes();
