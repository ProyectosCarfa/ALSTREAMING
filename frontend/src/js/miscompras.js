/**
 * ============================================================
 * ALSTREAMING - MIS COMPRAS
 * Panel de usuario: Compras, Soporte, Noticias
 * SOLO CARGA DE BASE DE DATOS - TODOS LOS CAMPOS VISIBLES
 * BOTÓN VER/OCULTAR CONTRASEÑA + MODAL WHATSAPP PERSONALIZADO
 * VERIFICACIÓN DE STOCK AL COMPRAR
 * ============================================================
 */

const API_SALES = "/Alex/backend/api/sales.php";
const API_SUPPORT = "/Alex/backend/api/support.php";
const API_PRODUCTOS = "/Alex/backend/api/products/index.php";

let comprasData = [];
let passwordVisible = {};

// ============================================================
// INICIO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  verificarAcceso();
  configurarNavegacion();
  configurarBuscador();
  configurarModales();
  cargarCompras();
  configurarMobileMenu();
  crearModalWhatsApp();
});

// ============================================================
// VERIFICAR ACCESO
// ============================================================
function verificarAcceso() {
  const sesion = verificarSesion();
  
  if (!sesion) {
    window.location.replace("/Alex/frontend/pages/login.html");
    return;
  }
  
  document.getElementById("sidebarUsername").textContent = sesion.username || "Usuario";
  document.getElementById("welcomeName").textContent = sesion.username || "Usuario";
  
  if (sesion.role === "admin") {
    document.getElementById("sidebarRole").textContent = "Administrador";
    document.getElementById("sidebarRole").style.color = "#ff4444";
  }
  
  if (sesion.avatar) {
    document.getElementById("sidebarAvatar").src = imagenURL(sesion.avatar);
  } else {
    document.getElementById("sidebarAvatar").style.display = "none";
    const fallback = document.getElementById("sidebarAvatarFallback");
    if (fallback) {
      fallback.style.display = "flex";
      fallback.textContent = (sesion.username || "U").charAt(0).toUpperCase();
    }
  }
}

function verificarSesion() {
  try {
    const sesionData = localStorage.getItem("alstreaming_session");
    if (!sesionData) return null;
    
    const session = JSON.parse(sesionData);
    
    if (Date.now() > session.expira) {
      localStorage.removeItem("alstreaming_session");
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

function imagenURL(img) {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/")) return img;
  return "/Alex/" + img;
}

// ============================================================
// FETCH SEGURO JSON
// ============================================================
async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetch:", error);
    return { success: false, message: "Error de conexión" };
  }
}

// ============================================================
// CARGAR COMPRAS - SOLO DE BASE DE DATOS
// ============================================================
async function cargarCompras() {
  const sesion = verificarSesion();
  if (!sesion) return;
  
  const tabla = document.getElementById("tablaCompras");
  tabla.innerHTML = `
    <tr>
      <td colspan="11">
        <div class="empty-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <h3>Cargando compras...</h3>
        </div>
      </td>
    </tr>
  `;
  
  try {
    const response = await fetch(`${API_SALES}?action=getByUser&user_id=${sesion.id}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      comprasData = result.data;
    } else {
      comprasData = [];
    }
    
    document.getElementById("totalCompras").textContent = comprasData.length;
    document.getElementById("totalPendientes").textContent = 
      comprasData.filter(c => c.status === "available").length;
    
    if (comprasData.length === 0) {
      tabla.innerHTML = `
        <tr>
          <td colspan="11">
            <div class="empty-state">
              <i class="fa-solid fa-bag-shopping"></i>
              <h3>No tienes compras aún</h3>
              <p>Ve a la tienda y realiza tu primera compra</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    comprasData.forEach(c => {
      passwordVisible[c.ticket] = false;
    });
    
    tabla.innerHTML = comprasData.map(compra => `
      <tr>
        <td>
          <span class="ticket-link" onclick="verDetalleCompra('${compra.ticket}')" title="Ver detalles completos">
            #${compra.ticket}
          </span>
        </td>
        <td>${compra.product_name || "-"}</td>
        <td style="color: var(--success); font-weight: 600;">S/. ${compra.product_price || "0.00"}</td>
        <td style="font-size: 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${compra.email || ''}">${compra.email || "-"}</td>
        <td>
          ${compra.password ? `
            <div style="display: flex; align-items: center; gap: 5px;">
              <span id="pass-${compra.ticket}" style="font-family: monospace;">••••••••</span>
              <button onclick="togglePasswordTabla('${compra.ticket}')" 
                style="background: rgba(102,126,234,0.2); border: 1px solid rgba(102,126,234,0.3); color: #667eea; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;"
                title="Ver/ocultar contraseña">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          ` : "-"}
        </td>
        <td>${compra.pin || "-"}</td>
        <td>${compra.profile || "-"}</td>
        <td>${compra.start_date ? formatDate(compra.start_date) : "-"}</td>
        <td>${compra.end_date ? formatDate(compra.end_date) : "-"}</td>
        <td><span class="badge badge-${compra.status || 'available'}">${getStatusText(compra.status)}</span></td>
        <td>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <button class="btn-action btn-whatsapp-sm" onclick="abrirModalWhatsApp('${compra.ticket}')" title="Enviar datos por WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-action btn-support" onclick="abrirTicketSoporte('${compra.ticket}')" title="Soporte técnico">
              <i class="fa-solid fa-headset"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
    
  } catch (error) {
    console.error("Error cargando compras:", error);
    tabla.innerHTML = `
      <tr>
        <td colspan="11">
          <div class="empty-state">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h3>Error al cargar compras</h3>
            <p>Intenta recargar la página</p>
          </div>
        </td>
      </tr>
    `;
  }
}

// ============================================================
// TOGGLE CONTRASEÑA EN TABLA
// ============================================================
window.togglePasswordTabla = function(ticket) {
  const compra = comprasData.find(c => c.ticket === ticket);
  if (!compra || !compra.password) return;
  
  const passSpan = document.getElementById(`pass-${ticket}`);
  if (!passSpan) return;
  
  passwordVisible[ticket] = !passwordVisible[ticket];
  
  if (passwordVisible[ticket]) {
    passSpan.textContent = compra.password;
    passSpan.style.color = "#fff";
  } else {
    passSpan.textContent = "••••••••";
    passSpan.style.color = "";
  }
};

// ============================================================
// CREAR MODAL WHATSAPP PERSONALIZADO
// ============================================================
function crearModalWhatsApp() {
  if (document.getElementById("modal-whatsapp-envio")) return;
  
  const modalHTML = `
    <div class="modal-overlay" id="modal-whatsapp-envio" style="display: none;">
      <div style="background: #1a1a2e; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h3 style="font-size: 18px; color: #fff; margin: 0;">
            <i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> Enviar por WhatsApp
          </h3>
          <button onclick="cerrarModalWhatsApp()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
        <input type="hidden" id="whatsappTicket" />
        
        <div style="margin-bottom: 15px;">
          <label style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">
            👤 Nombre de quien recibe
          </label>
          <input 
            type="text" 
            id="whatsappNombre" 
            placeholder="Ej: Juan Pérez"
            style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; font-family: 'Inter', sans-serif;"
          />
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">
            📱 Número de WhatsApp
          </label>
          <input 
            type="tel" 
            id="whatsappNumero" 
            placeholder="+51 999 888 777"
            style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; font-family: 'Inter', sans-serif;"
          />
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">
            📝 Mensaje adicional (opcional)
          </label>
          <textarea 
            id="whatsappMensaje" 
            rows="3" 
            placeholder="Agrega un mensaje personalizado..."
            style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; font-family: 'Inter', sans-serif; resize: vertical;"
          ></textarea>
        </div>
        
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 15px; max-height: 150px; overflow-y: auto;">
          <span style="color: #888; font-size: 11px; display: block; margin-bottom: 8px;">📋 Datos que se enviarán:</span>
          <div id="whatsappPreview" style="color: #ccc; font-size: 12px; line-height: 1.6;"></div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button onclick="enviarWhatsAppPersonalizado()" 
            style="flex: 1; padding: 14px; background: #25D366; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 14px; font-family: 'Inter', sans-serif;">
            <i class="fa-brands fa-whatsapp"></i> Enviar a WhatsApp
          </button>
          <button onclick="cerrarModalWhatsApp()" 
            style="padding: 14px 20px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-family: 'Inter', sans-serif;">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// ============================================================
// ABRIR MODAL WHATSAPP
// ============================================================
window.abrirModalWhatsApp = function(ticket) {
  const compra = comprasData.find(c => c.ticket === ticket);
  if (!compra) return;
  
  document.getElementById("whatsappTicket").value = ticket;
  document.getElementById("whatsappNombre").value = "";
  document.getElementById("whatsappNumero").value = "";
  document.getElementById("whatsappMensaje").value = "";
  
  const preview = document.getElementById("whatsappPreview");
  preview.innerHTML = `
    <strong>Ticket:</strong> #${compra.ticket}<br>
    <strong>Producto:</strong> ${compra.product_name || "N/A"}<br>
    <strong>Precio:</strong> S/. ${compra.product_price || "0.00"}<br>
    ${compra.email ? `<strong>Email:</strong> ${compra.email}<br>` : ""}
    ${compra.password ? `<strong>Contraseña:</strong> ${compra.password}<br>` : ""}
    ${compra.pin ? `<strong>PIN:</strong> ${compra.pin}<br>` : ""}
    ${compra.profile ? `<strong>Perfil:</strong> ${compra.profile}<br>` : ""}
    ${compra.start_date ? `<strong>Inicio:</strong> ${formatDate(compra.start_date)}<br>` : ""}
    ${compra.end_date ? `<strong>Vence:</strong> ${formatDate(compra.end_date)}<br>` : ""}
  `;
  
  document.getElementById("modal-whatsapp-envio").style.display = "flex";
};

// ============================================================
// CERRAR MODAL WHATSAPP
// ============================================================
window.cerrarModalWhatsApp = function() {
  document.getElementById("modal-whatsapp-envio").style.display = "none";
};

// ============================================================
// ENVIAR WHATSAPP PERSONALIZADO
// ============================================================
window.enviarWhatsAppPersonalizado = function() {
  const ticket = document.getElementById("whatsappTicket").value;
  const nombre = document.getElementById("whatsappNombre").value.trim();
  const numero = document.getElementById("whatsappNumero").value.trim();
  const mensajeAdicional = document.getElementById("whatsappMensaje").value.trim();
  
  if (!numero) {
    alert("⚠️ Ingresa el número de WhatsApp");
    document.getElementById("whatsappNumero").focus();
    return;
  }
  
  const compra = comprasData.find(c => c.ticket === ticket);
  if (!compra) return;
  
  let numeroLimpio = numero.replace(/\s+/g, "").replace(/^\+/, "").replace(/-/g, "");
  
  let mensaje = `🎫 *DATOS DE COMPRA - ALSTREAMING*\n\n`;
  mensaje += `📦 Producto: *${compra.product_name || "N/A"}*\n`;
  mensaje += `💰 Precio: S/. ${compra.product_price || "0.00"}\n`;
  mensaje += `🎫 Ticket: #${compra.ticket}\n`;
  
  if (compra.email) mensaje += `📧 Email: \`${compra.email}\`\n`;
  if (compra.password) mensaje += `🔐 Contraseña: \`${compra.password}\`\n`;
  if (compra.pin) mensaje += `🔢 PIN: \`${compra.pin}\`\n`;
  if (compra.profile) mensaje += `👤 Perfil: \`${compra.profile}\`\n`;
  if (compra.start_date) mensaje += `📅 Inicio: ${formatDate(compra.start_date)}\n`;
  if (compra.end_date) mensaje += `⏰ Vence: ${formatDate(compra.end_date)}\n`;
  
  if (nombre) mensaje += `\n👋 Para: *${nombre}*`;
  if (mensajeAdicional) mensaje += `\n\n📝 ${mensajeAdicional}`;
  
  mensaje += `\n\n✅ ¡Disfruta tu producto!`;
  
  window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, "_blank");
  
  cerrarModalWhatsApp();
};

// Cerrar modal al hacer clic fuera
document.addEventListener("click", (e) => {
  if (e.target.id === "modal-whatsapp-envio") {
    cerrarModalWhatsApp();
  }
});

// ============================================================
// VER DETALLE DE COMPRA (MODAL COMPLETO)
// ============================================================
window.verDetalleCompra = function(ticket) {
  const compra = comprasData.find(c => c.ticket === ticket);
  if (!compra) {
    alert("Compra no encontrada");
    return;
  }
  
  const modalId = "modal-detalle-compra";
  const oldModal = document.getElementById(modalId);
  if (oldModal) oldModal.remove();
  
  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "modal-overlay active";
  modal.style.cssText = "display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; align-items: center; justify-content: center;";
  
  const tieneDatos = compra.email || compra.password || compra.pin || compra.profile;
  
  modal.innerHTML = `
    <div style="background: #1a1a2e; border-radius: 15px; padding: 30px; max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h3 style="font-size: 20px; color: #fff; margin: 0;">🎫 Ticket #${compra.ticket}</h3>
        <button onclick="document.getElementById('${modalId}').remove()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 5px;">&times;</button>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
          <span style="color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Producto</span>
          <div style="color: #fff; font-weight: 600; margin-top: 3px;">${compra.product_name || "N/A"}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
          <span style="color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Precio</span>
          <div style="color: #00b09b; font-weight: 700; font-size: 18px; margin-top: 3px;">S/. ${compra.product_price || "0.00"}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
          <span style="color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Estado</span>
          <div style="margin-top: 3px;"><span class="badge badge-${compra.status || 'available'}" style="font-size: 11px;">${getStatusText(compra.status)}</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px;">
          <span style="color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Fecha Compra</span>
          <div style="color: #fff; margin-top: 3px; font-size: 13px;">${formatDate(compra.created_at)}</div>
        </div>
      </div>
      
      ${tieneDatos ? `
        <div style="padding: 20px; background: rgba(102,126,234,0.08); border: 1px solid rgba(102,126,234,0.25); border-radius: 12px; margin-bottom: 15px;">
          <h4 style="color: #667eea; margin: 0 0 15px 0; font-size: 15px;">
            <i class="fa-solid fa-key"></i> Datos de tu Cuenta
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${compra.email ? `
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <span style="color: #888; font-size: 10px;">📧 Email</span>
                <div style="color: #fff; font-weight: 500; word-break: break-all; font-size: 13px;">${compra.email}</div>
              </div>
            ` : ''}
            ${compra.password ? `
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <span style="color: #888; font-size: 10px;">🔐 Contraseña</span>
                <div style="color: #fff; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                  <span id="passTextModal-${compra.ticket}">••••••••</span>
                  <button onclick="togglePasswordModal('${compra.ticket}', '${compra.password.replace(/'/g, "\\'")}')" 
                    style="background: rgba(102,126,234,0.3); border: none; color: #667eea; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    👁
                  </button>
                </div>
              </div>
            ` : ''}
            ${compra.pin ? `
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <span style="color: #888; font-size: 10px;">🔢 PIN</span>
                <div style="color: #fff; font-weight: 600; font-size: 18px; letter-spacing: 3px;">${compra.pin}</div>
              </div>
            ` : ''}
            ${compra.profile ? `
              <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <span style="color: #888; font-size: 10px;">👤 Perfil</span>
                <div style="color: #fff; font-weight: 500; font-size: 13px;">${compra.profile}</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : `
        <div style="padding: 20px; background: rgba(255,187,51,0.08); border: 1px solid rgba(255,187,51,0.25); border-radius: 12px; margin-bottom: 15px; text-align: center;">
          <i class="fa-solid fa-clock" style="font-size: 28px; color: #ffbb33; margin-bottom: 8px;"></i>
          <p style="color: #ffbb33; font-weight: 600; margin: 0 0 5px 0;">Datos pendientes</p>
          <p style="color: #aaa; font-size: 12px; margin: 0;">El administrador cargará los datos pronto.</p>
        </div>
      `}
      
      ${(compra.start_date || compra.end_date) ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          ${compra.start_date ? `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
              <span style="color: #888; font-size: 10px;">📅 Inicio</span>
              <div style="color: #fff; font-size: 13px; margin-top: 2px;">${formatDate(compra.start_date)}</div>
            </div>
          ` : ''}
          ${compra.end_date ? `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
              <span style="color: #888; font-size: 10px;">📅 Vencimiento</span>
              <div style="color: #fff; font-size: 13px; margin-top: 2px;">${formatDate(compra.end_date)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      ${compra.notes ? `
        <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 15px;">
          <span style="color: #888; font-size: 10px;">📝 Notas</span>
          <div style="color: #ccc; font-size: 12px; margin-top: 3px;">${compra.notes}</div>
        </div>
      ` : ''}
      
      <div style="display: flex; gap: 10px;">
        <button onclick="abrirModalWhatsApp('${compra.ticket}'); document.getElementById('${modalId}').remove();" 
          style="flex: 1; padding: 12px; background: #25D366; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-family: 'Inter', sans-serif; font-size: 14px;">
          <i class="fa-brands fa-whatsapp"></i> Enviar por WhatsApp
        </button>
        <button onclick="document.getElementById('${modalId}').remove()" 
          style="padding: 12px 20px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-family: 'Inter', sans-serif;">
          Cerrar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
};

// ============================================================
// TOGGLE PASSWORD EN MODAL
// ============================================================
window.togglePasswordModal = function(ticket, password) {
  const passText = document.getElementById(`passTextModal-${ticket}`);
  if (!passText) return;
  
  if (passText.textContent === "••••••••") {
    passText.textContent = password;
  } else {
    passText.textContent = "••••••••";
  }
};

// ============================================================
// ABRIR TICKET DE SOPORTE
// ============================================================
window.abrirTicketSoporte = function(ticket) {
  document.getElementById("ticketSaleId").value = ticket;
  document.getElementById("ticketSubject").value = `Consulta sobre compra #${ticket}`;
  document.getElementById("modalNuevoTicket").classList.add("active");
  
  document.querySelectorAll(".sidebar-nav a").forEach(a => a.classList.remove("active"));
  document.querySelector('.sidebar-nav a[data-section="soporte"]').classList.add("active");
  document.querySelectorAll(".section-panel").forEach(s => s.classList.remove("active"));
  document.getElementById("panel-soporte").classList.add("active");
};

// ============================================================
// CONFIGURAR NAVEGACIÓN
// ============================================================
function configurarNavegacion() {
  const links = document.querySelectorAll(".sidebar-nav a[data-section]");
  
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      const section = link.dataset.section;
      document.querySelectorAll(".section-panel").forEach(s => s.classList.remove("active"));
      document.getElementById(`panel-${section}`).classList.add("active");
      
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}

// ============================================================
// CONFIGURAR BUSCADOR DE COMPRAS
// ============================================================
function configurarBuscador() {
  const input = document.getElementById("searchCompras");
  if (!input) return;
  
  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase().trim();
    const filas = document.querySelectorAll("#tablaCompras tr");
    
    filas.forEach(fila => {
      if (fila.querySelector(".empty-state")) return;
      const textFila = fila.textContent.toLowerCase();
      fila.style.display = textFila.includes(texto) ? "" : "none";
    });
  });
}

// ============================================================
// CONFIGURAR MODALES
// ============================================================
function configurarModales() {
  document.getElementById("btnNuevoTicket")?.addEventListener("click", () => {
    document.getElementById("modalNuevoTicket").classList.add("active");
  });
  
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay") && e.target.classList.contains("active")) {
      e.target.classList.remove("active");
    }
  });
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
      cerrarModalWhatsApp();
    }
  });
  
  document.getElementById("formNuevoTicket")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const sesion = verificarSesion();
    if (!sesion) return;
    
    const data = {
      user_id: sesion.id,
      sale_ticket: document.getElementById("ticketSaleId").value,
      subject: document.getElementById("ticketSubject").value,
      message: document.getElementById("ticketMessage").value
    };
    
    try {
      const response = await fetch(`${API_SUPPORT}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("✅ Ticket creado correctamente");
        document.getElementById("modalNuevoTicket").classList.remove("active");
        document.getElementById("formNuevoTicket").reset();
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (error) {
      console.error("Error creando ticket:", error);
      alert("Error al crear ticket");
    }
  });
}

// ============================================================
// CONFIGURAR MENÚ MÓVIL
// ============================================================
function configurarMobileMenu() {
  document.getElementById("menuToggleMobile")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
  
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("menuToggleMobile");
    
    if (sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });
}

// ============================================================
// CERRAR SESIÓN
// ============================================================
window.cerrarSesionUsuario = function() {
  if (!confirm("¿Estás seguro de cerrar sesión?")) return;
  
  localStorage.removeItem("alstreaming_session");
  sessionStorage.clear();
  
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  window.location.replace("/Alex/frontend/pages/login.html");
};

// ============================================================
// UTILIDADES
// ============================================================
function getStatusText(status) {
  switch (status) {
    case "available": return "Disponible";
    case "support": return "En Soporte";
    case "renewal": return "Renovación";
    case "expired": return "Expirado";
    default: return status || "Disponible";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}