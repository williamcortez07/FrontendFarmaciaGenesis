document.addEventListener("DOMContentLoaded", () => {
    const valStockBajo = document.getElementById("valStockBajo");
    const valProximosVencer = document.getElementById("valProximosVencer");
  
    const cargarHome = async () => {
      try {
        const response = await fetch("https://localhost:7204/api/Inventory/dashboard?page=1&limit=10");
        if (!response.ok) throw new Error("Error de conexión con la API");
  
        const { data } = await response.json();
  
        if (valStockBajo) {
          valStockBajo.textContent = data.summary.stockBajo ?? 0;
        }
        
        if (valProximosVencer) {
          valProximosVencer.textContent = data.summary.proximosAVencer ?? data.summary.ProximosAVencer ?? 0;
        }
  
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
      }
    };
  
    cargarHome();
});