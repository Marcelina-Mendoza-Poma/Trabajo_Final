// --- 1. CONEXIÓN CON SUPABASE ---
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co';
// 🚨 ¡ATENCIÓN! Pega aquí tu llave ANON PUBLIC correcta de tu panel de Supabase.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


// --- 2. LÓGICA DE REGISTRO (SIGN UP) ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = signupForm.querySelector('[name="email"]').value;
        const password = signupForm.querySelector('[name="password"]').value;
        const formMsg = signupForm.querySelector('#form-msg');

        formMsg.textContent = "Registrando...";

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            formMsg.textContent = `Error: ${error.message}`;
            console.error(error);
        } else {
            formMsg.textContent = "¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.";
            signupForm.reset();
        }
    });
}


// --- 3. LÓGICA DE INICIO DE SESIÓN CON CONTRASEÑA ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = loginForm.querySelector('[name="email"]').value;
        const password = loginForm.querySelector('[name="password"]').value;
        const formMsg = loginForm.querySelector('#form-msg');

        formMsg.textContent = "Iniciando sesión...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            formMsg.textContent = "Error: Email o contraseña incorrectos.";
            console.error(error);
        } else {
            // Si el login es exitoso, redirigimos al portafolio principal.
            window.location.href = 'index.html';
        }
    });
}


// --- 4. LÓGICA DE INICIO DE SESIÓN CON MAGIC LINK ---
const magicLinkForm = document.getElementById('magic-link-form');
if (magicLinkForm) {
    magicLinkForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = magicLinkForm.querySelector('[name="email"]').value;
        const formMsg = document.getElementById('magic-link-msg');
        
        formMsg.textContent = 'Enviando enlace...';

        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
        });

        if (error) {
            formMsg.textContent = `Error: ${error.message}`;
            console.error(error);
        } else {
            formMsg.textContent = '¡Revisa tu correo! Te hemos enviado un enlace para iniciar sesión.';
            magicLinkForm.reset();
        }
    });
}


// --- 5. LÓGICA DE INICIO DE SESIÓN CON GOOGLE ---
const googleLoginBtn = document.getElementById('login-google-btn');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
        });

        if (error) {
            const formMsg = document.getElementById('magic-link-msg'); // Usamos el espacio de mensajes existente
            if (formMsg) formMsg.textContent = `Error: ${error.message}`;
            console.error('Error al iniciar sesión con Google:', error);
        }
        // Si no hay error, Supabase se encarga de redirigir al usuario automáticamente
    });
}