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

        // 1. Registrar el usuario en auth.users
        const { data: userData, error: signUpError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                // 🔑 ¡CLAVE DE LA SOLUCIÓN!
                // Redirige al usuario a la página principal después de la confirmación por correo.
                // Asegúrate de usar la URL completa de tu sitio si no estás en la raíz.
                emailRedirectTo: window.location.origin + '/index.html',
            }
        });

        if (signUpError) {
            formMsg.textContent = `Error: ${signUpError.message}`;
            console.error(signUpError);
            return;
        }

        // Si el registro es exitoso y se creó un usuario (data.user existe)
        if (userData.user) {
            // 2. Insertar el perfil y el rol por defecto en la tabla 'profiles'
            // NOTA: Esto asume que tienes la tabla 'profiles' con una política RLS que lo permite.
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([
                    {
                        id: userData.user.id,
                        email: userData.user.email,
                        role: 'usuario',
                    },
                ]);
            
            if (profileError) {
                // Aunque el perfil no se haya creado, la cuenta de auth.users sí lo hizo.
                console.error('Error al insertar el perfil:', profileError);
                formMsg.textContent = "Registro exitoso, pero falló la creación del perfil. Revisa la consola.";
            } else {
                formMsg.textContent = "¡Registro exitoso! Revisa tu correo para confirmar tu cuenta y serás redirigido.";
                signupForm.reset();
            }
        } else {
             // Este caso puede ocurrir si el usuario ya existe.
             formMsg.textContent = "Revisa tu correo. Si ya tienes cuenta, intenta iniciar sesión.";
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
