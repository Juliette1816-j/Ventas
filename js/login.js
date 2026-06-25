import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "TU_KEY"
);

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

document.getElementById("loginBtn").addEventListener("click", login);

async function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

    if (error || !data) {
        alert("Usuario o contraseña incorrectos");
        return;
    }

    // guardar sesión simple
    localStorage.setItem("usuario", JSON.stringify(data));

    alert("Bienvenido " + data.nombre);

    window.location.href = "dashboard.html";
}