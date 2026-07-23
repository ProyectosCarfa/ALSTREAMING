/**
 * ============================================================
 * ALSTREAMING - PRODUCTS.JS
 * Catálogo de productos con carrusel de categorías
 * Sistema de compra con código, barras y guardado en BD
 * Notificación de compras pendientes
 * ============================================================
 */

const API_PRODUCTOS = "/Alex/backend/api/products/index.php";
const API_CATEGORIAS = "/Alex/backend/api/categories/index.php";
const API_SALES = "/Alex/backend/api/sales.php";

let todosProductos = [];
let categorias = [];
let categoriaActiva = null;
let paginaActual = 1;
const productosPorPagina = 12;

// ============================================================
// INICIO
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCategorias();
  await cargarProductos();
  configurarBuscador();
  configurarCarruselCategorias();
  verificarSesionProductos();
  configurarModales();
  configurarModalCompra();
  verificarComprasPendientes(); // 🔥 NUEVO: Verificar compras pendientes
});

// ============================================================
// 🔥 NUEVO: VERIFICAR COMPRAS PENDIENTES
// ============================================================
function verificarComprasPendientes() {
  const sesion = verificarSesion();
  if (!sesion) return;
  
  const compras = JSON.parse(localStorage.getItem("alstreaming_compras") || "[]");
  
  if (compras.length > 0) {
    // Verificar si hay compras no confirmadas (simuladas como pendientes)
    const pendientes = compras.filter(c => !c.confirmado);
    
    if (pendientes.length > 0) {
      mostrarNotificacionPendiente(pendientes);
    }
  }
}

// ============================================================
// 🔥 NUEVO: MOSTRAR NOTIFICACIÓN DE COMPRA PENDIENTE
// ============================================================
function mostrarNotificacionPendiente(pendientes) {
  // Eliminar notificación anterior si existe
  const oldNotif = document.getElementById("notificacion-pendiente");
  if (oldNotif) oldNotif.remove();
  
  const notificacion = document.createElement("div");
  notificacion.id = "notificacion-pendiente";
  notificacion.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid rgba(255, 187, 51, 0.3);
    border-radius: 15px;
    padding: 20px;
    max-width: 400px;
    z-index: 9998;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: slideUpNotif 0.5s ease;
  `;
  
  const ultimaCompra = pendientes[pendientes.length - 1];
  
  notificacion.innerHTML = `
    <style>
      @keyframes slideUpNotif {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes pulseNotif {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 187, 51, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(255, 187, 51, 0); }
      }
    </style>
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="
        background: rgba(255, 187, 51, 0.2);
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        animation: pulseNotif 2s infinite;
      ">
        <i class="fa-solid fa-clock" style="color: #ffbb33; font-size: 20px;"></i>
      </div>
      <div style="flex: 1;">
        <h4 style="color: #ffbb33; margin: 0 0 5px 0; font-size: 15px;">
          <i class="fa-solid fa-triangle-exclamation"></i> Compra Pendiente
        </h4>
        <p style="color: #ccc; margin: 0 0 5px 0; font-size: 13px;">
          Tienes <strong style="color: #fff;">${pendientes.length}</strong> compra(s) pendiente(s) de confirmar.
        </p>
        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin: 10px 0;">
          <p style="color: #aaa; font-size: 11px; margin: 0 0 5px 0;">Última compra:</p>
          <p style="color: #fff; font-size: 13px; margin: 0;">
            <strong>${ultimaCompra.nombre}</strong> - Ticket: <span style="color: #667eea;">#${ultimaCompra.id}</span>
          </p>
          <p style="color: #00b09b; font-size: 13px; margin: 5px 0 0 0;">S/. ${ultimaCompra.precio}</p>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button onclick="enviarWhatsAppPendiente('${ultimaCompra.id}', '${ultimaCompra.nombre.replace(/'/g, "\\'")}', ${ultimaCompra.precio}, '${ultimaCompra.codigo}')" 
            style="
              flex: 1;
              padding: 10px;
              background: #25D366;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 12px;
              font-family: 'Inter', sans-serif;
              transition: all 0.3s ease;
            ">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </button>
          <button onclick="window.location.href='/Alex/frontend/pages/misCompras.html'"
            style="
              flex: 1;
              padding: 10px;
              background: rgba(102,126,234,0.8);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 12px;
              font-family: 'Inter', sans-serif;
              transition: all 0.3s ease;
            ">
            <i class="fa-solid fa-list"></i> Mis Compras
          </button>
        </div>
        <button onclick="document.getElementById('notificacion-pendiente').remove()"
          style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: #aaa;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notificacion);
  
  // Auto-ocultar después de 30 segundos
  setTimeout(() => {
    if (document.getElementById("notificacion-pendiente")) {
      document.getElementById("notificacion-pendiente").style.opacity = "0";
      document.getElementById("notificacion-pendiente").style.transition = "opacity 0.5s ease";
      setTimeout(() => {
        const notif = document.getElementById("notificacion-pendiente");
        if (notif) notif.remove();
      }, 500);
    }
  }, 30000);
}

// ============================================================
// 🔥 NUEVO: ENVIAR WHATSAPP DESDE NOTIFICACIÓN PENDIENTE
// ============================================================
window.enviarWhatsAppPendiente = function(ticket, nombre, precio, codigo) {
  const mensaje = encodeURIComponent(
    `🎉 *COMPRA PENDIENTE - ALSTREAMING*\n\n` +
    `📦 Producto: *${nombre}*\n` +
    `💰 Precio: S/. ${precio}\n` +
    `🎫 Ticket: #${ticket}\n` +
    `🔑 Código: *${codigo}*\n\n` +
    `Hola, tengo esta compra pendiente. ¿Pueden confirmarla?`
  );
  window.open(`https://wa.me/51987653211?text=${mensaje}`, "_blank");
};

// ============================================================
// VERIFICAR SESIÓN
// ============================================================
function verificarSesionProductos() {
  const sesion = verificarSesion();
  
  if (!sesion) {
    console.log("🔒 Usuario no logueado - Botones de compra bloqueados");
  } else {
    console.log("✅ Usuario logueado:", sesion.username);
    
    const moduleSaldo = document.getElementById("module-saldo");
    if (moduleSaldo) {
      moduleSaldo.textContent = `Saldo disponible: S/. ${sesion.saldo || "0.00"}`;
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
// NORMALIZAR URL DE IMAGEN
// ============================================================
function imagenURL(img) {
  if (!img) return "https://via.placeholder.com/300x200?text=Sin+Imagen";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/")) return img;
  if (img.startsWith("data:")) return img;
  return "/Alex/" + img;
}

// ============================================================
// CARGAR CATEGORÍAS
// ============================================================
async function cargarCategorias() {
  try {
    const json = await fetchJSON(`${API_CATEGORIAS}?action=getAll`);
    
    if (json.success && json.data) {
      categorias = json.data;
      mostrarCarruselCategorias(categorias);
    }
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

// ============================================================
// MOSTRAR CARRUSEL DE CATEGORÍAS
// ============================================================
function mostrarCarruselCategorias(categorias) {
  const carrusel = document.getElementById("categoriasCarousel");
  if (!carrusel) return;
  
  carrusel.innerHTML = "";
  
  // Botón "Todas"
  const btnTodas = document.createElement("div");
  btnTodas.className = `categoria-circle ${categoriaActiva === null ? 'active' : ''}`;
  btnTodas.dataset.categoriaId = "";
  btnTodas.innerHTML = `
    <div class="categoria-circle-img" style="background: linear-gradient(45deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 24px;">
      <i class="fa-solid fa-grid-2" style="color: white;"></i>
    </div>
    <span>Todas</span>
  `;
  btnTodas.addEventListener("click", () => seleccionarCategoria(null));
  carrusel.appendChild(btnTodas);
  
  // Categorías originales
  categorias.forEach(cat => {
    const div = document.createElement("div");
    div.className = "categoria-circle";
    div.dataset.categoriaId = cat.id;
    div.innerHTML = `
      <img 
        src="${imagenURL(cat.image)}" 
        alt="${cat.name}" 
        class="categoria-circle-img"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div class="categoria-circle-img" style="background: linear-gradient(45deg, #667eea, #764ba2); display: none; align-items: center; justify-content: center; font-size: 20px; color: white;">
        ${cat.name.charAt(0).toUpperCase()}
      </div>
      <span>${cat.name}</span>
    `;
    div.addEventListener("click", () => seleccionarCategoria(cat.id));
    carrusel.appendChild(div);
  });
  
  // Clones para scroll infinito
  categorias.forEach(cat => {
    const div = document.createElement("div");
    div.className = "categoria-circle clone";
    div.innerHTML = `
      <img 
        src="${imagenURL(cat.image)}" 
        alt="${cat.name}" 
        class="categoria-circle-img"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div class="categoria-circle-img" style="background: linear-gradient(45deg, #667eea, #764ba2); display: none; align-items: center; justify-content: center; font-size: 20px; color: white;">
        ${cat.name.charAt(0).toUpperCase()}
      </div>
      <span>${cat.name}</span>
    `;
    div.addEventListener("click", () => seleccionarCategoria(cat.id));
    carrusel.appendChild(div);
  });
}

function seleccionarCategoria(categoriaId) {
  const carrusel = document.getElementById("categoriasCarousel");
  
  carrusel.querySelectorAll(".categoria-circle:not(.clone)").forEach(c => c.classList.remove("active"));
  
  if (categoriaId === null) {
    categoriaActiva = null;
    const btnTodas = carrusel.querySelector('.categoria-circle[data-categoria-id=""]');
    if (btnTodas) btnTodas.classList.add("active");
  } else {
    categoriaActiva = categoriaId;
    const original = carrusel.querySelector(`.categoria-circle:not(.clone)[data-categoria-id="${categoriaId}"]`);
    if (original) original.classList.add("active");
  }
  
  paginaActual = 1;
  
  if (categoriaActiva) {
    filtrarPorCategoria(categoriaActiva);
  } else {
    mostrarProductos(todosProductos);
  }
}

// ============================================================
// CONFIGURAR CARRUSEL
// ============================================================
function configurarCarruselCategorias() {
  const carrusel = document.getElementById("categoriasCarousel");
  const btnPrev = document.getElementById("carouselPrev");
  const btnNext = document.getElementById("carouselNext");
  
  if (!carrusel) return;
  
  let scrollInterval;
  let isPaused = false;
  
  function iniciarScrollAutomatico() {
    scrollInterval = setInterval(() => {
      if (!isPaused) {
        carrusel.scrollLeft += 1;
        
        if (carrusel.scrollLeft >= (carrusel.scrollWidth - carrusel.clientWidth)) {
          carrusel.scrollLeft = 0;
        }
      }
    }, 30);
  }
  
  iniciarScrollAutomatico();
  
  carrusel.addEventListener("mouseenter", () => { isPaused = true; });
  carrusel.addEventListener("mouseleave", () => { isPaused = false; });
  
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      carrusel.scrollBy({ left: -250, behavior: "smooth" });
    });
  }
  
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      carrusel.scrollBy({ left: 250, behavior: "smooth" });
    });
  }
  
  // Touch/drag
  let isDown = false;
  let startX;
  let scrollLeftDrag;
  
  carrusel.addEventListener("mousedown", (e) => {
    isDown = true;
    isPaused = true;
    carrusel.style.cursor = "grabbing";
    startX = e.pageX - carrusel.offsetLeft;
    scrollLeftDrag = carrusel.scrollLeft;
  });
  
  carrusel.addEventListener("mouseleave", () => {
    isDown = false;
    isPaused = false;
    carrusel.style.cursor = "grab";
  });
  
  carrusel.addEventListener("mouseup", () => {
    isDown = false;
    isPaused = false;
    carrusel.style.cursor = "grab";
  });
  
  carrusel.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carrusel.offsetLeft;
    const walk = (x - startX) * 2;
    carrusel.scrollLeft = scrollLeftDrag - walk;
  });
  
  carrusel.addEventListener("touchstart", (e) => {
    isDown = true;
    isPaused = true;
    startX = e.touches[0].pageX - carrusel.offsetLeft;
    scrollLeftDrag = carrusel.scrollLeft;
  });
  
  carrusel.addEventListener("touchend", () => {
    isDown = false;
    isPaused = false;
  });
  
  carrusel.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - carrusel.offsetLeft;
    const walk = (x - startX) * 2;
    carrusel.scrollLeft = scrollLeftDrag - walk;
  });
}

// ============================================================
// CARGAR PRODUCTOS
// ============================================================
async function cargarProductos() {
  try {
    const json = await fetchJSON(`${API_PRODUCTOS}?action=getAll`);
    
    if (json.success && json.data) {
      todosProductos = json.data;
      mostrarProductos(todosProductos);
      mostrarTendencias(json.data.slice(0, 6));
      mostrarIntereses(json.data.slice(0, 4));
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// ============================================================
// MOSTRAR PRODUCTOS EN CARDS
// ============================================================
function mostrarProductos(productos) {
  const container = document.getElementById("productos");
  if (!container) return;
  
  if (productos.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #aaa; grid-column: 1/-1;">
        <i class="fa-solid fa-box-open" style="font-size: 50px; margin-bottom: 15px; display: block;"></i>
        <p>No se encontraron productos</p>
      </div>
    `;
    document.getElementById("pagination-controls").innerHTML = "";
    return;
  }
  
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productos.slice(inicio, fin);
  const totalPaginas = Math.ceil(productos.length / productosPorPagina);
  
  const sesion = verificarSesion();
  
  container.innerHTML = productosPagina.map(producto => {
    const stockStatus = getStockStatus(producto);
    const stockClass = getStockClass(producto.stock_status);
    const precioRenovacion = producto.renewal_price ? 
      `<span class="precio-renovacion">Renovación: S/. ${producto.renewal_price}</span>` : '';
    
    return `
      <div class="producto-card" onclick="verDetalles(${producto.id})" style="cursor: pointer;">
        <img 
          src="${imagenURL(producto.image)}" 
          alt="${producto.name}" 
          class="producto-card-img"
          onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(producto.name)}'"
        />
        <div class="producto-card-body">
          <span class="producto-card-categoria">${producto.category_name || 'Sin categoría'}</span>
          
          <div class="producto-nombre-scroll">
            <h3 class="producto-card-titulo">${producto.name}</h3>
          </div>
          
          <p class="producto-card-descripcion">${producto.short_description || 'Sin descripción'}</p>
          
          <div class="producto-vendedor">
            <img 
              src="${imagenURL(producto.seller_avatar || '')}" 
              alt="Vendedor" 
              class="vendedor-avatar"
              onerror="this.style.display='none'"
            />
            <span class="vendedor-nombre">${producto.seller_name || 'ALSTREAMING'}</span>
          </div>
          
          <div class="producto-card-precio">
            <span class="precio-normal">S/. ${producto.normal_price}</span>
            ${precioRenovacion}
          </div>
          
          <div class="producto-card-stock">
            <i class="fa-solid ${stockStatus.icon} ${stockClass}"></i>
            <span class="${stockClass}">${stockStatus.text}</span>
            <span class="stock-tipo">${producto.renewable === 'renewable' ? 'Renovable' : 'No renovable'}</span>
          </div>
          
          <div class="producto-card-botones" onclick="event.stopPropagation();">
            ${sesion ? `
              <button class="btn-comprar" onclick="iniciarCompra(${producto.id}, '${producto.name.replace(/'/g, "\\'")}', ${producto.normal_price})">
                <i class="fa-solid fa-cart-shopping"></i> Comprar
              </button>
            ` : `
              <button class="btn-comprar bloqueado" disabled>
                <i class="fa-solid fa-lock"></i> Inicia sesión
              </button>
            `}
            <button class="btn-detalles" onclick="verDetalles(${producto.id})">
              <i class="fa-solid fa-info"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  mostrarPaginacion(totalPaginas);
  activarScrollNombres();
}

function activarScrollNombres() {
  document.querySelectorAll(".producto-card-titulo").forEach(titulo => {
    const container = titulo.parentElement;
    
    if (titulo.scrollWidth > container.clientWidth) {
      titulo.style.animation = "scrollNombre 8s linear infinite";
      titulo.style.whiteSpace = "nowrap";
      
      container.addEventListener("mouseenter", () => {
        titulo.style.animationPlayState = "paused";
      });
      
      container.addEventListener("mouseleave", () => {
        titulo.style.animationPlayState = "running";
      });
    }
  });
}

function filtrarPorCategoria(categoriaId) {
  const filtrados = todosProductos.filter(p => p.category_id === categoriaId);
  mostrarProductos(filtrados);
}

function mostrarPaginacion(totalPaginas) {
  const container = document.getElementById("pagination-controls");
  if (!container || totalPaginas <= 1) {
    if (container) container.innerHTML = "";
    return;
  }
  
  let html = "";
  
  html += `
    <button class="pagination-btn" ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual - 1})">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;
  
  for (let i = 1; i <= totalPaginas; i++) {
    html += `
      <button class="pagination-btn ${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">
        ${i}
      </button>
    `;
  }
  
  html += `
    <button class="pagination-btn" ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual + 1})">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
  
  container.innerHTML = html;
}

window.cambiarPagina = function(pagina) {
  paginaActual = pagina;
  
  if (categoriaActiva) {
    const filtrados = todosProductos.filter(p => p.category_id === categoriaActiva);
    mostrarProductos(filtrados);
  } else {
    mostrarProductos(todosProductos);
  }
  
  document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
};

function mostrarTendencias(productos) {
  const container = document.getElementById("tendenciasProductos");
  if (!container) return;
  
  container.innerHTML = productos.map(producto => `
    <div class="producto-card" style="min-height: auto; cursor: pointer;" onclick="verDetalles(${producto.id})">
      <img 
        src="${imagenURL(producto.image)}" 
        alt="${producto.name}" 
        class="producto-card-img" 
        style="height: 150px;"
        onerror="this.src='https://via.placeholder.com/300x150?text=${encodeURIComponent(producto.name)}'"
      />
      <div class="producto-card-body" style="padding: 15px;">
        <span class="producto-card-categoria">🔥 Tendencia</span>
        <h3 class="producto-card-titulo" style="font-size: 16px;">${producto.name}</h3>
        <div class="producto-card-precio">
          <span class="precio-normal" style="font-size: 20px;">S/. ${producto.normal_price}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function mostrarIntereses(productos) {
  const container = document.getElementById("productosInteresar");
  if (!container) return;
  
  container.innerHTML = productos.map(producto => `
    <li onclick="verDetalles(${producto.id})" style="cursor: pointer;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img 
          src="${imagenURL(producto.image)}" 
          alt="${producto.name}" 
          style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;"
          onerror="this.src='https://via.placeholder.com/50?text=${encodeURIComponent(producto.name.charAt(0))}'"
        />
        <div style="flex: 1; min-width: 0;">
          <strong style="display: block; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${producto.name}</strong>
          <span style="color: #00b09b; font-weight: 700;">S/. ${producto.normal_price}</span>
        </div>
      </div>
    </li>
  `).join("");
}

// ============================================================
// VER DETALLES DEL PRODUCTO
// ============================================================
window.verDetalles = async function(productoId) {
  try {
    const json = await fetchJSON(`${API_PRODUCTOS}?action=get&id=${productoId}`);
    
    if (json.success && json.data) {
      const p = json.data;
      
      document.getElementById("titulo-detalles").textContent = p.name;
      document.getElementById("contenido-detalles").innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <img 
            src="${imagenURL(p.image)}" 
            alt="${p.name}" 
            style="max-width: 100%; border-radius: 15px; max-height: 300px; object-fit: cover;"
            onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(p.name)}'"
          />
        </div>
        
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
          <img 
            src="${imagenURL(p.seller_avatar || '')}" 
            alt="Vendedor" 
            style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid #667eea;"
            onerror="this.style.display='none'"
          />
          <div>
            <strong style="color: #fff; font-size: 14px;">${p.seller_name || 'ALSTREAMING'}</strong>
            <p style="color: #aaa; font-size: 12px; margin: 0;">Vendedor</p>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span style="background: rgba(102,126,234,0.2); color: #667eea; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
            ${p.category_name || 'Sin categoría'}
          </span>
          ${p.active == 1 
            ? '<span style="background: rgba(0,176,155,0.2); color: #00b09b; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">Activo</span>' 
            : '<span style="background: rgba(255,68,68,0.2); color: #ff4444; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">Inactivo</span>'}
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #aaa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Descripción</h4>
          <p style="color: #ccc; line-height: 1.6;">${p.short_description || 'Sin descripción disponible'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #aaa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Detalles</h4>
          <p style="color: #ccc; line-height: 1.6;">${p.details || 'Sin detalles adicionales'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #aaa; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Términos y Condiciones</h4>
          <div style="color: #ccc; line-height: 1.6; max-height: 150px; overflow-y: auto; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; font-size: 13px;">
            ${p.terms || 'No se especificaron términos para este producto.'}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; text-align: center;">
            <span style="display: block; color: #aaa; font-size: 12px; margin-bottom: 5px;">Precio</span>
            <strong style="color: #00b09b; font-size: 24px;">S/. ${p.normal_price}</strong>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; text-align: center;">
            <span style="display: block; color: #aaa; font-size: 12px; margin-bottom: 5px;">Renovación</span>
            <strong style="color: #667eea; font-size: 24px;">${p.renewal_price ? 'S/. ' + p.renewal_price : 'No aplica'}</strong>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div style="color: #aaa; font-size: 13px;">
            <i class="fa-solid fa-box"></i> Stock: <strong style="color: #fff;">${p.stock}</strong>
          </div>
          <div style="color: #aaa; font-size: 13px;">
            <i class="fa-solid ${getStockStatus(p).icon}"></i> Estado: <strong style="color: #fff;">${getStockStatus(p).text}</strong>
          </div>
          <div style="color: #aaa; font-size: 13px;">
            <i class="fa-solid fa-rotate"></i> Tipo: <strong style="color: #fff;">${p.renewable === 'renewable' ? 'Renovable' : 'No renovable'}</strong>
          </div>
          <div style="color: #aaa; font-size: 13px;">
            <i class="fa-solid fa-calendar"></i> Creado: <strong style="color: #fff;">${formatDate(p.created_at)}</strong>
          </div>
        </div>
      `;
      
      document.getElementById("modal-detalles").classList.add("active");
    }
  } catch (error) {
    console.error("Error cargando detalles:", error);
  }
};

// ============================================================
// SISTEMA DE COMPRA
// ============================================================
function configurarModalCompra() {
  if (!document.getElementById("modal-confirmar-compra")) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-confirmar-compra">
        <div class="modal-info" style="max-width: 500px;">
          <div class="header-info-modal">
            <h3 id="confirmar-titulo">Confirmar Compra</h3>
            <button data-close="modal-confirmar-compra">&times;</button>
          </div>
          <div class="content-modal" id="confirmar-contenido"></div>
          <div class="modal-actions" style="display: flex; gap: 10px;">
            <button class="btn-listo" id="btn-confirmar-si" style="flex: 1;">Sí, comprar</button>
            <button class="btn-listo" data-close="modal-confirmar-compra" style="flex: 1; background: #555;">Cancelar</button>
          </div>
        </div>
      </div>
      
      <div class="modal-overlay" id="modal-codigo-compra">
        <div class="modal-info" style="max-width: 500px;">
          <div class="header-info-modal">
            <h3>🎉 ¡Compra Exitosa!</h3>
            <button data-close="modal-codigo-compra">&times;</button>
          </div>
          <div class="content-modal" id="codigo-contenido"></div>
          <button class="btn-listo" id="btn-whatsapp" style="background: #25D366; margin-top: 10px;">
            <i class="fa-brands fa-whatsapp"></i> Enviar a WhatsApp
          </button>
          <button class="btn-listo" data-close="modal-codigo-compra" style="background: #667eea; margin-top: 5px;">
            <i class="fa-solid fa-list"></i> Ver Mis Compras
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

window.iniciarCompra = function(id, nombre, precio) {
  const sesion = verificarSesion();
  
  if (!sesion) {
    alert("Debes iniciar sesión para comprar");
    window.location.href = "/Alex/frontend/pages/login.html";
    return;
  }
  
  const modal = document.getElementById("modal-confirmar-compra");
  const contenido = document.getElementById("confirmar-contenido");
  
  contenido.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <i class="fa-solid fa-cart-shopping" style="font-size: 50px; color: #667eea; margin-bottom: 15px;"></i>
      <h4 style="color: #fff; margin-bottom: 10px;">${nombre}</h4>
      <p style="color: #aaa; margin-bottom: 15px;">¿Estás seguro que deseas comprar este producto?</p>
      <div style="background: rgba(0,176,155,0.1); padding: 15px; border-radius: 10px;">
        <span style="color: #aaa; font-size: 14px;">Total a pagar:</span>
        <div style="color: #00b09b; font-size: 28px; font-weight: 800;">S/. ${precio}</div>
      </div>
    </div>
  `;
  
  modal.classList.add("active");
  
  const btnSi = document.getElementById("btn-confirmar-si");
  btnSi.onclick = () => {
    modal.classList.remove("active");
    procesarCompra(id, nombre, precio);
  };
};

// ============================================================
// PROCESAR COMPRA - GUARDA EN BD
// ============================================================
async function procesarCompra(id, nombre, precio) {
  const sesion = verificarSesion();
  
  if (!sesion) {
    alert("Debes iniciar sesión para comprar");
    return;
  }
  
  const ticket = generarTicket();
  const codigo = generarCodigoProducto(id);
  
  // Guardar en BD
  try {
    const response = await fetch(`${API_SALES}?action=create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: ticket,
        product_id: id,
        customer_id: sesion.id,
        customer_name: sesion.username || "",
        customer_whatsapp: sesion.phone || "",
        email: sesion.email || "",
        start_date: new Date().toISOString().split("T")[0],
        notes: `Compra: ${nombre} - Código: ${codigo} - S/. ${precio}`
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log("✅ Venta registrada - Ticket:", ticket);
    }
  } catch (error) {
    console.error("Error al guardar venta:", error);
  }
  
  // Guardar en localStorage con flag pendiente
  const compras = JSON.parse(localStorage.getItem("alstreaming_compras") || "[]");
  compras.push({
    id: ticket,
    producto_id: id,
    nombre: nombre,
    precio: precio,
    codigo: codigo,
    fecha: new Date().toISOString(),
    usuario: sesion.username,
    confirmado: false // 🔥 Flag de pendiente
  });
  localStorage.setItem("alstreaming_compras", JSON.stringify(compras));
  
  // Mostrar modal con código
  const modal = document.getElementById("modal-codigo-compra");
  const contenido = document.getElementById("codigo-contenido");
  
  contenido.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <i class="fa-solid fa-circle-check" style="font-size: 50px; color: #00b09b; margin-bottom: 15px;"></i>
      <h4 style="color: #fff; margin-bottom: 5px;">${nombre}</h4>
      <p style="color: #aaa; margin-bottom: 20px;">Tu compra se ha realizado con éxito</p>
      
      <div style="background: rgba(255,187,51,0.1); border: 1px solid rgba(255,187,51,0.3); padding: 12px; border-radius: 10px; margin-bottom: 15px;">
        <p style="color: #ffbb33; font-size: 12px; margin: 0;">
          <i class="fa-solid fa-info-circle"></i> 
          No olvides enviar tu ticket a WhatsApp para confirmar tu compra
        </p>
      </div>
      
      <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
        <p style="color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Ticket</p>
        <div style="color: #667eea; font-size: 14px; font-weight: 600; margin-bottom: 15px;">#${ticket}</div>
        
        <p style="color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Código del Producto</p>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
          <span style="color: #fff; font-size: 24px; font-weight: 800; letter-spacing: 3px; font-family: 'Courier New', monospace;">${codigo}</span>
        </div>
        
        <p style="color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Código de Barras</p>
        <div style="display: flex; justify-content: center;">
          <svg id="barcode-${ticket}" style="max-width: 100%; height: 80px;"></svg>
        </div>
      </div>
      
      <p style="color: #aaa; font-size: 13px;">Precio: <strong style="color: #00b09b;">S/. ${precio}</strong></p>
      <p style="color: #aaa; font-size: 12px;">Fecha: ${formatDate(new Date().toISOString())}</p>
    </div>
  `;
  
  modal.classList.add("active");
  
  setTimeout(() => {
    generarCodigoBarras(`barcode-${ticket}`, codigo);
  }, 100);
  
  // Botón WhatsApp
  const btnWhatsapp = document.getElementById("btn-whatsapp");
  btnWhatsapp.onclick = () => {
    const mensaje = encodeURIComponent(
      `🎉 *COMPRA REALIZADA - ALSTREAMING*\n\n` +
      `📦 Producto: *${nombre}*\n` +
      `💰 Precio: S/. ${precio}\n` +
      `🎫 Ticket: #${ticket}\n` +
      `🔑 Código: *${codigo}*\n\n` +
      `Hola, acabo de realizar esta compra. ¿Pueden confirmarla?`
    );
    window.open(`https://wa.me/51987653211?text=${mensaje}`, "_blank");
  };
  
  // 🔥 Mostrar notificación pendiente
  setTimeout(() => {
    verificarComprasPendientes();
  }, 500);
}

function generarTicket() {
  return "TKT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generarCodigoProducto(productoId) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "ALS-";
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

function generarCodigoBarras(elementId, codigo) {
  const svg = document.getElementById(elementId);
  if (!svg) return;
  
  let barras = "";
  const width = 3;
  const height = 80;
  let x = 0;
  
  for (let i = 0; i < codigo.length; i++) {
    const charCode = codigo.charCodeAt(i);
    const binario = charCode.toString(2).padStart(8, "0");
    
    for (let j = 0; j < binario.length; j++) {
      if (binario[j] === "1") {
        barras += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="white"/>`;
      }
      x += width + 1;
    }
    x += 4;
  }
  
  svg.innerHTML = barras;
  svg.setAttribute("viewBox", `0 0 ${x} ${height}`);
}

// ============================================================
// CONFIGURAR BUSCADOR
// ============================================================
function configurarBuscador() {
  const input = document.getElementById("searchProducto");
  const btn = document.getElementById("search-Icon");
  
  if (!input) return;
  
  const buscar = () => {
    const texto = input.value.toLowerCase().trim();
    
    if (texto === "") {
      categoriaActiva = null;
      paginaActual = 1;
      mostrarProductos(todosProductos);
      
      const carrusel = document.getElementById("categoriasCarousel");
      if (carrusel) {
        carrusel.querySelectorAll(".categoria-circle:not(.clone)").forEach(c => c.classList.remove("active"));
        const btnTodas = carrusel.querySelector('.categoria-circle[data-categoria-id=""]');
        if (btnTodas) btnTodas.classList.add("active");
      }
      return;
    }
    
    const filtrados = todosProductos.filter(p =>
      p.name.toLowerCase().includes(texto) ||
      (p.short_description && p.short_description.toLowerCase().includes(texto)) ||
      (p.category_name && p.category_name.toLowerCase().includes(texto))
    );
    
    paginaActual = 1;
    mostrarProductos(filtrados);
  };
  
  input.addEventListener("input", buscar);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") buscar();
  });
  
  if (btn) {
    btn.addEventListener("click", buscar);
  }
}

// ============================================================
// CONFIGURAR MODALES
// ============================================================
function configurarModales() {
  document.addEventListener("click", (e) => {
    if (e.target.dataset.close) {
      const modalId = e.target.dataset.close;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove("active");
        // 🔥 Si cierra el modal de código, verificar pendientes
        if (modalId === "modal-codigo-compra") {
          setTimeout(() => verificarComprasPendientes(), 300);
        }
      }
    }
    
    if (e.target.classList.contains("modal-overlay") && e.target.classList.contains("active")) {
      e.target.classList.remove("active");
      // 🔥 Si cierra el modal de código, verificar pendientes
      if (e.target.id === "modal-codigo-compra") {
        setTimeout(() => verificarComprasPendientes(), 300);
      }
    }
  });
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(modal => {
        modal.classList.remove("active");
        if (modal.id === "modal-codigo-compra") {
          setTimeout(() => verificarComprasPendientes(), 300);
        }
      });
    }
  });
}

// ============================================================
// UTILIDADES
// ============================================================
function getStockStatus(producto) {
  switch (producto.stock_status) {
    case "in_stock":
      return { text: "Disponible", icon: "fa-circle-check" };
    case "on_request":
      return { text: "Bajo pedido", icon: "fa-clock" };
    case "activation":
      return { text: "Activación", icon: "fa-bolt" };
    default:
      return { text: "Disponible", icon: "fa-circle-check" };
  }
}

function getStockClass(stockStatus) {
  switch (stockStatus) {
    case "in_stock":
      return "stock-disponible";
    case "on_request":
      return "stock-bajo-pedido";
    case "activation":
      return "stock-bajo-pedido";
    default:
      return "stock-disponible";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}