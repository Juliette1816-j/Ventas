import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://jzuxaxlnguvsvlmymkge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

let inventario = [];

/* ==========================
   CARGAR INVENTARIO
========================== */

async function cargarInventario() {

    const { data, error } =
        await supabase
            .from("inventario")
            .select("*")
            .order("producto");

    if (error) {
        console.error(error);
        return;
    }

    inventario = data;

    console.log("Inventario cargado:", inventario);

    cargarCategorias();
}

/* ==========================
   CATEGORIAS
========================== */

function cargarCategorias() {

    const categorias = [
        ...new Set(
            inventario.map(
                x => x.categoria?.trim()
            )
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

/* ==========================
   PUBLICOS
========================== */

function cargarPublicos() {

    const categoria =
        document.getElementById("categoria").value;

    const publicos = [
        ...new Set(
            inventario
                .filter(
                    x =>
                        x.categoria?.trim() ===
                        categoria
                )
                .map(
                    x => x.publico?.trim()
                )
        )
    ];

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

    document.getElementById(
        "detalleProducto"
    ).innerHTML = "";
}

/* ==========================
   PRODUCTOS
========================== */

function cargarProductos() {

    const categoria =
        document.getElementById("categoria").value;

    const publico =
        document.getElementById("publico").value;

    const productos =
        inventario.filter(
            x =>
                x.categoria?.trim() ===
                categoria &&
                x.publico?.trim() ===
                publico
        );

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

    document.getElementById(
        "detalleProducto"
    ).innerHTML = "";
}

/* ==========================
   MOSTRAR PRODUCTO
========================== */

function mostrarProducto() {

    const codigo =
        document.getElementById("producto").value;

    if (!codigo) return;

    const producto =
        inventario.find(
            x => x.codigo === codigo
        );

    if (!producto) return;

    document.getElementById(
        "detalleProducto"
    ).innerHTML = `

        <h3>${producto.producto}</h3>

        <p><b>Código:</b>
        ${producto.codigo}</p>

        <p><b>Categoría:</b>
        ${producto.categoria}</p>

        <p><b>Público:</b>
        ${producto.publico}</p>

        <p><b>Stock:</b>
        ${producto.stock_inicial}</p>

        <p><b>Precio:</b>
        $${producto.precio_unitario}</p>

        <img
            src="${producto.imagenes}"
            width="250"
            style="
                border-radius:10px;
                margin-top:10px;
            "
        >
    `;
}


let carrito = [];

/* ===============================
     CARRITO VARIAS COMPRAS
=============================== */

function agregarAlCarrito() {

    const codigo =
        document.getElementById("producto").value;

    const producto = inventario.find(x =>
        x.codigo === codigo
    );

    const cantidad =
        parseInt(document.getElementById("cantidad").value);

    if (!producto) {
        alert("Seleccione un producto");
        return;
    }

    if (!cantidad || cantidad <= 0) {
        alert("Cantidad inválida");
        return;
    }

    if (cantidad > producto.stock_inicial) {
        alert("Stock insuficiente");
        return;
    }

    const item = {
        codigo: producto.codigo,
        producto: producto.producto,
        cantidad: cantidad,
        precio: producto.precio_unitario,
        subtotal: cantidad * producto.precio_unitario
    };

    carrito.push(item);

    renderCarrito();
}

function renderCarrito() {

    const contenedor =
        document.getElementById("carrito");

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p>Carrito vacío</p>";
        return;
    }

    let html = "<h3>🛒 Carrito</h3><ul>";

    let total = 0;

    carrito.forEach((item, index) => {

        total += item.subtotal;

        html += `
            <li>
                ${item.producto} -
                ${item.cantidad} x $${item.precio}
                = $${item.subtotal}

                <button onclick="eliminarItem(${index})">
                    X
                </button>
            </li>
        `;
    });

    html += `</ul><h3>Total: $${total}</h3>`;

    contenedor.innerHTML = html;
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    renderCarrito();
}

async function finalizarCompra() {

    if (carrito.length === 0)
        return alert("Carrito vacío");

    const cliente = document.getElementById("cliente").value;
    const medioPago = document.getElementById("medioPagoFinal").value;
    const estado = document.getElementById("estadoFinal").value;

    let total = carrito.reduce((a, b) => a + b.subtotal, 0);

    // 1. CREAR VENTA
    const { data, error } = await supabase
        .from("ventas")
        .insert([{
            cliente,
            usuario: "Admin",
            estado,
            total_general: total,
            total_pagado: estado === "Pagado" ? total : 0,
            saldo: estado === "Pagado" ? 0 : total
        }])
        .select()
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const ventaId = data.id;

    // 2. DETALLE
    const detalles = carrito.map(item => ({
        venta_id: ventaId,
        codigo: item.codigo,
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.subtotal
    }));

    await supabase.from("detalle_ventas").insert(detalles);

    // 3. STOCK
    for (let item of carrito) {

        const prod = inventario.find(p => p.codigo === item.codigo);

        await supabase
            .from("inventario")
            .update({
                stock_inicial: prod.stock_inicial - item.cantidad
            })
            .eq("codigo", item.codigo);
    }

    alert("Venta registrada correctamente");

    carrito = [];
    renderCarrito();
}

async function registrarPago(ventaId) {

    const monto = parseFloat(document.getElementById("montoPago").value);
    const medio = document.getElementById("medioPagoPago").value;

    if (!monto || monto <= 0) {
        return alert("Monto inválido");
    }

    const { error } = await supabase
        .from("pagos")
        .insert([{
            venta_id: ventaId,
            monto,
            medio_pago: medio,
            observacion: "Abono"
        }]);

    if (error) {
        console.error(error);
        return;
    }

    await actualizarSaldoVenta(ventaId);
}
      

/* ==========================
   EVENTOS
========================== */

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

/* ==========================
   INICIO
========================== */

cargarInventario();
