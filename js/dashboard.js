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

// ===============================
// REDIRECCIÓN
// ===============================
window.go = function(url) {
    window.location.href = url;
};

// ===============================
// RESUMEN GENERAL
// ===============================
async function cargarResumen() {

    const { data: ventas } = await supabase
        .from("ventas")
        .select("*");

    let totalVentas = 0;
    let totalCartera = 0;
    let ventasPendientes = 0;

    ventas.forEach(v => {

        totalVentas += v.total_general;

        if (v.saldo > 0) {
            totalCartera += v.saldo;
            ventasPendientes++;
        }
    });

    document.getElementById("resumen").innerHTML = `
        <p>💰 Total ventas: $${totalVentas}</p>
        <p>⚠ Cartera: $${totalCartera}</p>
        <p>📌 Ventas pendientes: ${ventasPendientes}</p>
    `;
}

cargarResumen();
