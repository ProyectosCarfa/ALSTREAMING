/**
 * =====================================================
 * ALSTREAMING ADMIN PANEL
 * CRUD CATEGORIAS + PRODUCTOS COMPLETO
 * =====================================================
 */

const API = "/Alex/backend/api/categories/index.php";
const UPLOAD = "/Alex/backend/api/categories/index.php?action=upload";

const API_PRODUCTOS = "/Alex/backend/api/products/index.php";
const API_CATEGORIAS = "/Alex/backend/api/categories/index.php";
const UPLOAD_PRODUCTO = "/Alex/backend/api/products/index.php?action=upload";

let categorias = [];
let productos = [];

// ============================================================
// ELEMENTOS CATEGORIAS
// ============================================================
const tablaCategorias = document.getElementById("tablaCategorias");
const modal = document.getElementById("modalCategoria");
const form = document.getElementById("formCategoria");
const btnNueva = document.getElementById("btnNuevaCategoria");
const cerrar = document.getElementById("cerrarModal");
const buscar = document.getElementById("searchCategoria");
const archivo = document.getElementById("archivoCategoria");
const preview = document.getElementById("previewCategoria");

// ============================================================
// ELEMENTOS PRODUCTOS
// ============================================================
const tablaProductos = document.getElementById("tablaProductos");
const modalProducto = document.getElementById("modalProducto");
const formProducto = document.getElementById("formProducto");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");
const cerrarModalProducto = document.getElementById("cerrarModalProducto");
const buscarProducto = document.getElementById("buscarProducto");
const archivoProducto = document.getElementById("archivoProducto");
const previewProducto = document.getElementById("previewProducto");

// ============================================================
// FETCH SEGURO JSON
// ============================================================
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Respuesta PHP inválida:", text);
    throw error;
  }
}

// ============================================================
// INICIO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarProductos();
  cargarCategoriasProducto();
  eventosProducto();
});

// ============================================================
// NORMALIZAR IMAGEN
// ============================================================
function imagenURL(img) {
  if (!img) {
    return "https://via.placeholder.com/80";
  }
  if (img.startsWith("http")) {
    return img;
  }
  if (img.startsWith("/")) {
    return img;
  }
  return "/Alex/" + img;
}

// ############################################################
// #                    CATEGORÍAS                             #
// ############################################################

// ============================================================
// CARGAR CATEGORIAS
// ============================================================
async function cargarCategorias() {
  try {
    const json = await fetchJSON(`${API}?action=getAll`);
    if (json.success) {
      categorias = json.data;
      mostrarCategorias(categorias);
      
      const totalCat = document.getElementById("totalCategorias");
      const totalCat2 = document.getElementById("totalCategoriasCat");
      
      if (totalCat) totalCat.innerText = categorias.length;
      if (totalCat2) totalCat2.innerText = categorias.length;
    }
  } catch (error) {
    console.error("Error cargando categorias:", error);
  }
}

// ============================================================
// MOSTRAR CATEGORIAS EN TABLA
// ============================================================
function mostrarCategorias(lista) {
  if (!tablaCategorias) return;
  
  tablaCategorias.innerHTML = "";
  
  if (lista.length === 0) {
    tablaCategorias.innerHTML = `
      <tr>
        <td colspan="6">No existen categorías</td>
      </tr>`;
    return;
  }
  
  lista.forEach(cat => {
    tablaCategorias.innerHTML += `
      <tr>
        <td>
          <img src="${imagenURL(cat.image)}" width="60" height="60" style="object-fit:cover">
        </td>
        <td>${cat.name}</td>
        <td>${cat.description ?? ""}</td>
        <td>${cat.total_products ?? 0}</td>
        <td><span class="status active">Activo</span></td>
        <td>
          <button class="btn-primary" onclick="editarCategoria(${cat.id})">Editar</button>
          <button class="btn-danger" onclick="eliminarCategoria(${cat.id})">Eliminar</button>
        </td>
      </tr>`;
  });
}

// ============================================================
// NUEVA CATEGORIA
// ============================================================
btnNueva?.addEventListener("click", () => {
  form.reset();
  document.getElementById("categoriaId").value = "";
  if (preview) preview.src = "";
  document.getElementById("tituloModal").innerText = "Nueva Categoría";
  modal.style.display = "flex";
});

// ============================================================
// CERRAR MODAL CATEGORIA
// ============================================================
cerrar?.addEventListener("click", () => {
  modal.style.display = "none";
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// ============================================================
// PREVIEW IMAGEN CATEGORIA
// ============================================================
archivo?.addEventListener("change", () => {
  const file = archivo.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    if (preview) preview.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// ============================================================
// GUARDAR CATEGORIA
// ============================================================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  let imagen = "";
  
  // Subir imagen local
  if (archivo && archivo.files.length > 0) {
    const fd = new FormData();
    fd.append("image", archivo.files[0]);
    
    const subida = await fetchJSON(UPLOAD, {
      method: "POST",
      body: fd
    });
    
    if (!subida.success) {
      alert(subida.message);
      return;
    }
    
    imagen = subida.url;
  } else {
    imagen = document.getElementById("imagenCategoria").value;
  }
  
  const id = document.getElementById("categoriaId").value;
  
  const data = {
    name: document.getElementById("nombreCategoria").value,
    description: document.getElementById("descripcionCategoria").value,
    image: imagen
  };
  
  let action = "add";
  if (id) {
    action = "update";
    data.id = id;
  }
  
  const json = await fetchJSON(`${API}?action=${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  
  alert(json.message);
  
  if (json.success) {
    modal.style.display = "none";
    form.reset();
    cargarCategorias();
  }
});

// ============================================================
// EDITAR CATEGORIA
// ============================================================
window.editarCategoria = async function(id) {
  const json = await fetchJSON(`${API}?action=get&id=${id}`);
  const cat = json.data;
  
  document.getElementById("categoriaId").value = cat.id;
  document.getElementById("nombreCategoria").value = cat.name;
  document.getElementById("descripcionCategoria").value = cat.description ?? "";
  document.getElementById("imagenCategoria").value = cat.image ?? "";
  
  if (preview) {
    preview.src = imagenURL(cat.image);
  }
  
  if (archivo) {
    archivo.value = "";
  }
  
  document.getElementById("tituloModal").innerText = "Editar Categoría";
  modal.style.display = "flex";
};

// ============================================================
// ELIMINAR CATEGORIA
// ============================================================
window.eliminarCategoria = async function(id) {
  if (!confirm("¿Eliminar categoría?")) return;
  
  const json = await fetchJSON(`${API}?action=delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id: id })
  });
  
  alert(json.message);
  
  if (json.success) {
    cargarCategorias();
  }
};

// ============================================================
// BUSCADOR CATEGORIAS
// ============================================================
buscar?.addEventListener("input", () => {
  const texto = buscar.value.toLowerCase();
  const filtradas = categorias.filter(cat =>
    cat.name.toLowerCase().includes(texto) ||
    (cat.description ?? "").toLowerCase().includes(texto)
  );
  mostrarCategorias(filtradas);
});

// ############################################################
// #                    PRODUCTOS                              #
// ############################################################

// ============================================================
// CARGAR CATEGORIAS PARA SELECT
// ============================================================
async function cargarCategoriasProducto() {
  try {
    const json = await fetchJSON(`${API_CATEGORIAS}?action=getAll`);
    if (json.success) {
      const select = document.getElementById("categoriaProducto");
      if (select) {
        select.innerHTML = '<option value="">Seleccione categoría</option>';
        json.data.forEach(cat => {
          select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
      }
    }
  } catch (error) {
    console.error("Error cargando categorías para select:", error);
  }
}

// ============================================================
// CARGAR PRODUCTOS
// ============================================================
async function cargarProductos() {
  try {
    const json = await fetchJSON(`${API_PRODUCTOS}?action=getAll`);
    
    if (json.success) {
      productos = json.data;
      mostrarProductos(productos);
      
      const totalProd = document.getElementById("totalProductos");
      const totalProd2 = document.getElementById("totalProductosCat");
      
      if (totalProd) totalProd.innerText = productos.length;
      if (totalProd2) totalProd2.innerText = productos.length;
    }
  } catch (error) {
    console.error("Error cargando productos", error);
  }
}

// ============================================================
// MOSTRAR PRODUCTOS
// ============================================================
function mostrarProductos(lista) {
  if (!tablaProductos) return;
  
  if (lista.length === 0) {
    tablaProductos.innerHTML = `<p>No existen productos registrados</p>`;
    return;
  }
  
  let html = `
    <table>
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>`;
  
  lista.forEach(producto => {
    html += `
      <tr>
        <td>
          <img src="${imagenURL(producto.image)}" width="60" height="60" style="object-fit:cover">
        </td>
        <td>${producto.name}</td>
        <td>${producto.category_name ?? ""}</td>
        <td>S/. ${producto.normal_price}</td>
        <td>${producto.stock}</td>
        <td>${producto.active == 1 ? "Activo" : "Inactivo"}</td>
        <td>
          <button class="btn-primary" onclick="editarProducto(${producto.id})">Editar</button>
          <button class="btn-danger" onclick="eliminarProducto(${producto.id})">Eliminar</button>
        </td>
      </tr>`;
  });
  
  html += `</tbody></table>`;
  tablaProductos.innerHTML = html;
}

// ============================================================
// EVENTOS PRODUCTO
// ============================================================
function eventosProducto() {
  // NUEVO PRODUCTO
  btnNuevoProducto?.addEventListener("click", () => {
    formProducto.reset();
    document.getElementById("productoId").value = "";
    document.getElementById("tituloModalProducto").innerText = "Nuevo Producto";
    if (previewProducto) previewProducto.src = "";
    modalProducto.style.display = "flex";
  });
  
  // CERRAR MODAL PRODUCTO
  cerrarModalProducto?.addEventListener("click", () => {
    modalProducto.style.display = "none";
  });
  
  modalProducto?.addEventListener("click", (e) => {
    if (e.target === modalProducto) {
      modalProducto.style.display = "none";
    }
  });
  
  // PREVIEW IMAGEN PRODUCTO
  archivoProducto?.addEventListener("change", () => {
    const file = archivoProducto.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      if (previewProducto) previewProducto.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  
  // GUARDAR PRODUCTO
  formProducto?.addEventListener("submit", guardarProducto);
  
  // BUSCADOR PRODUCTOS
  buscarProducto?.addEventListener("input", () => {
    const texto = buscarProducto.value.toLowerCase();
    const filtrados = productos.filter(producto =>
      producto.name.toLowerCase().includes(texto)
    );
    mostrarProductos(filtrados);
  });
  
  // PREVIEW URL IMAGEN
  const imagenProductoInput = document.getElementById("imagenProducto");
  imagenProductoInput?.addEventListener("input", () => {
    if (imagenProductoInput.value && previewProducto) {
      previewProducto.src = imagenProductoInput.value;
    }
  });
}

// ============================================================
// GUARDAR PRODUCTO (CREAR O ACTUALIZAR)
// ============================================================
async function guardarProducto(e) {
  e.preventDefault();
  
  let imagen = "";
  
  // Subir imagen local si existe
  if (archivoProducto && archivoProducto.files.length > 0) {
    const formData = new FormData();
    formData.append("image", archivoProducto.files[0]);
    
    const subida = await fetchJSON(UPLOAD_PRODUCTO, {
      method: "POST",
      body: formData
    });
    
    if (!subida.success) {
      alert(subida.message);
      return;
    }
    
    imagen = subida.url;
  } else {
    imagen = document.getElementById("imagenProducto").value.trim();
  }
  
  const productoId = document.getElementById("productoId").value;
  
  const data = {
    category_id: document.getElementById("categoriaProducto").value,
    image: imagen,
    name: document.getElementById("nombreProducto").value,
    short_description: document.getElementById("descripcionProducto").value,
    details: document.getElementById("detallesProducto").value,
    terms: document.getElementById("terminosProducto").value,
    stock: document.getElementById("stockProducto").value,
    renewable: document.getElementById("renovableProducto").value,
    normal_price: document.getElementById("precioProducto").value,
    renewal_price: document.getElementById("precioRenovacion").value,
    stock_status: document.getElementById("estadoStock").value,
    active: document.getElementById("activoProducto").value
  };
  
  let json;
  
  if (productoId) {
    // ACTUALIZAR PRODUCTO EXISTENTE
    data.id = productoId;
    json = await fetchJSON(`${API_PRODUCTOS}?action=update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  } else {
    // CREAR NUEVO PRODUCTO
    json = await fetchJSON(`${API_PRODUCTOS}?action=add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  }
  
  alert(json.message);
  
  if (json.success) {
    modalProducto.style.display = "none";
    formProducto.reset();
    if (previewProducto) previewProducto.src = "";
    cargarProductos();
  }
}

// ============================================================
// EDITAR PRODUCTO
// ============================================================
window.editarProducto = async function(id) {
  try {
    const json = await fetchJSON(`${API_PRODUCTOS}?action=get&id=${id}`);
    
    if (!json.success) {
      alert(json.message);
      return;
    }
    
    const p = json.data;
    
    document.getElementById("productoId").value = p.id;
    document.getElementById("categoriaProducto").value = p.category_id;
    document.getElementById("imagenProducto").value = p.image ?? "";
    document.getElementById("nombreProducto").value = p.name;
    document.getElementById("descripcionProducto").value = p.short_description ?? "";
    document.getElementById("detallesProducto").value = p.details ?? "";
    document.getElementById("terminosProducto").value = p.terms ?? "";
    document.getElementById("stockProducto").value = p.stock;
    document.getElementById("renovableProducto").value = p.renewable;
    document.getElementById("precioProducto").value = p.normal_price;
    document.getElementById("precioRenovacion").value = p.renewal_price ?? "";
    document.getElementById("estadoStock").value = p.stock_status;
    document.getElementById("activoProducto").value = p.active;
    
    if (previewProducto) {
      previewProducto.src = imagenURL(p.image);
    }
    
    if (archivoProducto) {
      archivoProducto.value = "";
    }
    
    document.getElementById("tituloModalProducto").innerText = "Editar Producto";
    modalProducto.style.display = "flex";
    
  } catch (error) {
    console.error("Error editando producto", error);
  }
};

// ============================================================
// ELIMINAR PRODUCTO
// ============================================================
window.eliminarProducto = async function(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;
  
  try {
    const json = await fetchJSON(`${API_PRODUCTOS}?action=delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: id })
    });
    
    alert(json.message);
    
    if (json.success) {
      cargarProductos();
    }
  } catch (error) {
    console.error("Error eliminando producto:", error);
    alert("Error al eliminar el producto");
  }
};

// ============================================================
// CERRAR MODALES CON ESC
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modal) modal.style.display = "none";
    if (modalProducto) modalProducto.style.display = "none";
  }
});
// ============================================================
// 🔥 SECCIÓN VENTAS - GESTIÓN DE TICKETS
// ============================================================

const API_SALES_ADMIN = "/Alex/backend/api/sales.php";
let ventasAdminData = [];

// Cargar ventas cuando se hace clic en la sección
document.querySelector('.menu a[data-section="ventas"]')?.addEventListener("click", () => {
  cargarVentasAdmin();
});

// ============================================================
// CARGAR VENTAS
// ============================================================
async function cargarVentasAdmin() {
  const tabla = document.getElementById("tablaVentasAdmin");
  if (!tabla) return;
  
  tabla.innerHTML = `
    <tr>
      <td colspan="13">
        <div style="text-align: center; padding: 40px; color: #666;">
          <i class="fa-solid fa-spinner fa-spin"></i> Cargando ventas...
        </div>
      </td>
    </tr>
  `;
  
  try {
    const json = await fetchJSON(`${API_SALES_ADMIN}?action=getAll`);
    
    if (json.success && json.data) {
      ventasAdminData = json.data;
      mostrarVentasAdmin(json.data);
      actualizarStatsVentas(json.data);
    }
  } catch (error) {
    console.error("Error cargando ventas:", error);
    tabla.innerHTML = `
      <tr>
        <td colspan="13">
          <div style="text-align: center; padding: 40px; color: #ff4444;">
            Error al cargar ventas
          </div>
        </td>
      </tr>
    `;
  }
}

// ============================================================
// MOSTRAR VENTAS EN TABLA
// ============================================================
function mostrarVentasAdmin(ventas) {
  const tabla = document.getElementById("tablaVentasAdmin");
  if (!tabla) return;
  
  if (ventas.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td colspan="13">
          <div style="text-align: center; padding: 40px; color: #666;">
            No hay ventas registradas
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tabla.innerHTML = ventas.map(v => `
    <tr>
      <td><strong style="color: #667eea;">#${v.ticket}</strong></td>
      <td>${v.customer_name || v.customer_username || 'N/A'}</td>
      <td>${v.product_name || 'N/A'}</td>
      <td style="color: #00b09b; font-weight: 600;">S/. ${v.product_price || v.normal_price || '0.00'}</td>
      <td>${v.customer_whatsapp || '-'}</td>
      <td>${v.email || '-'}</td>
      <td>${v.password ? '••••••' : '-'}</td>
      <td>${v.pin || '-'}</td>
      <td>${v.profile || '-'}</td>
      <td>${v.start_date || '-'}</td>
      <td>${v.end_date || '-'}</td>
      <td><span class="badge badge-${v.status || 'available'}">${getStatusTextAdmin(v.status)}</span></td>
      <td>
        <button class="btn-primary" onclick="editarVentaAdmin('${v.ticket}')" style="padding: 6px 12px; font-size: 12px;">
          ✏️ Editar
        </button>
      </td>
    </tr>
  `).join("");
}

// ============================================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================================
function actualizarStatsVentas(ventas) {
  document.getElementById("totalVentasAdmin").textContent = ventas.length;
  document.getElementById("totalPendientesAdmin").textContent = ventas.filter(v => v.status === "available").length;
  document.getElementById("totalSoporteAdmin").textContent = ventas.filter(v => v.status === "support").length;
  document.getElementById("totalExpiradosAdmin").textContent = ventas.filter(v => v.status === "expired").length;
}

// ============================================================
// EDITAR VENTA (ABRIR MODAL)
// ============================================================
window.editarVentaAdmin = function(ticket) {
  const venta = ventasAdminData.find(v => v.ticket === ticket);
  if (!venta) return;
  
  document.getElementById("ventaTicketId").value = venta.ticket;
  document.getElementById("ventaEmail").value = venta.email || "";
  document.getElementById("ventaPassword").value = venta.password || "";
  document.getElementById("ventaPin").value = venta.pin || "";
  document.getElementById("ventaPerfil").value = venta.profile || "";
  document.getElementById("ventaStartDate").value = venta.start_date || "";
  document.getElementById("ventaEndDate").value = venta.end_date || "";
  document.getElementById("ventaCustomerName").value = venta.customer_name || "";
  document.getElementById("ventaWhatsapp").value = venta.customer_whatsapp || "";
  document.getElementById("ventaNotas").value = venta.notes || "";
  document.getElementById("ventaStatus").value = venta.status || "available";
  
  document.getElementById("tituloModalVenta").textContent = `🎫 Gestionar Ticket #${venta.ticket}`;
  document.getElementById("modalEditarVenta").style.display = "flex";
};

// ============================================================
// GUARDAR CAMBIOS DE VENTA
// ============================================================
document.getElementById("formEditarVenta")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const ticket = document.getElementById("ventaTicketId").value;
  
  const data = {
    ticket: ticket,
    email: document.getElementById("ventaEmail").value,
    password: document.getElementById("ventaPassword").value,
    pin: document.getElementById("ventaPin").value,
    profile: document.getElementById("ventaPerfil").value,
    start_date: document.getElementById("ventaStartDate").value,
    end_date: document.getElementById("ventaEndDate").value,
    customer_name: document.getElementById("ventaCustomerName").value,
    customer_whatsapp: document.getElementById("ventaWhatsapp").value,
    notes: document.getElementById("ventaNotas").value,
    status: document.getElementById("ventaStatus").value
  };
  
  try {
    const json = await fetchJSON(`${API_SALES_ADMIN}?action=update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    if (json.success) {
      alert("✅ Venta actualizada correctamente");
      document.getElementById("modalEditarVenta").style.display = "none";
      cargarVentasAdmin();
    } else {
      alert("❌ Error: " + json.message);
    }
  } catch (error) {
    console.error("Error actualizando venta:", error);
    alert("Error al actualizar la venta");
  }
});

// ============================================================
// CERRAR MODAL VENTA
// ============================================================
document.getElementById("cerrarModalVenta")?.addEventListener("click", () => {
  document.getElementById("modalEditarVenta").style.display = "none";
});

// ============================================================
// BUSCADOR DE VENTAS
// ============================================================
document.getElementById("buscarVenta")?.addEventListener("input", () => {
  const texto = document.getElementById("buscarVenta").value.toLowerCase().trim();
  
  if (texto === "") {
    mostrarVentasAdmin(ventasAdminData);
    return;
  }
  
  const filtradas = ventasAdminData.filter(v =>
    v.ticket?.toLowerCase().includes(texto) ||
    v.customer_name?.toLowerCase().includes(texto) ||
    v.product_name?.toLowerCase().includes(texto) ||
    v.email?.toLowerCase().includes(texto)
  );
  
  mostrarVentasAdmin(filtradas);
});

// ============================================================
// AGREGAR CASE "update" EN sales.php (NECESARIO)
// ============================================================
// En tu archivo /Alex/backend/api/sales.php agrega este case:
/*
case "update":
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data["ticket"])) {
        echo json_encode([
            "success" => false,
            "message" => "Ticket no proporcionado"
        ]);
        break;
    }
    
    echo json_encode(updateSale($pdo, $data));
    break;
*/

// Y agrega esta función en sales.php:
/*
function updateSale(PDO $pdo, array $data): array
{
    try {
        $sql = "
            UPDATE sales SET
                email = :email,
                password = :password,
                pin = :pin,
                profile = :profile,
                start_date = :start_date,
                end_date = :end_date,
                customer_name = :customer_name,
                customer_whatsapp = :customer_whatsapp,
                status = :status,
                notes = :notes
            WHERE ticket = :ticket
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":email" => $data["email"] ?? null,
            ":password" => $data["password"] ?? null,
            ":pin" => $data["pin"] ?? null,
            ":profile" => $data["profile"] ?? null,
            ":start_date" => $data["start_date"] ?? null,
            ":end_date" => $data["end_date"] ?? null,
            ":customer_name" => $data["customer_name"] ?? null,
            ":customer_whatsapp" => $data["customer_whatsapp"] ?? null,
            ":status" => $data["status"] ?? "available",
            ":notes" => $data["notes"] ?? null,
            ":ticket" => $data["ticket"]
        ]);
        
        return [
            "success" => true,
            "message" => "Venta actualizada correctamente"
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}
*/

// ============================================================
// UTILIDADES
// ============================================================
function getStatusTextAdmin(status) {
  switch (status) {
    case "available": return "Disponible";
    case "support": return "En Soporte";
    case "renewal": return "Renovación";
    case "expired": return "Expirado";
    default: return status || "Disponible";
  }
}