let suppliers = [
  {
    id: 1,
    nombre: "Lab. Ramos Nicaragua",
    contacto: "María López",
    descripcion: "Tel: 2222-3344 | labramos26@ni.com | Managua",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Lab. Generifar",
    contacto: "Carlos Méndez",
    descripcion: "Tel: 8888-1122 | labgenerifar@ni.com | León",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Lab. Mendez",
    contacto: "Carlos Gutierrez",
    descripcion: "Tel: 8938-1122 | labgenerifar@ni.com | León",
    estado: "Activo"
  },
  {
    id: 4,
    nombre: "Medical S.A.",
    contacto: "Andrea Méndez",
    descripcion: "Tel: 5884-1122 | labgenerifar@ni.com | León",
    estado: "Activo"
  },
  {
    id: 5,
    nombre: "rodriguez S.A.",
    contacto: "Carla Sanchez",
    descripcion: "Tel: 8168-2126 | labgenerifar@ni.com | León",
    estado: "Activo"
  }
];

function renderTabla() {
  let tabla = document.getElementById("tablaProveedores");
  tabla.innerHTML = "";

  suppliers.forEach((p, index) => {
    tabla.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.contacto}</td>
        <td>${p.descripcion}</td>
        <td>${p.estado}</td>
        <td>
          <button onclick="editar(${index})">✏️</button>
          <button onclick="eliminar(${index})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

function abrirModal(){
  document.getElementById("modal").style.display = "flex";
}

function cerrarModal(){
  document.getElementById("modal").style.display = "none";
}

function guardar(){
  let nombre = document.getElementById("nombre").value;
  let contacto = document.getElementById("contacto").value;
  let telefono = document.getElementById("telefono").value;
  let correo = document.getElementById("correo").value;
  let ubicacion = document.getElementById("ubicacion").value;

  if(nombre === "" || contacto === "" || telefono === ""){
    alert("Completa los campos obligatorios");
    return;
  }

  suppliers.push({
    id: suppliers.length + 1,
    nombre,
    contacto,
    descripcion: `Tel: ${telefono} | ${correo} | ${ubicacion}`,
    estado: "Activo"
  });

  cerrarModal();
  renderTabla();
}

function eliminar(index) {
  suppliers.splice(index, 1);
  renderTabla();
}

function editar(index) {
  let nuevoNombre = prompt("Nuevo nombre:", suppliers[index].nombre);
  if(nuevoNombre){
    suppliers[index].nombre = nuevoNombre;
    renderTabla();
  }
  let nuevaDescripcion = prompt("Nueva descripción:", suppliers[index].descripcion);
  if(nuevaDescripcion){
    suppliers[index].descripcion = nuevaDescripcion;
    renderTabla();
  }
}

function goBack(){
  window.history.back();
}

renderTabla();