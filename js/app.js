document.getElementById("btnLogin").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("Correo:", email);
    console.log("Contraseña:", password);

    alert("Botón funcionando correctamente");
});