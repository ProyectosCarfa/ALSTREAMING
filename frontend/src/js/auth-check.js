/**
 * ============================================================
 * ALSTREAMING - auth-check.js
 * Verificación de sesión en index.html
 * Controla la UI según el estado de autenticación
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const sesion = verificarSesion();
    const authContainer = document.getElementById("auth-container");
    const btnBanner = document.getElementById("btn-banner");
    const btnComienzaHoy = document.getElementById("btn-comienza-hoy");

    if (sesion) {
        // ============================================
        // USUARIO LOGUEADO
        // ============================================
        console.log("✅ Sesión activa:", sesion.username, "| Rol:", sesion.role);

        // 1. Cambiar el menú de navegación
        if (authContainer) {
            authContainer.innerHTML = `
                <div class="user-dropdown">
                    <button class="user-dropdown-btn" id="userDropdownBtn">
                        <i class="fa-solid fa-user"></i>
                        ${sesion.username}
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown-menu" id="userDropdownMenu">
                        <a href="/Alex/frontend/pages/perfil.html">
                            <i class="fa-solid fa-gear"></i> Mi cuenta
                        </a>
                        ${sesion.role === 'admin' ? `
                            <a href="/Alex/frontend/pages/admin/administrador.html">
                                <i class="fa-solid fa-shield-halved"></i> Panel Admin
                            </a>
                        ` : ''}
                        <a href="/Alex/frontend/pages/misCompras.html">
                            <i class="fa-solid fa-bag-shopping"></i> Mis compras
                        </a>
                        <hr>
                        <a href="#" onclick="cerrarSesion(); return false;" class="logout-link">
                            <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
                        </a>
                    </div>
                </div>
            `;

            // Activar el dropdown
            activarDropdown();
        }

        // 2. Botón banner funcional
        if (btnBanner) {
            btnBanner.href = "/Alex/frontend/pages/productos.html";
            btnBanner.innerHTML = '<i class="fa-solid fa-tags"></i> Ver ofertas del día de hoy';
            btnBanner.classList.remove("btn-disabled");
        }

        // 3. Ocultar "Comienza hoy"
        if (btnComienzaHoy) {
            btnComienzaHoy.style.display = "none";
        }

    } else {
        // ============================================
        // USUARIO NO LOGUEADO
        // ============================================
        console.log("🚫 Usuario no autenticado");

        // 1. Mantener "Iniciar sesión" (ya está por defecto)
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="/Alex/frontend/pages/login.html">
                    <i class="fa-solid fa-right-to-bracket"></i> Iniciar sesión
                </a>
            `;
        }

        // 2. Bloquear botón banner
        if (btnBanner) {
            btnBanner.href = "/Alex/frontend/pages/login.html";
            btnBanner.innerHTML = '<i class="fa-solid fa-lock"></i> Inicia sesión para ver ofertas';
            btnBanner.classList.add("btn-disabled");
            btnBanner.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = "/Alex/frontend/pages/login.html";
            });
        }

        // 3. Mostrar "Comienza hoy"
        if (btnComienzaHoy) {
            btnComienzaHoy.style.display = "inline-block";
        }
    }
});

// ============================================
// FUNCIÓN: VERIFICAR SESIÓN (COMPATIBLE CON login.js)
// ============================================
function verificarSesion() {
    try {
        const sesionData = localStorage.getItem("alstreaming_session");

        if (!sesionData) {
            return null;
        }

        const session = JSON.parse(sesionData);

        // Verificar expiración
        if (Date.now() > session.expira) {
            console.warn("⚠️ Sesión expirada, eliminando...");
            localStorage.removeItem("alstreaming_session");
            return null;
        }

        return session;

    } catch (error) {
        console.error("Error al verificar sesión:", error);
        localStorage.removeItem("alstreaming_session");
        return null;
    }
}

// ============================================
// FUNCIÓN: CERRAR SESIÓN (GLOBAL)
// ============================================
window.cerrarSesion = function() {
    try {
        localStorage.removeItem("alstreaming_session");
        sessionStorage.clear();

        // Eliminar cookies de sesión
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });

        console.log("🔒 Sesión cerrada correctamente");
        window.location.href = "/Alex/frontend/pages/login.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
};

// ============================================
// FUNCIÓN: ACTIVAR DROPDOWN DEL USUARIO
// ============================================
function activarDropdown() {
    const btn = document.getElementById("userDropdownBtn");
    const menu = document.getElementById("userDropdownMenu");

    if (!btn || !menu) {
        console.warn("Elementos del dropdown no encontrados");
        return;
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });

    menu.addEventListener("click", (e) => {
        e.stopPropagation();
    });
}