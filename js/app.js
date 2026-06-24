import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://jzuxaxlnguvsvlmymkge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

async function cargarProductos() {

    const { data, error } =
        await supabase
            .from("inventario")
            .select("*")
            .order("producto");

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Producto:", data);
    console.log("Imagen:", data.imagenes);
    
    const combo =
        document.getElementById("producto");

    combo.innerHTML = "";

    data.forEach(item => {

        const option =
            document.createElement("option");

        option.value = item.codigo;
        option.textContent = item.producto;

        combo.appendChild(option);

    });

    mostrarProducto();
}

async function mostrarProducto() {

    const codigo =
        document.getElementById("producto").value;

    const { data, error } =
        await supabase
            .from("inventario")
            .select("*")
            .eq("codigo", codigo)
            .single();

    console.log("PRODUCTO SELECCIONADO");
    console.log(data);

    if (error) {
        console.error(error);
        return;
    }

    document.getElementById("detalleProducto")
        .innerHTML = `
        <h3>${data.producto}</h3>
        <p>Categoría: ${data.categoria}</p>
        <p>Público: ${data.publico}</p>
        <p>Precio: $${data.precio_unitario}</p>

        <img
            src="${data.imagenes}"
            width="250"
            onerror="this.style.border='3px solid red'; console.log('ERROR IMAGEN', this.src);">
    `;
}
