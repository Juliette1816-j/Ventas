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

async function dashboard() {

    const { data } =
        await supabase
            .from("ventas")
            .select("*");

    let hoy = 0;
    let mes = 0;
    let pendiente = 0;

    const fechaHoy =
        new Date().toISOString().split("T")[0];

    data.forEach(v => {

        if (v.fecha?.includes(fechaHoy)) {
            hoy += v.total;
        }

        mes += v.total;

        if (v.estado === "Pendiente") {
            pendiente += v.total;
        }
    });

    document.getElementById("hoy").innerText =
        "$" + hoy;

    document.getElementById("mes").innerText =
        "$" + mes;

    document.getElementById("pendiente").innerText =
        "$" + pendiente;
}

dashboard();
