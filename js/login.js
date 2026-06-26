import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://jzuxaxlnguvsvlmymkge.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dXhheGxuZ3V2c3ZsbXlta2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTI2NjIsImV4cCI6MjA5NzgyODY2Mn0.DatIvM5O6mFz0qhR8tRreB0TCyB8pBMj5FBo0GmMEQo"
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
    if (data.rol === "admin") {
      window.location.href = "dashboard.html";
      } 
    else {
      window.location.href = "index.html";
      }
