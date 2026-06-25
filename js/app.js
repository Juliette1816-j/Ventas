import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://jzuxaxlnguvsvlmymkge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

let inventario = [];

async function cargarInventario() {

    const { data, error } = await supabase
        .from("inventario")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    inventario = data;

    cargarCategorias();
}

function cargarCategorias() {

    const categorias =
        [...new Set(
            inventario.map(x => x.categoria)
        )];

    const combo =
        document.getElementById("categoria");

    combo.innerHTML =
        "<option>Seleccione</option>";

    categorias.forEach(cat => {

        combo.innerHTML +=
            `<option>${cat}</option>`;

    });
}

function cargarPublicos() {

    const categoria =
        document.getElementById("categoria").value;

    const publicos =
        [...new Set(
            inventario
                .filter(x =>
                    x.categoria === categoria
                )
                .map(x => x.publico)
        )];

    const combo =
        document.getElementById("publico");

    combo.innerHTML =
        "<option>Seleccione</option>";

    publicos.forEach(pub => {

        combo.innerHTML +=
            `<option>${pub}</option>`;

    });
}

function cargarProductos() {

    const categoria =
        document.getElementById("categoria").value;

    const publico =
        document.getElementById("publico").value;

    const productos =
        inventario.filter(x =>
            x.categoria === categoria &&
            x.publico === publico
        );

    const combo =
        document.getElementById("producto");

    combo.innerHTML =
        "<option>Seleccione</option>";

    productos.forEach(prod => {

        combo.innerHTML += `
        <option value="${prod.codigo}">
            ${prod.producto}
        </option>`;
    });
}

function mostrarProducto() {

    const codigo =
        document.getElementById("producto").value;

    const producto =
        inventario.find(x =>
            x.codigo === codigo
        );

    if (!producto) return;

    document.getElementById(
        "detalleProducto"
    ).innerHTML = `
    
    <h3>${producto.producto}</h3>

    <p><b>Categoría:</b> ${producto.categoria}</p>

    <p><b>Público:</b> ${producto.publico}</p>

    <p><b>Stock:</b> ${producto.stock_inicial}</p>

    <p><b>Precio:</b>
    $${producto.precio_unitario}</p>

    <img
      src="https://drive.google.com/thumbnail?id=1SGasQAcLGXJ3eeFFHogDH5MGTpy1R2BV&sz=w1000"
      width="250">
}

document
    .getElementById("categoria")
    .addEventListener(
        "change",
        cargarPublicos
    );

document
    .getElementById("publico")
    .addEventListener(
        "change",
        cargarProductos
    );

document
    .getElementById("producto")
    .addEventListener(
        "change",
        mostrarProducto
    );

cargarInventario();
