const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

async function cargarPendientes() {

    const { data } = await supabase
        .from("ventas")
        .select("*")
        .eq("estado", "Pendiente");

    const tbody =
        document.getElementById("tablaPendientes");

    tbody.innerHTML = "";

    data.forEach(v => {

        tbody.innerHTML += `
            <tr>
                <td>${v.producto}</td>
                <td>$${v.total}</td>
                <td>${v.cliente}</td>
                <td>
                    <button onclick="pagar(${v.id})">
                        Marcar Pagado
                    </button>
                </td>
            </tr>
        `;
    });
}

window.pagar = async function(id) {

    await supabase
        .from("ventas")
        .update({ estado: "Pagado" })
        .eq("id", id);

    cargarPendientes();
};

cargarPendientes();
