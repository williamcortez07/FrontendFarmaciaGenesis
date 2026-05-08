let paymentMethods = [
  {
    id: 1,
    nombre: "Efectivo",
    descripcion: "Pago realizado en efectivo en el establecimiento",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Tarjeta",
    descripcion: "Pago realizado con tarjeta de crédito o débito",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Transferencia Bancaria",
    descripcion: "Pago realizado mediante transferencia bancaria",
    estado: "Activo"
  },

];

function renderTabla() {
  let tabla = document.getElementById("tablaMetodosPago");
  tabla.innerHTML = "";

  paymentMethods.forEach((p, index) => {
    tabla.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre}</td>
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
  let descripcion = document.getElementById("descripcion").value;

  if(nombre === "" ){
    alert("Completa los campos obligatorios");
    return;
  }

  paymentMethods.push({
    id: paymentMethods.length + 1,
    nombre,
    descripcion: `${descripcion}`,
    estado: "Activo"
  });

  cerrarModal();
  renderTabla();
}

function eliminar(index) {
  paymentMethods.splice(index, 1);
  renderTabla();
}

function editar(index) {
  let nuevoNombre = prompt("Nuevo nombre:", paymentMethods[index].nombre);
  if(nuevoNombre){
    paymentMethods[index].nombre = nuevoNombre;
    renderTabla();
  }

  let nuevaDescripcion = prompt("Nueva descripción:", paymentMethods[index].descripcion);
  if(nuevaDescripcion){
    paymentMethods[index].descripcion = nuevaDescripcion;
    renderTabla();
  }
}

function goBack(){
  window.history.back();
}

renderTabla();