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

    localStorage.setItem("user", JSON.stringify({
        id: data.id,
        username: data.username,
        nombre: data.nombre,
        rol: data.rol
    }));

    alert("Bienvenido " + data.nombre);

    window.location.href = "index.html";
}