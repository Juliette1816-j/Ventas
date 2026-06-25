import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "TU_KEY"
);

// SOLO evento de login
document.getElementById("loginBtn").addEventListener("click", login);

async function login() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Completa los campos");
        return;
    }

    const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

    if (error || !data) {
        console.log(error);
        alert("Usuario o contraseña incorrectos");
        return;
    }

    // guardar sesión
    localStorage.setItem("usuario", JSON.stringify({
        id: data.id,
        nombre: data.nombre,
        rol: data.rol,
        username: data.username
    }));

    alert("Bienvenido " + data.nombre);

    // redirigir
    window.location.href = "index.html"; // o dashboard.html
}