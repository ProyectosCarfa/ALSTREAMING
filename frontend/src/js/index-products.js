/**
 * ============================================================
 * ALSTREAMING - INDEX PRODUCTS
 * Carga productos destacados (más stock) y opiniones
 * ============================================================
 */

const API_PRODUCTOS = "/Alex/backend/api/products/index.php";
const API_REVIEWS = "/Alex/backend/api/reviews.php";

document.addEventListener("DOMContentLoaded", () => {
  cargarProductosDestacados();
  cargarOpiniones();
});

// ============================================================
// CARGAR PRODUCTOS DESTACADOS (ORDENADOS POR MÁS STOCK)
// ============================================================
async function cargarProductosDestacados() {
  const container = document.getElementById("products-destacados");
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 30px; color: #aaa; grid-column: 1/-1;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 30px; margin-bottom: 10px; display: block;"></i>
      Cargando productos...
    </div>
  `;
  
  try {
    const response = await fetch(`${API_PRODUCTOS}?action=getAll`);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      // 🔥 Ordenar por stock (mayor a menor) y tomar los primeros 8
      const productosOrdenados = result.data
        .sort((a, b) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 8);
      
      const sesion = verificarSesion();
      
      container.innerHTML = productosOrdenados.map(producto => `
        <div class="producto-card" onclick="window.location.href='/Alex/frontend/pages/productos.html'" style="cursor: pointer;">
          <img 
            src="${imagenURL(producto.image)}" 
            alt="${producto.name}" 
            class="producto-card-img"
            onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(producto.name)}'"
          />
          <div class="producto-card-body">
            <span class="producto-card-categoria">${producto.category_name || 'Sin categoría'}</span>
            <h3 class="producto-card-titulo">${producto.name}</h3>
            <p class="producto-card-descripcion">${producto.short_description || 'Sin descripción'}</p>
            
            <div class="producto-card-precio">
              <span class="precio-normal">S/. ${producto.normal_price}</span>
              ${producto.renewal_price ? `<span class="precio-renovacion">Renov: S/. ${producto.renewal_price}</span>` : ''}
            </div>
            
            <div class="producto-card-stock">
              <i class="fa-solid fa-boxes-stacked" style="color: #667eea;"></i>
              <span style="color: #667eea; font-weight: 600;">Stock: ${producto.stock || 0}</span>
            </div>
            
            <div class="producto-card-botones" onclick="event.stopPropagation();">
              ${sesion ? `
                <button class="btn-comprar" onclick="window.location.href='/Alex/frontend/pages/productos.html'">
                  <i class="fa-solid fa-cart-shopping"></i> Comprar
                </button>
              ` : `
                <button class="btn-comprar bloqueado" disabled>
                  <i class="fa-solid fa-lock"></i> Inicia sesión
                </button>
              `}
            </div>
          </div>
        </div>
      `).join("");
      
    } else {
      // No hay productos
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #aaa; grid-column: 1/-1;">
          <i class="fa-solid fa-box-open" style="font-size: 60px; margin-bottom: 15px; display: block; opacity: 0.3;"></i>
          <h3 style="color: #888; margin-bottom: 10px;">No hay productos disponibles</h3>
          <p style="font-size: 14px;">Vuelve pronto para ver nuevas ofertas</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error cargando productos destacados:", error);
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #ff4444; grid-column: 1/-1;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; margin-bottom: 10px; display: block;"></i>
        Error al cargar productos
      </div>
    `;
  }
}

// ============================================================
// CARGAR OPINIONES
// ============================================================
async function cargarOpiniones() {
  const filaSuperior = document.getElementById("fila-opiniones");
  const filaInferior = document.getElementById("fila-opinionesinferior");
  
  if (!filaSuperior && !filaInferior) return;
  
  const loadingHTML = `
    <div style="text-align: center; padding: 20px; color: #aaa; width: 100%;">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando opiniones...
    </div>
  `;
  
  if (filaSuperior) filaSuperior.innerHTML = loadingHTML;
  if (filaInferior) filaInferior.innerHTML = loadingHTML;
  
  try {
    const response = await fetch(`${API_REVIEWS}?action=getAll`);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      const opiniones = result.data;
      
      // Dividir en dos filas
      const mitad = Math.ceil(opiniones.length / 2);
      const fila1 = opiniones.slice(0, mitad);
      const fila2 = opiniones.slice(mitad);
      
      if (filaSuperior) {
        filaSuperior.innerHTML = fila1.map(op => crearOpinionHTML(op)).join("");
      }
      
      if (filaInferior) {
        filaInferior.innerHTML = fila2.map(op => crearOpinionHTML(op)).join("");
      }
    } else {
      // No hay opiniones
      const emptyHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #aaa; width: 100%;">
          <i class="fa-regular fa-comment-dots" style="font-size: 50px; margin-bottom: 15px; display: block; opacity: 0.3;"></i>
          <h3 style="color: #888; margin-bottom: 8px;">Aún no hay opiniones</h3>
          <p style="font-size: 13px;">Sé el primero en dejar tu reseña</p>
        </div>
      `;
      
      if (filaSuperior) filaSuperior.innerHTML = emptyHTML;
      if (filaInferior) filaInferior.innerHTML = "";
    }
  } catch (error) {
    console.error("Error cargando opiniones:", error);
    const errorHTML = `
      <div style="text-align: center; padding: 20px; color: #ff4444; width: 100%;">
        <i class="fa-solid fa-triangle-exclamation"></i> Error al cargar opiniones
      </div>
    `;
    if (filaSuperior) filaSuperior.innerHTML = errorHTML;
  }
}

// ============================================================
// CREAR HTML DE OPINIÓN
// ============================================================
function crearOpinionHTML(opinion) {
  const estrellas = generarEstrellas(opinion.rating || 5);
  const inicial = (opinion.username || "U").charAt(0).toUpperCase();
  
  return `
    <div class="opinion-card">
      <div class="opinion-header">
        <div class="opinion-avatar">${inicial}</div>
        <div class="opinion-info">
          <strong>${opinion.username || "Usuario"}</strong>
          <div class="opinion-stars">${estrellas}</div>
        </div>
      </div>
      <p class="opinion-text">${opinion.opinion || opinion.message || "Sin comentario"}</p>
      ${opinion.product_name ? `<span class="opinion-producto">📦 ${opinion.product_name}</span>` : ""}
    </div>
  `;
}

// ============================================================
// GENERAR ESTRELLAS
// ============================================================
function generarEstrellas(rating) {
  let estrellas = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      estrellas += '<i class="fa-solid fa-star" style="color: #ffbb33;"></i>';
    } else {
      estrellas += '<i class="fa-regular fa-star" style="color: #555;"></i>';
    }
  }
  return estrellas;
}

// ============================================================
// UTILIDADES
// ============================================================
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
  if (!img) return "https://via.placeholder.com/300x200?text=Sin+Imagen";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/")) return img;
  if (img.startsWith("data:")) return img;
  return "/Alex/" + img;
}