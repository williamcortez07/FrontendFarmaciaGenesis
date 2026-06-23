document.addEventListener("DOMContentLoaded", () => {
  const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoint: "/Dashboard/kpis",
    tokenKey: "tokenFarmacia",
    timeoutMs: 15000, // 15 segundos
  };

  Chart.defaults.font.family =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-sans")
      .trim() || "Inter, Segoe UI, system-ui, sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.color = "#6c757d"; // --text-muted

  const _charts = {};

  const DOM = {
    errorBanner: document.getElementById("rpt-error-banner"),
    errorMessage: document.getElementById("rpt-error-message"),
    btnRefresh: document.getElementById("btn-refresh-dashboard"),
    btnRetry: document.getElementById("btn-retry-dashboard"),
    kpis: {
      totalSales: document.getElementById("totalSales"),
      topProduct: document.getElementById("topProduct"),
      growth: document.getElementById("growth"),
      quarterTotal: document.getElementById("quarterTotal"),
    },
    charts: {
      sales: {
        skeleton: "skeleton-sales",
        empty: "empty-sales",
        wrapper: "wrapper-sales",
        canvas: "salesChart",
      },
      products: {
        skeleton: "skeleton-products",
        empty: "empty-products",
        wrapper: "wrapper-products",
        canvas: "topProductsChart",
      },
      revenue: {
        skeleton: "skeleton-revenue",
        empty: "empty-revenue",
        wrapper: "wrapper-revenue",
        canvas: "revenueChart",
      },
      growth: {
        skeleton: "skeleton-growth",
        empty: "empty-growth",
        wrapper: "wrapper-growth",
        canvas: "growthChart",
      },
    },
  };

  // ── TOAST NOTIFICATIONS ────────────────────────────────────────────────────
  /**
   * Muestra una notificación toast.
   * @param {string} message  Mensaje a mostrar.
   * @param {"info"|"success"|"warning"|"error"} type  Tipo de toast.
   * @param {number} duration  Duración en ms. 0 = permanente hasta cerrar.
   */
  function showToast(message, type = "info", duration = 4000) {
    const ICONS = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info",
    };

    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("role", "region");
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <i class="fa-solid ${ICONS[type] || ICONS.info} toast__icon" aria-hidden="true"></i>
      <span class="toast__message">${message}</span>
      <button type="button" class="toast__close" aria-label="Cerrar notificación">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    `;

    toast.querySelector(".toast__close").addEventListener("click", () => {
      toast.remove();
    });

    container.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add("toast--visible");

    if (duration > 0) {
      setTimeout(() => toast.remove(), duration);
    }
  }

  function getHeaders() {
    const token = localStorage.getItem(API_CONFIG.tokenKey);
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  // ── ESTADO DE LOS GRÁFICOS ─────────────────────────────────────────────────
  /**
   * Muestra el esqueleto de carga y oculta el gráfico/estado vacío.
   * @param {string} key  Clave del gráfico en DOM.charts.
   */
  function showChartSkeleton(key) {
    const ids = DOM.charts[key];
    _show(ids.skeleton);
    _hide(ids.empty);
    _hide(ids.wrapper);
  }

  /**
   * Muestra el gráfico y oculta el esqueleto/estado vacío.
   * @param {string} key  Clave del gráfico en DOM.charts.
   */
  function showChart(key) {
    const ids = DOM.charts[key];
    _hide(ids.skeleton);
    _hide(ids.empty);
    _show(ids.wrapper);
  }

  /**
   * Muestra el estado vacío y oculta el esqueleto/gráfico.
   * @param {string} key  Clave del gráfico en DOM.charts.
   */
  function showChartEmpty(key) {
    const ids = DOM.charts[key];
    _hide(ids.skeleton);
    _show(ids.empty);
    _hide(ids.wrapper);
  }

  function _show(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function _hide(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  // ── ERROR BANNER ───────────────────────────────────────────────────────────
  function showErrorBanner(message) {
    if (DOM.errorBanner) DOM.errorBanner.hidden = false;
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
  }

  function hideErrorBanner() {
    if (DOM.errorBanner) DOM.errorBanner.hidden = true;
  }

  /**
   * Coloca esqueletos en los KPIs mientras carga.
   */
  function renderKpiSkeletons() {
    const skeletonHTML = `<span class="rpt-skeleton rpt-skeleton--inline"></span>`;
    Object.values(DOM.kpis).forEach((el) => {
      if (el) el.innerHTML = skeletonHTML;
    });
  }

  // ── ESQUELETOS DE GRÁFICOS ─────────────────────────────────────────────────
  function showAllChartSkeletons() {
    Object.keys(DOM.charts).forEach(showChartSkeleton);
  }

  // ── DESTRUIR GRÁFICOS PREVIOS ──────────────────────────────────────────────
  function destroyChart(key) {
    if (_charts[key]) {
      _charts[key].destroy();
      delete _charts[key];
    }
  }

  function destroyAllCharts() {
    Object.keys(_charts).forEach(destroyChart);
  }

  // ── LLENADO DE KPIs ────────────────────────────────────────────────────────
  /**
   * Rellena los KPIs con los datos del endpoint.
   * @param {Object} data  Datos del dashboard.
   */
  function renderKpis(data) {
    const salesByPeriod = Array.isArray(data.salesByPeriod)
      ? data.salesByPeriod
      : [];
    const topProductsSold = Array.isArray(data.topProductsSold)
      ? data.topProductsSold
      : [];
    const monthlyGrowth = Array.isArray(data.monthlyGrowth)
      ? data.monthlyGrowth
      : [];
    const quarterSales = Array.isArray(data.quarterSales)
      ? data.quarterSales
      : [];

    // Total de ventas acumuladas
    const totalVentas = salesByPeriod.reduce(
      (acc, x) => acc + (x.totalVentas || 0),
      0,
    );
    if (DOM.kpis.totalSales) {
      DOM.kpis.totalSales.textContent = totalVentas.toLocaleString("es-NI", {
        style: "currency",
        currency: "NIO",
        maximumFractionDigits: 0,
      });
    }

    // Producto líder (primero del ranking)
    if (DOM.kpis.topProduct) {
      const leader = topProductsSold[0];
      DOM.kpis.topProduct.textContent = leader?.producto || "—";
    }

    // Crecimiento del último mes disponible
    if (DOM.kpis.growth) {
      const lastGrowth =
        monthlyGrowth.at?.(-1) ?? monthlyGrowth[monthlyGrowth.length - 1];
      const pct = lastGrowth?.porcentajeCrecimiento ?? 0;
      const sign = pct > 0 ? "+" : "";
      DOM.kpis.growth.textContent = `${sign}${Number(pct).toFixed(1)}%`;
      DOM.kpis.growth.style.color =
        pct >= 0 ? "var(--color-success)" : "var(--color-danger)";
    }

    // Ventas del trimestre (suma quarterSales o fallback desde salesByPeriod)
    if (DOM.kpis.quarterTotal) {
      let quarterTotal = 0;
      if (quarterSales.length > 0) {
        quarterTotal = quarterSales.reduce(
          (acc, x) => acc + (x.totalVentas || x.ventas || 0),
          0,
        );
      } else {
        // Fallback: últimos 3 períodos de salesByPeriod
        quarterTotal = salesByPeriod
          .slice(-3)
          .reduce((acc, x) => acc + (x.totalVentas || 0), 0);
      }
      DOM.kpis.quarterTotal.textContent = quarterTotal.toLocaleString("es-NI", {
        style: "currency",
        currency: "NIO",
        maximumFractionDigits: 0,
      });
    }
  }

  // ── PALETA DE COLORES PARA GRÁFICOS ───────────────────────────────────────
  const CHART_COLORS = {
    blue: { fill: "rgba(30, 136, 229, 0.15)", border: "#1e88e5" },
    green: { fill: "rgba(39, 174,  96, 0.15)", border: "#27ae60" },
    purple: { fill: "rgba(124,  58, 237, 0.15)", border: "#7c3aed" },
    orange: { fill: "rgba(251, 140,   0, 0.15)", border: "#fb8c00" },
    teal: { fill: "rgba(  0, 150, 136, 0.15)", border: "#009688" },
    red: { fill: "rgba(229,  57,  53, 0.15)", border: "#e53935" },
  };

  const MULTI_COLORS_BORDER = [
    "#1e88e5",
    "#27ae60",
    "#7c3aed",
    "#fb8c00",
    "#e53935",
    "#009688",
    "#f06292",
    "#8d6e63",
    "#546e7a",
    "#43a047",
  ];
  const MULTI_COLORS_BG = MULTI_COLORS_BORDER.map((c) => `${c}CC`);

  /** Opciones comunes reutilizables */
  function getBaseTooltipOptions(currencyFormat = false) {
    return {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: currencyFormat
        ? {
            label: (ctx) =>
              ` $${Number(ctx.raw).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
          }
        : {},
    };
  }

  // ── GRÁFICO 1: VENTAS POR PERÍODO (línea de área) ─────────────────────────
  /**
   * @param {Array<{periodo: string, totalVentas: number}>} salesByPeriod
   */
  function crearGraficoVentas(salesByPeriod) {
    destroyChart("sales");

    if (!Array.isArray(salesByPeriod) || salesByPeriod.length === 0) {
      showChartEmpty("sales");
      return;
    }

    showChart("sales");
    const canvas = document.getElementById("salesChart");
    if (!canvas) return;

    const labels = salesByPeriod.map((x) => x.periodo ?? "—");
    const values = salesByPeriod.map((x) => x.totalVentas ?? 0);

    const gradient = canvas.getContext("2d").createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(30, 136, 229, 0.35)");
    gradient.addColorStop(1, "rgba(30, 136, 229, 0.00)");

    _charts.sales = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Ventas (USD)",
            data: values,
            borderColor: CHART_COLORS.blue.border,
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointBackgroundColor: CHART_COLORS.blue.border,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...getBaseTooltipOptions(),
            callbacks: {
              label: (ctx) =>
                ` $${Number(ctx.raw).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8", font: { size: 12 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.04)", drawBorder: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 12 },
              callback: (v) =>
                "$" +
                Number(v).toLocaleString("es-NI", { notation: "compact" }),
            },
          },
        },
      },
    });
  }

  // ── GRÁFICO 2: PRODUCTOS MÁS VENDIDOS (barras horizontales) ───────────────
  /**
   * @param {Array<{producto: string, totalUnidades: number}>} topProductsSold
   */
  function crearGraficoProductos(topProductsSold) {
    destroyChart("products");

    if (!Array.isArray(topProductsSold) || topProductsSold.length === 0) {
      showChartEmpty("products");
      return;
    }

    showChart("products");
    const canvas = document.getElementById("topProductsChart");
    if (!canvas) return;

    const top = topProductsSold.slice(0, 5);
    const labels = top.map((x) => x.producto ?? "Producto");
    const values = top.map((x) => x.totalUnidades ?? x.cantidad ?? 0);

    _charts.products = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Unidades vendidas",
            data: values,
            backgroundColor: MULTI_COLORS_BG.slice(0, top.length),
            borderColor: MULTI_COLORS_BORDER.slice(0, top.length),
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: getBaseTooltipOptions(),
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.04)", drawBorder: false },
            ticks: { color: "#94a3b8", font: { size: 12 } },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: "#64748b",
              font: { size: 12 },
              // Truncate long product names
              callback: (val, index) => {
                const label = labels[index];
                return label.length > 22 ? label.slice(0, 20) + "…" : label;
              },
            },
          },
        },
      },
    });
  }

  // ── GRÁFICO 3: INGRESOS POR PRODUCTO (dona) ───────────────────────────────
  /**
   * @param {Array<{producto: string, totalIngresos: number}>} topProductRevenues
   */
  function crearGraficoIngresos(topProductRevenues) {
    destroyChart("revenue");

    if (!Array.isArray(topProductRevenues) || topProductRevenues.length === 0) {
      showChartEmpty("revenue");
      return;
    }

    showChart("revenue");
    const canvas = document.getElementById("revenueChart");
    if (!canvas) return;

    const top = topProductRevenues.slice(0, 5);
    const labels = top.map((x) => x.producto ?? "Producto");
    const values = top.map((x) => x.totalIngresos ?? x.ingresos ?? 0);

    _charts.revenue = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            label: "Ingresos (USD)",
            data: values,
            backgroundColor: MULTI_COLORS_BG.slice(0, top.length),
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#64748b",
              font: { size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8,
              boxHeight: 8,
            },
          },
          tooltip: {
            ...getBaseTooltipOptions(),
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct =
                  total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                return ` $${Number(ctx.raw).toLocaleString("es-NI", { minimumFractionDigits: 2 })} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  // ── GRÁFICO 4: CRECIMIENTO MENSUAL (barras con zona positiva/negativa) ─────
  /**
   * @param {Array<{periodo: string, porcentajeCrecimiento: number}>} monthlyGrowth
   */
  function crearGraficoCrecimiento(monthlyGrowth) {
    destroyChart("growth");

    if (!Array.isArray(monthlyGrowth) || monthlyGrowth.length === 0) {
      showChartEmpty("growth");
      return;
    }

    showChart("growth");
    const canvas = document.getElementById("growthChart");
    if (!canvas) return;

    const labels = monthlyGrowth.map((x) => x.periodo ?? "—");
    const values = monthlyGrowth.map((x) => x.porcentajeCrecimiento ?? 0);

    // Colores dinámicos según signo del valor
    const bgColors = values.map((v) =>
      v >= 0 ? "rgba(39, 174, 96, 0.75)" : "rgba(229, 57, 53, 0.75)",
    );
    const borderColors = values.map((v) => (v >= 0 ? "#27ae60" : "#e53935"));

    _charts.growth = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Crecimiento (%)",
            data: values,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...getBaseTooltipOptions(),
            callbacks: {
              label: (ctx) => {
                const sign = ctx.raw >= 0 ? "+" : "";
                return ` ${sign}${Number(ctx.raw).toFixed(2)}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8", font: { size: 12 } },
          },
          y: {
            grid: { color: "rgba(0,0,0,0.04)", drawBorder: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 12 },
              callback: (v) => `${v}%`,
            },
          },
        },
      },
    });
  }

  // ── CARGA PRINCIPAL DEL DASHBOARD ─────────────────────────────────────────
  /**
   * Obtiene los datos del endpoint y coordina el renderizado de KPIs y gráficos.
   * Clasifica los errores para mostrar mensajes descriptivos.
   */
  async function cargarDashboard() {
    // ── UI: estado de carga ────────────────────────────────────────
    hideErrorBanner();
    renderKpiSkeletons();
    showAllChartSkeletons();
    destroyAllCharts();

    // Indicar visualmente que el botón Actualizar está activo
    const refreshIcon = DOM.btnRefresh?.querySelector(".fa-rotate-right");
    if (refreshIcon) refreshIcon.classList.add("is-spinning");
    if (DOM.btnRefresh) DOM.btnRefresh.disabled = true;

    showToast("Cargando información del dashboard…", "info", 2500);

    try {
      // ── Petición con timeout ──────────────────────────────────────
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.timeoutMs,
      );

      let response;
      try {
        response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoint}`, {
          method: "GET",
          headers: getHeaders(),
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw Object.assign(new Error("TIMEOUT"), { code: "TIMEOUT" });
        }
        throw Object.assign(new Error("NETWORK"), { code: "NETWORK" });
      }
      clearTimeout(timeoutId);

      // ── Manejo de respuestas HTTP ────────────────────────────────
      if (response.status === 401 || response.status === 403) {
        throw Object.assign(new Error("UNAUTHORIZED"), {
          code: "UNAUTHORIZED",
        });
      }
      if (!response.ok) {
        throw Object.assign(new Error(`HTTP_${response.status}`), {
          code: "SERVER",
          status: response.status,
        });
      }

      // ── Parseo JSON ──────────────────────────────────────────────
      let data;
      try {
        data = await response.json();
      } catch {
        throw Object.assign(new Error("INVALID_JSON"), {
          code: "INVALID_JSON",
        });
      }

      if (!data || typeof data !== "object") {
        throw Object.assign(new Error("EMPTY_DATA"), { code: "EMPTY_DATA" });
      }

      // ── Renderizado ──────────────────────────────────────────────
      renderKpis(data);
      crearGraficoVentas(data.salesByPeriod);
      crearGraficoProductos(data.topProductsSold);
      crearGraficoIngresos(data.topProductRevenues);
      crearGraficoCrecimiento(data.monthlyGrowth);

      showToast("Dashboard actualizado correctamente.", "success");
    } catch (err) {
      console.error("[Reports] Error cargando dashboard:", err);

      // Mensajes descriptivos según el tipo de error
      const errorMessages = {
        TIMEOUT:
          "La solicitud tardó demasiado. Verifique su conexión e intente de nuevo.",
        NETWORK: "Error de conexión. No se pudo comunicar con el servidor.",
        UNAUTHORIZED:
          "Sesión expirada o no autorizada. Inicie sesión nuevamente.",
        INVALID_JSON: "El servidor devolvió una respuesta inválida.",
        EMPTY_DATA: "No hay datos de reporte disponibles.",
        SERVER: `Error del servidor (${err.status ?? "desconocido"}). Por favor intente más tarde.`,
      };

      const friendlyMessage =
        errorMessages[err.code] ??
        "No fue posible cargar la información del dashboard.";

      // Mostrar banner global de error
      showErrorBanner(friendlyMessage);
      showToast(friendlyMessage, "error", 6000);

      // Colocar estado vacío en todos los gráficos en lugar de dejarlos en blanco
      Object.keys(DOM.charts).forEach(showChartEmpty);

      // Limpiar KPIs
      const fallback = "—";
      if (DOM.kpis.totalSales) DOM.kpis.totalSales.textContent = fallback;
      if (DOM.kpis.topProduct) DOM.kpis.topProduct.textContent = fallback;
      if (DOM.kpis.growth) DOM.kpis.growth.textContent = fallback;
      if (DOM.kpis.quarterTotal) DOM.kpis.quarterTotal.textContent = fallback;
    } finally {
      // ── Restaurar botón ──────────────────────────────────────────
      if (refreshIcon) refreshIcon.classList.remove("is-spinning");
      if (DOM.btnRefresh) DOM.btnRefresh.disabled = false;
    }
  }

  // ── EVENTOS ────────────────────────────────────────────────────────────────
  if (DOM.btnRefresh) {
    DOM.btnRefresh.addEventListener("click", cargarDashboard);
  }

  if (DOM.btnRetry) {
    DOM.btnRetry.addEventListener("click", cargarDashboard);
  }

  // ── ARRANQUE ───────────────────────────────────────────────────────────────
  cargarDashboard();
});
