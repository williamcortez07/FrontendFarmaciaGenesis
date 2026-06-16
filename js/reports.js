(function () {
  console.log("reports.js loaded");

  function initReportTabs() {
    const tabButtons = Array.from(document.querySelectorAll(".report-tabs [data-tab]"));
    const panels = Array.from(document.querySelectorAll(".report-panel"));

    console.log("reports.js tab init", tabButtons.length, panels.length);

    if (!tabButtons.length || !panels.length) {
      return;
    }

    function setActiveTab(tabName) {
      tabButtons.forEach(function (button) {
        const isActive = button.dataset.tab === tabName;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach(function (panel) {
        const isActive = panel.dataset.tab === tabName;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    }

    tabButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveTab(button.dataset.tab);
      });
    });

    const defaultButton = tabButtons[0];
    if (defaultButton) {
      setActiveTab(defaultButton.dataset.tab);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReportTabs);
  } else {
    initReportTabs();
  }
})();
