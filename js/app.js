import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://jzuxaxlnguvsvlmymkge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo";

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}


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

    const producto = inventario.find(
        x => x.codigo === codigo
    );

    if (!producto) return;

    document.getElementById("detalleProducto").innerHTML = `
        <h3>${producto.producto}</h3>

        <p><b>Código:</b> ${producto.codigo}</p>

        <p><b>Categoría:</b> ${producto.categoria}</p>

        <p><b>Público:</b> ${producto.publico}</p>

        <p><b>Stock:</b> ${producto.stock_inicial}</p>

        <p><b>Precio:</b> $${producto.precio_unitario}</p>

        <img
            src="${producto.imagenes}"
            width="250"
            style="border-radius:10px; margin-top:10px;"
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

/* ===============================
         RENDER CARRITO
=============================== */

function renderCarrito() {

    const contenedor = document.getElementById("carrito");

    if (carrito.length === 0) {

        contenedor.innerHTML = `
            <h3>🛒 Carrito</h3>
            <p>Carrito vacío</p>
        `;

        return;
    }

    let total = 0;

    let html = `
        <h3>🛒 Carrito</h3>

        <table border="1" width="100%" cellpadding="8">

            <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th></th>
            </tr>
    `;

    carrito.forEach((item, index) => {

        total += item.subtotal;

        html += `
            <tr>

                <td>${item.producto}</td>

                <td style="text-align:center;">
                    ${item.cantidad}
                </td>

                <td style="text-align:right;">
                    $${item.precio.toLocaleString()}
                </td>

                <td style="text-align:right;">
                    $${item.subtotal.toLocaleString()}
                </td>

                <td style="text-align:center;">

                    <button
                        class="btnEliminar"
                        data-index="${index}">
                        🗑
                    </button>

                </td>

            </tr>
        `;
    });

    html += `
        </table>

        <h2 style="text-align:right;">
            Total:
            $${total.toLocaleString()}
        </h2>
    `;

    contenedor.innerHTML = html;

    document
        .querySelectorAll(".btnEliminar")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                eliminarItem(btn.dataset.index);

            });

        });

}

function eliminarItem(index) {

    carrito.splice(index, 1);

    renderCarrito();

}

/* ===============================
         PANEL DE PAGO
=============================== */

function mostrarPanelPago() {

    const cliente =
        document.getElementById("cliente").value;

    let total = 0;

    carrito.forEach(item => {

        total += item.subtotal;

    });

    document.getElementById("clienteResumen").textContent =
        cliente || "Cliente General";

    document.getElementById("productosResumen").textContent =
        carrito.length;

    document.getElementById("totalResumen").textContent =
        total.toLocaleString();

    document.getElementById("saldoResumen").textContent =
        total.toLocaleString();

    document.getElementById("estadoResumen").textContent =
        "Pendiente";

    document.getElementById("panelPago").style.display =
        "block";
}

/* ===============================
     FINALIZAR COMPRA
=============================== */

async function finalizarCompra() {

    if (carrito.length === 0) {
        alert("Carrito vacío");
        return;
    }

    // SOLO abrir panel
    mostrarPanelPago();
}

/* ===============================
     REGISTRAR PAGO
=============================== */

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
/* ===============================
     CONFIRMAR VENTA
=============================== */

async function confirmarVenta() {

    if (carrito.length === 0) {
        alert("Carrito vacío");
        return;
    }

    const cliente = document.getElementById("cliente").value;
    const medioPago = document.getElementById("medioPagoFinal").value;
    const abono = parseFloat(document.getElementById("montoPago").value) || 0;

    let total = carrito.reduce((a, b) => a + b.subtotal, 0);

    let total_pagado = abono;
    let saldo = total - abono;

    let estado = saldo <= 0 ? "Pagado" : "Pendiente";

    // 1. crear venta
    const { data, error } = await supabase
        .from("ventas")
        .insert([{
            cliente,
            usuario: "Admin",
            estado,
            total_general: total,
            total_pagado,
            saldo
        }])
        .select()
        .single();

    if (error) {
        console.error(error);
        alert("Error creando venta");
        return;
    }

    const ventaId = data.id;

    // 2. detalle
    const detalles = carrito.map(item => ({
        venta_id: ventaId,
        codigo: item.codigo,
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.subtotal
    }));

    await supabase.from("detalle_ventas").insert(detalles);

    // 3. stock
    for (let item of carrito) {

        const prod = inventario.find(p => p.codigo === item.codigo);

        await supabase
            .from("inventario")
            .update({
                stock_inicial: prod.stock_inicial - item.cantidad
            })
            .eq("codigo", item.codigo);
    }

    // 4. limpiar sistema
    carrito = [];
    renderCarrito();

    document.getElementById("panelPago").style.display = "none";
    document.getElementById("cliente").value = "";
    document.getElementById("montoPago").value = "";

    // reset resumen
    document.getElementById("clienteResumen").textContent = "";
    document.getElementById("productosResumen").textContent = "0";
    document.getElementById("totalResumen").textContent = "0";
    document.getElementById("saldoResumen").textContent = "0";
    document.getElementById("estadoResumen").textContent = "Pendiente";

    await cargarInventario();

    alert("Venta registrada correctamente");
}

/* ===============================
     ACTUALIZAR PAGO
=============================== */

async function actualizarSaldoVenta(ventaId) {

    const { data: venta } = await supabase
        .from("ventas")
        .select("*")
        .eq("id", ventaId)
        .single();

    const { data: pagos } = await supabase
        .from("pagos")
        .select("monto")
        .eq("venta_id", ventaId);

    let totalPagado = pagos.reduce((a, b) => a + Number(b.monto), 0);

    let saldo = venta.total_general - totalPagado;

    await supabase
        .from("ventas")
        .update({
            total_pagado: totalPagado,
            saldo: saldo,
            estado: saldo <= 0 ? "Pagado" : "Pendiente"
        })
        .eq("id", ventaId);
}   

/* ===============================
     CARGAR HISTORIAL
=============================== */

async function cargarHistorial(cliente) {

    const { data } = await supabase
        .from("ventas")
        .select("*")
        .ilike("cliente", `%${cliente}%`)
        .order("fecha", { ascending: false });

    const contenedor = document.getElementById("historial");

    contenedor.innerHTML = data.map(v => `
        <div class="venta">
            <h4>Venta #${v.id}</h4>
            <p>Total: $${v.total_general}</p>
            <p>Pagado: $${v.total_pagado}</p>
            <p>Saldo: $${v.saldo}</p>
            <p>Estado: ${v.estado}</p>

            <button onclick="verPagos(${v.id})">
                Ver pagos
            </button>
        </div>
    `).join("");
}

/* ===============================
           VER PAGOS
=============================== */

async function verPagos(ventaId) {

    const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("venta_id", ventaId);

    alert(
        data.map(p =>
            `${p.fecha} - $${p.monto} (${p.medio_pago})`
        ).join("\n")
    );
}

/* ===============================
     VERIFICAR STOCK
=============================== */

function verificarStockBajo() {

    const bajos = inventario.filter(p =>
        p.stock_inicial <= 5
    );

    const contenedor =
        document.getElementById("alertas");

    if (bajos.length === 0) {
        contenedor.innerHTML = "✔ Stock OK";
        return;
    }

    contenedor.innerHTML = bajos.map(p => `
        <p style="color:red;">
            ⚠ ${p.producto} - Stock: ${p.stock_inicial}
        </p>
    `).join("");
}

verificarStockBajo();

/* ===============================
           DASHBOARD
=============================== */

async function cargarDashboard() {

    const { data: ventas } = await supabase
        .from("ventas")
        .select("*");

    let totalVentas = ventas.length;

    let ingresos = ventas.reduce((a, b) =>
        a + Number(b.total_general), 0
    );

    let saldoTotal = ventas.reduce((a, b) =>
        a + Number(b.saldo), 0
    );

    document.getElementById("dashboard").innerHTML = `
        <h3>📊 Dashboard</h3>
        <p>Ventas: ${totalVentas}</p>
        <p>Ingresos: $${ingresos}</p>
        <p>Saldo pendiente: $${saldoTotal}</p>
    `;
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
    .getElementById("btnAgregar")
    .addEventListener(
        "click",
        agregarAlCarrito
    );

document
    .getElementById("btnFinalizar")
    .addEventListener(
        "click",
        finalizarCompra
    );
document
    .getElementById("btnConfirmarVenta")
    .addEventListener("click", confirmarVenta);

/* ==========================
   INICIO
========================== */

cargarInventario();
