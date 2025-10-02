// Funcion para arreglar el sistema de una vez
window.arreglarSistema = function() {
    console.log('Arreglando sistema...');
    
    // Limpiar todo
    localStorage.clear();
    
    // Crear productos basicos
    const productos = {
        productos: [
            {
                id: 1,
                codigo: "FR001",
                nombre: "Manzanas Fuji",
                descripcion: "Manzanas dulces y crujientes",
                precio: 3200,
                stock: 45,
                categoria: "Frutas Frescas",
                imagen: "img/manzana.webp",
                estado: "activo",
                peso: "1kg"
            },
            {
                id: 2,
                codigo: "FR002",
                nombre: "Naranjas Valencia", 
                descripcion: "Naranjas llenas de vitamina C",
                precio: 2800,
                stock: 38,
                categoria: "Frutas Frescas",
                imagen: "img/naranja.webp",
                estado: "activo",
                peso: "1kg"
            },
            {
                id: 3,
                codigo: "VR001",
                nombre: "Zanahorias Organicas",
                descripcion: "Zanahorias organicas dulces",
                precio: 2100,
                stock: 35,
                categoria: "Verduras Organicas", 
                imagen: "img/zanahorias.webp",
                estado: "activo",
                peso: "500g"
            }
        ],
        configuracion: {
            proximoId: 4,
            version: "1.0"
        }
    };
    
    localStorage.setItem('productosJSON', JSON.stringify(productos));
    console.log('Sistema arreglado. Productos creados:', productos.productos.length);
    
    alert('Sistema arreglado. Recargando pagina...');
    location.reload();
};

console.log('Script de arreglo cargado. Ejecuta: arreglarSistema()');