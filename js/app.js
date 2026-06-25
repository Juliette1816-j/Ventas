import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://jzuxaxlnguvsvlmymkge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

let inventario = [];

// Cargar inventario desde Supabase
async function cargarInventario() {

    const { data, error } = await supabase
        .from("inventario")
        .select("*")
        .order("producto");

    if (error) {
        console.error("Error cargando inventario:", error);
        return;
    }

    inventario = data;

    console.log("Inventario cargado:", inventario);

    cargarCategorias();
}

// Cargar categorías únicas
function cargarCategorias() {

    const categorias = [
        ...new Set(
            inventario.map(x => x.categoria?.trim())
        )
    ];

    const combo =
        document.getElementById("categoria");

    combo.innerHTML =
        '<option value="">Seleccione categoría</option>';

    categorias.forEach(cat => {

        combo.innerHTML += `
            <option value="${cat}">
                ${cat}
            </option>
        `;
    });
}

// Cargar públicos según categoría
function cargarPublicos() {

    const categoria =
        document.getElementById("categoria").value;

    console.log("Categoría:", categoria);

    const publicos = [
        ...new Set(
            inventario
                .filter(x =>
                    x.categoria?.trim() === categoria
                )
                .map(x => x.publico?.trim())
        )
    ];

    console.log("Públicos encontrados:", publicos);

    const combo =
        document.getElementById("publico");

    combo.innerHTML =
        '<option value="">Seleccione público</option>';

    publicos.forEach(pub => {

        combo.innerHTML += `
            <option value="${pub}">
                ${pub}
            </option>
        `;
    });

    document.getElementById("producto").innerHTML =
        '<option value="">Seleccione producto</option>';

    document.getElementById("detalleProducto").innerHTML =
        "";
}

// Cargar productos según categoría y público
function cargarProductos() {

    const categoria =
        document.getElementById("categoria").value;

    const publico =
        document.getElementById("publico").value;

    console.log("Categoría:", categoria);
    console.log("Público:", publico);

    const productos =
        inventario.filter(x =>
            x.categoria?.trim() === categoria &&
            x.publico?.trim() === publico
        );

    console.log("Productos encontrados:", productos);

    const combo =
        document.getElementById("producto");

    combo.innerHTML =
        '<option value="">Seleccione producto</option>';

    productos.forEach(prod => {

        combo.innerHTML += `
            <option value="${prod.codigo}">
                ${prod.producto}
            </option>
        `;
    });

    document.getElementById("detalleProducto").innerHTML =
        "";
}

// Mostrar detalle del producto
function mostrarProducto() {

    const codigo =
        document.getElementById("producto").value;

    if (!codigo) return;

    const producto =
        inventario.find(x =>
            x.codigo === codigo
        );

    console.log("Producto seleccionado:", producto);
    console.log("URL Imagen:", producto.imagenes);

    if (!producto) return;

    document.getElementById(
        "detalleProducto"
    ).innerHTML = `
        <h3>${producto.producto}</h3>

        <p><b>Código:</b> ${producto.codigo}</p>

        <p><b>Categoría:</b> ${producto.categoria}</p>

        <p><b>Público:</b> ${producto.publico}</p>

        <p><b>Stock:</b> ${producto.stock_inicial}</p>

        <p><b>Precio:</b> $${producto.precio_unitario}</p>

        <img
            src="${producto.imagenes}"
            alt="${producto.producto}"
            width="250"
            style="border-radius:10px;"
            onerror="console.log('Error cargando imagen')">
    `;
}

//Medios de pago
const medioPago =
document.getElementById("medioPago").value;

const estado =
document.getElementById("estado").value;

const { error } =
await supabase
.from("ventas")
.insert([
{
    codigo: producto.codigo,
    producto: producto.producto,
    cantidad: cantidad,
    precio_unitario: producto.precio_unitario,
    total: total,
    cliente: cliente,
    medio_pago: medioPago,
    estado: estado
}
]);

// Eventos
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
document
.getElementById("btnVenta")
.addEventListener(
    "click",
    registrarVenta
);

// Inicio
cargarInventario();

async function registrarVenta() {

    const codigo =
    document.getElementById("producto").value;
    
    const cantidad =
    parseInt(
    document.getElementById("cantidad").value
    );
    
    const cliente =
    document.getElementById("cliente").value;
    
    const medioPago =
    document.getElementById("medioPago").value;
    
    const estado =
    document.getElementById("estado").value;
    
    const observacion =
    document.getElementById("observacion").value;

}

const producto =
inventario.find(
x => x.codigo === codigo
);

if(!producto){

    alert(
    "Seleccione un producto"
    );

    return;
}
if(
!cantidad ||
cantidad <= 0
){
    alert(
    "Ingrese una cantidad válida"
    );

    return;
}
if(
cantidad >
producto.stock_inicial
){
    alert(
    "Stock insuficiente"
    );

    return;
}
const total =
cantidad *
producto.precio_unitario;

const { error } =
await supabase
.from("ventas")
.insert([{

    codigo:
    producto.codigo,

    producto:
    producto.producto,

    cantidad:
    cantidad,

    precio_unitario:
    producto.precio_unitario,

    total:
    total,

    cliente:
    cliente,

    medio_pago:
    medioPago,

    estado:
    estado,

    observacion:
    observacion,

    usuario:
    "Administrador"

}]);
if(error){

    console.error(error);

    alert(
    "Error guardando venta"
    );

    return;
}
const nuevoStock =
producto.stock_inicial -
cantidad;
const { error: errorStock } =
await supabase
.from("inventario")
.update({

    stock_inicial:
    nuevoStock

})
.eq(
    "codigo",
    producto.codigo
);

producto.stock_inicial =
nuevoStock;
alert(
`Venta registrada

Total: $${total}`
);
document.getElementById(
"cantidad"
).value = "";

document.getElementById(
"cliente"
).value = "";

document.getElementById(
"observacion"
).value = "";
mostrarProducto();
