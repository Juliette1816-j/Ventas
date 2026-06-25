import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "TU_ANON_KEY"
);

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