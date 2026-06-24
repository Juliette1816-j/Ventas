document.getElementById("btnLogin").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("Correo:", email);
    console.log("Contraseña:", password);

    alert("Botón funcionando correctamente");
});
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://jzuxaxlnguvsvlmymkge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

console.log("Conectado a Supabase");

async function cargarProductos() {

    const { data, error } =
        await supabase
            .from("inventario")
            .select("*")
            .order("producto");

    if (error) {
        console.error(error);
        return;
    }

    const combo =
        document.getElementById("producto");

    combo.innerHTML = "";

    data.forEach(producto => {

        const option =
            document.createElement("option");

        option.value = producto.codigo;

        option.textContent =
            producto.producto;

        combo.appendChild(option);

    });

    mostrarProducto();
}

cargarProductos();
