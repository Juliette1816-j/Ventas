/* ============================================
   USUARIOS.JS — Gestión de usuarios
   Solo SuperAdmin · Sin módulos ES · Supabase UMD
   ============================================ */

const { createClient } = supabase;

const sb = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
);

/* --- Sesión --- */
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href = "login.html";
if (usuario.rol !== "SuperAdmin") window.location.href = "dashboard.html";

document.getElementById("usuarioInfo").textContent = `👤 ${usuario.nombre}`;

function cerrarSesion() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html?t=" + Date.now();
}

/* --- Módulos del sistema --- */
const MODULOS = [
  { key: "ventas",     label: "🛒 Ventas"    },
  { key: "inventario", label: "📦 Inventario" },
  { key: "cartera",    label: "💳 Cartera"    },
  { key: "compras",    label: "🛍 Compras"    },
  { key: "caja",       label: "💰 Caja"       }
];

/* Permisos por defecto según rol */
const PERMISOS_ROL = {
  SuperAdmin: { ventas: "completo", inventario: "completo", cartera: "completo", compras: "completo", caja: "completo" },
  Admin:      { ventas: "completo", inventario: "completo", cartera: "completo", compras: "completo", caja: "lectura" },
  Supervisor: { ventas: "completo", inventario: "lectura",  cartera: "lectura",  compras: "ninguno",  caja: "ninguno" },
  Vendedor:   { ventas: "completo", inventario: "ninguno",  cartera: "ninguno",  compras: "ninguno",  caja: "ninguno" }
};

/* --- Estado --- */
let usuariosData   = [];
let permisosData   = {};
let editPerfilId   = null;

/* ============================================
   FORMATO
   ============================================ */
function fmt(n) { return "$" + Number(n || 0).toLocaleString("es-CO"); }

function rolBadge(rol) {
  const map = {
    SuperAdmin: "badge-pagado",
    Admin:      "badge-parcial",
    Supervisor: "badge-pendiente",
    Vendedor:   ""
  };
  return `<span class="badge ${map[rol] || ""}">${rol}</span>`;
}

function accesoLabel(acceso) {
  if (acceso === "completo") return `<span class="badge badge-pagado">✔ Completo</span>`;
  if (acceso === "lectura")  return `<span class="badge badge-parcial">👁 Lectura</span>`;
  return `<span class="badge" style="background:var(--beige-medio);color:var(--texto-claro);">— Ninguno</span>`;
}

/* ============================================
   RENDER SELECTORES DE PERMISOS
   ============================================ */
function renderPermisos(contenedorId, valoresIniciales) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = MODULOS.map(m => `
    <div class="permiso-fila">
      <span class="permiso-label">${m.label}</span>
      <select class="permiso-select" data-modulo="${m.key}">
        <option value="completo" ${(valoresIniciales[m.key] || "") === "completo" ? "selected" : ""}>✔ Completo</option>
        <option value="lectura"  ${(valoresIniciales[m.key] || "") === "lectura"  ? "selected" : ""}>👁 Lectura</option>
        <option value="ninguno"  ${(valoresIniciales[m.key] || "") === "ninguno"  ? "selected" : ""}>— Ninguno</option>
      </select>
    </div>
  `).join("");
}

function leerPermisos(contenedorId) {
  const permisos = {};
  document.querySelectorAll(`#${contenedorId} .permiso-select`).forEach(sel => {
    permisos[sel.dataset.modulo] = sel.value;
  });
  return permisos;
}

/* Inicializar permisos del formulario de creación */
renderPermisos("permisosNuevo", PERMISOS_ROL["Vendedor"]);

/* Actualizar permisos al cambiar rol en creación */
document.getElementById("nuevoRol").addEventListener("change", function () {
  renderPermisos("permisosNuevo", PERMISOS_ROL[this.value] || {});
});

/* ============================================
   CARGAR USUARIOS
   ============================================ */
async function cargarUsuarios() {
  const tbody = document.getElementById("tablaUsuarios");
  tbody.innerHTML = `<tr><td colspan="9" class="texto-vacio">Cargando...</td></tr>`;

  const [{ data: usuarios, error }, { data: permisos }] = await Promise.all([
    sb.from("perfiles").select("*").order("nombre"),
    sb.from("permisos").select("*")
  ]);

  if (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="texto-vacio">Error cargando usuarios</td></tr>`;
    return;
  }

  usuariosData = usuarios || [];

  // Indexar permisos por perfil_id y módulo
  permisosData = {};
  (permisos || []).forEach(p => {
    if (!permisosData[p.perfil_id]) permisosData[p.perfil_id] = {};
    permisosData[p.perfil_id][p.modulo] = p.acceso;
  });

  if (usuariosData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="texto-vacio">Sin usuarios</td></tr>`;
    return;
  }

  tbody.innerHTML = usuariosData.map(u => {
    const perms = permisosData[u.id] || {};
    const esSuperAdmin = u.rol === "SuperAdmin";
    return `
      <tr>
        <td><strong>${u.nombre}</strong></td>
        <td><span class="codigo-tag">${u.username}</span></td>
        <td>${rolBadge(u.rol)}</td>
        <td>${accesoLabel(perms.ventas     || "ninguno")}</td>
        <td>${accesoLabel(perms.inventario || "ninguno")}</td>
        <td>${accesoLabel(perms.cartera    || "ninguno")}</td>
        <td>${accesoLabel(perms.compras    || "ninguno")}</td>
        <td>${accesoLabel(perms.caja       || "ninguno")}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-outline btn-icono" onclick="abrirEditar('${u.id}')">✏️</button>
            ${!esSuperAdmin
              ? `<button class="btn-peligro btn-icono" onclick="abrirEliminar('${u.id}','${u.nombre}')">🗑</button>`
              : ""
            }
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ============================================
   CREAR USUARIO
   ============================================ */
document.getElementById("btnCrearUsuario").addEventListener("click", async () => {
  const nombre   = document.getElementById("nuevoNombre").value.trim();
  const username = document.getElementById("nuevoUsername").value.trim().toLowerCase();
  const password = document.getElementById("nuevoPassword").value;
  const rol      = document.getElementById("nuevoRol").value;
  const permisos = leerPermisos("permisosNuevo");
  const errorEl  = document.getElementById("crearError");
  const btn      = document.getElementById("btnCrearUsuario");

  errorEl.hidden = true;

  if (!nombre)   { errorEl.textContent = "Ingresa el nombre.";     errorEl.hidden = false; return; }
  if (!username) { errorEl.textContent = "Ingresa el usuario.";    errorEl.hidden = false; return; }
  if (password.length < 6) { errorEl.textContent = "La contraseña debe tener al menos 6 caracteres."; errorEl.hidden = false; return; }

  btn.disabled    = true;
  btn.textContent = "Creando...";

  try {
    // Verificar si username ya existe
    const { data: existe } = await sb
      .from("perfiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existe) {
      errorEl.textContent = "Ese nombre de usuario ya existe.";
      errorEl.hidden = false;
      return;
    }

    // Crear perfil
    const { data: nuevoPerfil, error: errPerfil } = await sb
      .from("perfiles")
      .insert([{ nombre, username, password, rol }])
      .select()
      .single();

    if (errPerfil) throw errPerfil;

    // Crear permisos
    const filasPerm = MODULOS.map(m => ({
      perfil_id: nuevoPerfil.id,
      modulo:    m.key,
      acceso:    permisos[m.key] || "ninguno"
    }));

    await sb.from("permisos").insert(filasPerm);

    // Limpiar
    document.getElementById("nuevoNombre").value    = "";
    document.getElementById("nuevoUsername").value  = "";
    document.getElementById("nuevoPassword").value  = "";
    document.getElementById("nuevoRol").value       = "Vendedor";
    renderPermisos("permisosNuevo", PERMISOS_ROL["Vendedor"]);

    mostrarMensaje("✔ Usuario creado correctamente", "exito");
    await cargarUsuarios();

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Error al crear el usuario.";
    errorEl.hidden = false;
  } finally {
    btn.disabled    = false;
    btn.textContent = "✔ Crear usuario";
  }
});

/* ============================================
   ABRIR MODAL EDITAR
   ============================================ */
function abrirEditar(id) {
  const u = usuariosData.find(x => x.id === id);
  if (!u) return;

  editPerfilId = id;

  document.getElementById("editId").value       = id;
  document.getElementById("editNombre").value   = u.nombre;
  document.getElementById("editUsername").value = u.username;
  document.getElementById("editPassword").value = "";
  document.getElementById("editRol").value      = u.rol;
  document.getElementById("editError").hidden   = true;

  const permsActuales = permisosData[id] || PERMISOS_ROL[u.rol] || {};
  renderPermisos("permisosEditar", permsActuales);

  // Actualizar permisos al cambiar rol en edición
  document.getElementById("editRol").onchange = function () {
    renderPermisos("permisosEditar", PERMISOS_ROL[this.value] || {});
  };

  document.getElementById("modalEditar").hidden = false;
}

/* ============================================
   GUARDAR EDICIÓN
   ============================================ */
document.getElementById("btnGuardarEdicion").addEventListener("click", async () => {
  const id       = document.getElementById("editId").value;
  const nombre   = document.getElementById("editNombre").value.trim();
  const username = document.getElementById("editUsername").value.trim().toLowerCase();
  const password = document.getElementById("editPassword").value;
  const rol      = document.getElementById("editRol").value;
  const permisos = leerPermisos("permisosEditar");
  const errorEl  = document.getElementById("editError");
  const btn      = document.getElementById("btnGuardarEdicion");

  errorEl.hidden = true;

  if (!nombre || !username) {
    errorEl.textContent = "Nombre y usuario son obligatorios.";
    errorEl.hidden = false;
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Guardando...";

  try {
    // Actualizar perfil
    const updateData = { nombre, username, rol };
    if (password.length >= 6) updateData.password = password;

    const { error: errUpd } = await sb
      .from("perfiles")
      .update(updateData)
      .eq("id", id);

    if (errUpd) throw errUpd;

    // Actualizar permisos — borrar y reinsertar
    await sb.from("permisos").delete().eq("perfil_id", id);

    const filasPerm = MODULOS.map(m => ({
      perfil_id: id,
      modulo:    m.key,
      acceso:    permisos[m.key] || "ninguno"
    }));

    await sb.from("permisos").insert(filasPerm);

    cerrarModal();
    mostrarMensaje("✔ Usuario actualizado", "exito");
    await cargarUsuarios();

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Error al guardar cambios.";
    errorEl.hidden = false;
  } finally {
    btn.disabled    = false;
    btn.textContent = "Guardar cambios";
  }
});

/* ============================================
   ELIMINAR USUARIO
   ============================================ */
function abrirEliminar(id, nombre) {
  document.getElementById("eliminarId").value      = id;
  document.getElementById("eliminarNombre").textContent = nombre;
  document.getElementById("modalEliminar").hidden  = false;
}

document.getElementById("btnConfirmarEliminar").addEventListener("click", async () => {
  const id  = document.getElementById("eliminarId").value;
  const btn = document.getElementById("btnConfirmarEliminar");

  btn.disabled    = true;
  btn.textContent = "Eliminando...";

  try {
    await sb.from("permisos").delete().eq("perfil_id", id);
    const { error } = await sb.from("perfiles").delete().eq("id", id);
    if (error) throw error;

    cerrarModal();
    mostrarMensaje("✔ Usuario eliminado", "exito");
    await cargarUsuarios();

  } catch (err) {
    console.error(err);
    mostrarMensaje("Error al eliminar usuario", "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Eliminar";
  }
});

/* ============================================
   MODALES
   ============================================ */
function cerrarModal() {
  document.getElementById("modalEditar").hidden  = true;
  document.getElementById("modalEliminar").hidden = true;
}

document.querySelectorAll(".modal-overlay").forEach(o => {
  o.addEventListener("click", e => { if (e.target === o) cerrarModal(); });
});

/* ============================================
   MENSAJE FLASH
   ============================================ */
function mostrarMensaje(texto, tipo) {
  const el = document.createElement("div");
  el.className     = tipo === "exito" ? "msg-exito" : "msg-error";
  el.textContent   = texto;
  el.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;max-width:320px;";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ============================================
   INICIO
   ============================================ */
cargarUsuarios();