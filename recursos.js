// --- 1. CONEXIÓN CON SUPABASE ---
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co';
// 🚨 ¡ATENCIÓN! Pega aquí tu llave ANON PUBLIC correcta.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. ELEMENTOS HTML ---
const tituloSemanaEl = document.getElementById('titulo-semana');
const recursosGridEl = document.getElementById('recursos-grid');
const uploadCard = document.getElementById('upload-card');
const formSubirRecurso = document.getElementById('form-subir-recurso');
const fileInput = document.getElementById('file-input');
const resourceNameInput = document.getElementById('resource-name');
const uploadStatusEl = document.getElementById('upload-status');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editResourceNameInput = document.getElementById('edit-resource-name');
const editResourceIdInput = document.getElementById('edit-resource-id');
const cancelEditBtn = document.getElementById('cancel-edit-btn');


// --- 3. FUNCIONES DE UTILIDAD ---
function getSemanaId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('semana');
}

function getIconForResourceType(type) {
    if (!type) return 'bi-file-earmark';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('pdf')) return 'bi-file-earmark-pdf';
    if (typeLower.includes('imagen')) return 'bi-file-earmark-image';
    if (typeLower.includes('video')) return 'bi-file-earmark-play';
    if (typeLower.includes('doc')) return 'bi-file-earmark-word';
    if (typeLower.includes('zip')) return 'bi-file-earmark-zip';
    return 'bi-file-earmark-text';
}

async function getUserRole() {
    let userRole = 'invitado';
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
        userRole = profile ? profile.role : 'usuario';
    }
    return userRole;
}

async function renderPdfPreview(url, canvasId) {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch (error) {
        console.error('Error al renderizar el PDF:', error);
    }
}


// --- 4. LÓGICA PRINCIPAL: CARGAR RECURSOS ---
async function cargarRecursos() {
    const userRole = await getUserRole();
    console.log('Rol del usuario actual:', userRole);

    if (uploadCard) {
        uploadCard.style.display = (userRole === 'admin') ? 'block' : 'none';
    }

    const semanaId = getSemanaId();
    if (!semanaId) {
        tituloSemanaEl.textContent = "Semana no especificada.";
        return;
    }

    const { data: semanaData, error: semanaError } = await supabaseClient.from('semanas').select('titulo').eq('id', semanaId).single();
    if (semanaError) {
        tituloSemanaEl.textContent = "Error al cargar la semana.";
        console.error("Error cargando semana:", semanaError);
        return;
    }
    tituloSemanaEl.textContent = `Recursos de ${semanaData.titulo}`;

    const { data: recursosData, error: recursosError } = await supabaseClient
        .from('recursos')
        .select('id, titulo, url_archivo, tipo_recurso')
        .eq('semana_id', semanaId)
        .order('id');

    if (recursosError) {
        recursosGridEl.innerHTML = `<p style="color:red;">Error al cargar recursos. Revisa tus permisos (RLS).</p>`;
        console.error("Error cargando recursos:", recursosError);
        return;
    }

    if (recursosData.length === 0) {
        recursosGridEl.innerHTML = "<p>No hay recursos para esta semana.</p>";
    } else {
        recursosGridEl.innerHTML = recursosData.map(recurso => {
            let previewHTML = '';
            const tipo = recurso.tipo_recurso ? recurso.tipo_recurso.toLowerCase() : '';

            if (tipo === 'imagen') {
                previewHTML = `<img src="${recurso.url_archivo}" alt="${recurso.titulo}" class="recurso-preview-img">`;
            } else if (tipo === 'pdf') {
                const canvasId = `pdf-preview-${recurso.id}`;
                previewHTML = `<div class="recurso-preview-icon"><canvas id="${canvasId}"></canvas></div>`;
            } else {
                const iconClass = getIconForResourceType(tipo);
                previewHTML = `<div class="recurso-preview-icon"><i class="bi ${iconClass}"></i></div>`;
            }
            
            let botonesHTML = '';
            const esImagenOpdf = tipo === 'imagen' || tipo === 'pdf';
            const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(recurso.url_archivo)}&embedded=true`;
            const verEnlace = esImagenOpdf ? recurso.url_archivo : viewerUrl;
            const tituloString = JSON.stringify(recurso.titulo);
            const tituloArchivo = `${recurso.titulo}.${recurso.url_archivo.split('.').pop()}`;

            if (userRole === 'admin') {
                botonesHTML = `
                    <a href="${verEnlace}" target="_blank" class="btn btn--ghost">Ver</a>
                    <button onclick='abrirModalEdicion(${recurso.id}, ${tituloString})' class="btn btn--ghost">Editar</button>
                    <button onclick="eliminarRecurso(${recurso.id}, '${recurso.url_archivo}')" class="btn btn--danger">Eliminar</button>
                `;
            } else if (userRole === 'usuario') {
                botonesHTML = `
                    <a href="${verEnlace}" target="_blank" class="btn btn--ghost">Ver</a>
                    <button onclick="descargarRecurso('${recurso.url_archivo}', '${tituloArchivo}')" class="btn btn--accent">Descargar</button>
                `;
            } else {
                botonesHTML = `<button onclick="window.location.href='login.html'" class="btn btn--ghost">Ver</button>`;
            }

            return `
                <div class="recurso-item">
                    <div class="recurso-info">
                        ${previewHTML}
                        <p>${recurso.titulo}</p>
                    </div>
                    <div class="recurso-acciones">
                        ${botonesHTML}
                    </div>
                </div>
            `;
        }).join('');

        recursosData.forEach(recurso => {
            if (recurso.tipo_recurso && recurso.tipo_recurso.toLowerCase() === 'pdf') {
                renderPdfPreview(recurso.url_archivo, `pdf-preview-${recurso.id}`);
            }
        });
    }
}

// --- 5. FUNCIONES PARA MODAL, SUBIR, ELIMINAR Y DESCARGAR ---

function abrirModalEdicion(id, tituloActual) {
    if (!editModal) return;
    editResourceIdInput.value = id;
    editResourceNameInput.value = tituloActual;
    editModal.style.display = 'grid';
}

function cerrarModalEdicion() {
    if (!editModal) return;
    editModal.style.display = 'none';
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', cerrarModalEdicion);
}

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoTitulo = editResourceNameInput.value.trim();
        const recursoId = editResourceIdInput.value;

        if (!nuevoTitulo || !recursoId) return;

        const { error } = await supabaseClient
            .from('recursos')
            .update({ titulo: nuevoTitulo })
            .eq('id', recursoId);

        if (error) {
            alert(`Error al actualizar el nombre: ${error.message}`);
        } else {
            cerrarModalEdicion();
            cargarRecursos();
        }
    });
}

if (formSubirRecurso) {
    formSubirRecurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        const semanaId = getSemanaId();
        const file = fileInput.files[0];
        const resourceName = resourceNameInput.value.trim();
        const BUCKET_NAME = 'recursos';

        if (!file || !resourceName) {
            uploadStatusEl.textContent = "Por favor, selecciona un archivo y ponle un nombre.";
            return;
        }
        uploadStatusEl.textContent = "Subiendo archivo...";
        
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const uniqueName = `${semanaId}/${Date.now()}-${file.name}`;
            
            const { error: uploadError } = await supabaseClient.storage.from(BUCKET_NAME).upload(uniqueName, file);
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(uniqueName);
            
            let tipoRecurso = 'documento';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) tipoRecurso = 'imagen';
            else if (fileExtension === 'pdf') tipoRecurso = 'pdf';
            else if (['mp4', 'mov', 'avi'].includes(fileExtension)) tipoRecurso = 'video';

            const { error: dbError } = await supabaseClient.from('recursos').insert({
                titulo: resourceName,
                url_archivo: publicUrlData.publicUrl,
                semana_id: parseInt(semanaId, 10),
                tipo_recurso: tipoRecurso,
            });
            if (dbError) throw dbError;

            uploadStatusEl.textContent = `¡Archivo subido con éxito!`;
            formSubirRecurso.reset();
            cargarRecursos();
        } catch (error) {
            console.error('Error durante la subida:', error);
            uploadStatusEl.textContent = `Error: ${error.message}.`;
        }
    });
}

async function eliminarRecurso(recursoId, recursoUrl) {
    if (!confirm("¿Estás seguro de que quieres eliminar este recurso?")) return;

    const BUCKET_NAME = 'recursos';
    const filePath = recursoUrl.split(`${BUCKET_NAME}/`).pop();

    try {
        const { error: dbError } = await supabaseClient.from('recursos').delete().eq('id', recursoId);
        if (dbError) throw dbError;

        const { error: storageError } = await supabaseClient.storage.from(BUCKET_NAME).remove([filePath]);
        if (storageError && storageError.message !== 'The resource was not found') throw storageError;

        alert("Recurso eliminado con éxito.");
        cargarRecursos();
    } catch (error) {
        console.error('Error al eliminar el recurso:', error);
        alert(`Error al eliminar: ${error.message}`);
    }
}

async function descargarRecurso(url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo descargar el archivo.');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename || 'recurso');
        document.body.appendChild(link);
        link.click();
        
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Error en la descarga:', error);
        alert('No se pudo descargar el archivo.');
    }
}


// --- INICIO DE LA APLICACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    cargarRecursos();
});