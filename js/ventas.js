import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "TU_ANON_KEY"
);

async function cargarVentas() {

    const { data, error } = await supabase
        .from("ventas")
        .select("*")
        .order("fecha", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const tbody =
        document.getElementById("tablaVentas");

    tbody.innerHTML = "";

    data.forEach(v => {

        tbody.innerHTML += `
            <tr>
                <td>${v.fecha}</td>
                <td>${v.producto}</td>
                <td>${v.cantidad}</td>
                <td>$${v.total}</td>
                <td>${v.cliente}</td>
                <td>${v.estado}</td>
            </tr>
        `;
    });
}

cargarVentas();