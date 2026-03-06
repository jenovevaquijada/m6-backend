let carrito = [];

async function cargarProductos() {
    const res = await fetch('/productos');
    const productos = await res.json();
    
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = '';

    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="card">
        <img src="${p.imagen}" alt="${p.nombre}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;">
        <h3>${p.nombre}</h3>
        <p>Precio: $${p.precio.toLocaleString('es-CL')}</p>
        <p>Stock: ${p.stock}</p>
        <button onclick="agregarAlCarrito('${p.id}', '${p.nombre}', ${p.precio})">
            Agregar al carrito
        </button>
    </div>
`;
    });
}

function agregarAlCarrito(id, nombre, precio) {
    const item = carrito.find(p => p.id === id);
    if (item) {
        item.cantidad++;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    renderizarCarrito();
}
function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const contador = document.getElementById('contador-carrito');

    lista.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid #ddd;">
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Unitario</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody id="body-carrito"></tbody>
        </table>
    `;

    const body = document.getElementById('body-carrito');
    let subtotalGeneral = 0;
    let cantidadTotal = 0;

    carrito.forEach((p, index) => {
        const subtotalItem = p.precio * p.cantidad;
        subtotalGeneral += subtotalItem;
        cantidadTotal += p.cantidad;

        body.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>${p.cantidad}</td>
                <td>$${p.precio.toLocaleString('es-CL')}</td>
                <td>$${(p.precio * p.cantidad).toLocaleString('es-CL')}</td>
                <td><button onclick="quitarDelCarrito(${index})">Quitar</button></td>
            </tr>
    `;
});

    const iva = subtotalGeneral * 0.19;
    const total = subtotalGeneral + iva;

    contador.innerText = `Carrito (${cantidadTotal})`;
    document.getElementById('resumen-compra').innerHTML = `
        <div style="text-align:right;">
            <p>Subtotal: $${subtotalGeneral.toLocaleString('es-CL')}</p>
            <p>IVA (19%): $${iva.toLocaleString('es-CL')}</p>
            <hr>
            <h3>Total: $${total.toLocaleString('es-CL')}</h3>
            <button onclick="realizarCompra()">Comprar ahora</button>
        </div>
    `;
}

// Quitar un producto del carrito
function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

async function realizarCompra() {
    if (carrito.length === 0) return alert("El carrito está vacío");

    try {
        const res = await fetch('/venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carrito) 
        });

        const data = await res.json();

        if (res.status === 201) {
            alert(`✅ ¡Compra procesada!\nID: ${data.id}\nTotal: $${data.total.toFixed(0)}`);
            carrito = [];
            renderizarCarrito();
            cargarProductos(); 
        } else {
            alert("❌ Error: " + data.error);
        }
    } catch (error) {
        alert("Hubo un problema con la conexión al servidor");
    }
}

document.addEventListener('DOMContentLoaded', cargarProductos);