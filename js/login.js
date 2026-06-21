const btnLogin = document.getElementById('btn-login-submit');

btnLogin.addEventListener('click', async (event) => {
    event.preventDefault();
    const userName = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (!userName || !password) {
        alert("Por favor, ingresa tu usuario y contraseña.");
        return;
    }

    try {
        const response = await fetch('https://localhost:7204/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName: userName,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('tokenFarmacia', data.token);
            //William aqui le vas a poner que te rediriga al home
            window.location.href = 'sidebar.html'; 
            
        } else {
            alert('Nombre de usuario o contraseña incorrectos.');
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        alert('No se pudo conectar con el servidor. Revisa si la API está corriendo.');
    }
});