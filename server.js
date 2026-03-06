const express = require('express');
const path = require('path');
const { promises: fs } = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// Rutas a los archivos
const FILE_PROD = path.join(__dirname, 'data', 'productos.json');
const FILE_VENT = path.join(__dirname, 'data', 'ventas.json');

// Funciones de ayuda (Helpers)
const leerJson = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));
const escribirJson = async (file, data) => fs.writeFile(file, JSON.stringify(data, null, 2));

// --- ENDPOINTS ---
app.get('/productos', async (req, res) => {
    try {
        const productos = await leerJson(FILE_PROD);
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer el catálogo' });
    }
});

// Agregar producto
app.post('/producto', async (req, res) => {
    try {
        const { nombre, precio, stock } = req.body;
        if (!nombre || !precio || !stock) return res.status(400).json({ error: 'Datos incompletos' });

        const productos = await leerJson(FILE_PROD);
        const nuevo = { id: uuidv4(), nombre, precio: Number(precio), stock: Number(stock) };
        
        productos.push(nuevo);
        await escribirJson(FILE_PROD, productos);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar producto' });
    }
});

app.get('/ventas', async (req, res) => {
    try {
        const ventas = await leerJson(FILE_VENT);
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer ventas' });
    }
});

app.post('/venta', async (req, res) => {
    try {
        const carrito = req.body;
        if (!carrito || carrito.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

        const productos = await leerJson(FILE_PROD);
        const ventas = await leerJson(FILE_VENT);

        let subtotal = 0;
        
        for (const item of carrito) {
            const prod = productos.find(p => p.id === item.id);
            if (!prod || prod.stock < item.cantidad) {
                return res.status(409).json({ error: `Stock insuficiente para ${prod?.nombre || 'producto'}` });
            }
            subtotal += prod.precio * item.cantidad;
        }

        carrito.forEach(item => {
            const prod = productos.find(p => p.id === item.id);
            prod.stock -= item.cantidad;
        });

        const nuevaVenta = {
            id: `v-${uuidv4()}`,
            fecha: new Date().toISOString(),
            productos: carrito,
            subtotal: subtotal,
            iva: subtotal * 0.19,
            total: subtotal * 1.19
        };

        ventas.push(nuevaVenta);
        
        await escribirJson(FILE_PROD, productos);
        await escribirJson(FILE_VENT, ventas);

        res.status(201).json(nuevaVenta);

    } catch (error) {
        res.status(500).json({ error: 'Error al procesar la venta' });
    }
});

app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));