import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://jzuxaxlnguvsvlmymkge.supabase.co",
    "TU_ANON_KEY"
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