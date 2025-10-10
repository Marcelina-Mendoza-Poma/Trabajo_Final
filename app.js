// --- 1. CONEXIÓN CON SUPABASE ---
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. CÓDIGO PARA LA ANIMACIÓN DE "REVEAL ON SCROLL" ---
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
});

function setupRevealAnimation() {
  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));
}

// --- 3. GESTIÓN DE LA INTERFAZ DE USUARIO (LOGIN/LOGOUT) ---
async function actualizarUIUsuario() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const navLinks = document.querySelector('.nav__links'); 
    if (!navLinks) return; 

    const loginButton = navLinks.querySelector('a[href="login.html"]');
    
    const oldLogoutButton = document.getElementById('logout-button');
    if (oldLogoutButton) {
        oldLogoutButton.remove();
    }

    if (session) {
        if (loginButton) {
            loginButton.innerHTML = `<i class="bi bi-person-circle"></i> ${session.user.email.split('@')[0]}`;
            loginButton.href = "#"; 
            loginButton.style.pointerEvents = 'none'; 
        }

        const logoutButton = document.createElement('button');
        logoutButton.id = 'logout-button';
        logoutButton.className = 'btn btn--ghost';
        logoutButton.innerHTML = '<i class="bi bi-box-arrow-right"></i> Cerrar Sesión';
        
        logoutButton.onclick = async () => {
            await supabaseClient.auth.signOut();
            window.location.reload(); 
        };
        
        navLinks.appendChild(logoutButton);

    } else {
         if (loginButton) {
            loginButton.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión';
            loginButton.href = "login.html";
            loginButton.style.pointerEvents = 'auto';
         }
    }
}


// --- 4. CARGAR UNIDADES DESDE SUPABASE ---
// CRÍTICO: Usamos el ID 'projectsGrid' que está en tu index.html
const gridContainer = document.getElementById('projectsGrid'); 

async function cargarUnidades() {
  // 1. Obtenemos el token de sesión para RLS
  await supabaseClient.auth.getSession(); 

  // 2. Consultamos la tabla 'unidades'
  const { data: unidadesData, error: unidadesError } = await supabaseClient
    .from('unidades')
    .select('id, titulo, descripcion') 
    .order('id', { ascending: true }); 

  if (unidadesError) {
    console.error('Error al cargar unidades:', unidadesError);
    if (gridContainer) gridContainer.innerHTML = "<p>Error al cargar las unidades del curso. Verifique RLS de SELECT.</p>";
    return;
  }
  
  if (!gridContainer) return; 

  if (!unidadesData || unidadesData.length === 0) {
    gridContainer.innerHTML = "<p>Aún no hay unidades registradas.</p>";
    return;
  }
  
  // 3. Generamos el HTML para cada unidad
  gridContainer.innerHTML = unidadesData.map(unidad => `
    <div class="card project-card reveal">
      <h4>${unidad.titulo}</h4>
      <p>${unidad.descripcion}</p>
      <a class="btn btn--accent" href="semanas.html?unidad=${unidad.id}">
        <i class="bi bi-folder2-open"></i> Ver Semanas
      </a>
    </div>
  `).join('');

  // 4. Aplicar animación 
  setupRevealAnimation();
}


// --- INICIO DE LA APLICACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
  cargarUnidades();
  setupRevealAnimation();
  actualizarUIUsuario(); 
});