const STORAGE_KEY = "ecorp-orcamentos-v1";
const SINAPI_SOURCE = "SINAPI-SP-2024-12-NAO-DESONERADO";
const DATA_VERSION = window.SINAPI_DATA?.version || "SEM-BASE-SINAPI";
const SERVICE_LIST_LIMIT = 80;
const SUGGESTION_LIMIT = 12;
const PROJECT_READER_RULES = [
  { key: "baldrame", label: "Viga baldrame", units: ["m", "m3"], terms: ["baldrame", "viga baldrame"] },
  { key: "alvenaria", label: "Alvenaria", units: ["m2"], terms: ["alvenaria", "parede", "vedacao"] },
  { key: "chapisco", label: "Chapisco", units: ["m2"], terms: ["chapisco"] },
  { key: "reboco", label: "Reboco / emboço", units: ["m2"], terms: ["reboco", "emboco", "massa unica", "revestimento argamassa"] },
  { key: "pintura", label: "Pintura", units: ["m2"], terms: ["pintura", "latex", "acrilica"] },
  { key: "contrapiso", label: "Contrapiso", units: ["m2"], terms: ["contrapiso", "piso cimentado"] },
  { key: "piso", label: "Piso / revestimento", units: ["m2"], terms: ["piso ceramico", "revestimento ceramico", "piso"] },
  { key: "telhado", label: "Telhado / cobertura", units: ["m2"], terms: ["telhado", "cobertura", "trama"] },
  { key: "laje", label: "Laje", units: ["m2", "m3"], terms: ["laje", "laje pre-moldada", "laje macica"] },
  { key: "concreto", label: "Concreto", units: ["m3"], terms: ["concreto", "lancamento concreto"] },
  { key: "forma", label: "Forma", units: ["m2"], terms: ["forma", "formas"] },
  { key: "aco", label: "Aço / armadura", units: ["kg"], terms: ["aco", "armadura", "vergalhao"] },
  { key: "porta", label: "Portas", units: ["un"], terms: ["porta", "portas", "kit porta"] },
  { key: "janela", label: "Janelas", units: ["un"], terms: ["janela", "janelas", "esquadria"] },
  { key: "forro", label: "Forro", units: ["m2"], terms: ["forro", "gesso", "drywall"] }
];

const sampleServices = [
  {
    code: "SINAPI-001",
    description: "Alvenaria de vedacao com bloco ceramico furado",
    unit: "m2",
    price: 86.42,
    type: "EXEMPLO",
    source: "EXEMPLO"
  },
  {
    code: "SINAPI-002",
    description: "Chapisco aplicado em alvenaria e estruturas de concreto",
    unit: "m2",
    price: 7.35,
    type: "EXEMPLO",
    source: "EXEMPLO"
  },
  {
    code: "SINAPI-003",
    description: "Emboco ou massa unica em argamassa traco 1:2:8",
    unit: "m2",
    price: 34.8,
    type: "EXEMPLO",
    source: "EXEMPLO"
  },
  {
    code: "SINAPI-004",
    description: "Piso cimentado com argamassa de cimento e areia",
    unit: "m2",
    price: 52.1,
    type: "EXEMPLO",
    source: "EXEMPLO"
  },
  {
    code: "SINAPI-005",
    description: "Pintura latex acrilica premium, duas demaos",
    unit: "m2",
    price: 18.9,
    type: "EXEMPLO",
    source: "EXEMPLO"
  }
];

const state = loadState();
let activeSuggestionIndex = -1;
let currentSuggestions = [];
let projectEstimates = [];
let structuralEstimates = [];
let extractedCotaSuggestion = null;

const els = {
  clientName: document.querySelector("#clientName"),
  projectName: document.querySelector("#projectName"),
  cityName: document.querySelector("#cityName"),
  bdiInput: document.querySelector("#bdiInput"),
  budgetServiceSearch: document.querySelector("#budgetServiceSearch"),
  selectedServiceCode: document.querySelector("#selectedServiceCode"),
  budgetSuggestions: document.querySelector("#budgetSuggestions"),
  selectedServicePreview: document.querySelector("#selectedServicePreview"),
  quantityInput: document.querySelector("#quantityInput"),
  addItemBtn: document.querySelector("#addItemBtn"),
  budgetItems: document.querySelector("#budgetItems"),
  emptyBudget: document.querySelector("#emptyBudget"),
  directCost: document.querySelector("#directCost"),
  bdiCost: document.querySelector("#bdiCost"),
  finalCost: document.querySelector("#finalCost"),
  serviceForm: document.querySelector("#serviceForm"),
  serviceCode: document.querySelector("#serviceCode"),
  serviceDescription: document.querySelector("#serviceDescription"),
  serviceUnit: document.querySelector("#serviceUnit"),
  servicePrice: document.querySelector("#servicePrice"),
  serviceList: document.querySelector("#serviceList"),
  serviceCardTemplate: document.querySelector("#serviceCardTemplate"),
  searchInput: document.querySelector("#searchInput"),
  csvInput: document.querySelector("#csvInput"),
  resetSampleBtn: document.querySelector("#resetSampleBtn"),
  newBudgetBtn: document.querySelector("#newBudgetBtn"),
  resetBudgetBtn: document.querySelector("#resetBudgetBtn"),
  saveBudgetBtn: document.querySelector("#saveBudgetBtn"),
  topSaveBudgetBtn: document.querySelector("#topSaveBudgetBtn"),
  databaseSaveBudgetBtn: document.querySelector("#databaseSaveBudgetBtn"),
  scrollDatabaseBtn: document.querySelector("#scrollDatabaseBtn"),
  budgetDatabase: document.querySelector("#budgetDatabase"),
  budgetSearchInput: document.querySelector("#budgetSearchInput"),
  budgetCount: document.querySelector("#budgetCount"),
  budgetHistory: document.querySelector("#budgetHistory"),
  emptyHistory: document.querySelector("#emptyHistory"),
  exportDatabaseBtn: document.querySelector("#exportDatabaseBtn"),
  importDatabaseInput: document.querySelector("#importDatabaseInput"),
  exportBudgetBtn: document.querySelector("#exportBudgetBtn"),
  printBtn: document.querySelector("#printBtn"),
  exportPanel: document.querySelector("#exportPanel"),
  closeExportBtn: document.querySelector("#closeExportBtn"),
  downloadCsvLink: document.querySelector("#downloadCsvLink"),
  exportCsvPreview: document.querySelector("#exportCsvPreview"),
  printArea: document.querySelector("#printArea"),
  projectPdfInput: document.querySelector("#projectPdfInput"),
  projectTextInput: document.querySelector("#projectTextInput"),
  externalWallLength: document.querySelector("#externalWallLength"),
  internalWallLength: document.querySelector("#internalWallLength"),
  wallHeight: document.querySelector("#wallHeight"),
  upperExternalWallLength: document.querySelector("#upperExternalWallLength"),
  upperInternalWallLength: document.querySelector("#upperInternalWallLength"),
  upperWallHeight: document.querySelector("#upperWallHeight"),
  openingArea: document.querySelector("#openingArea"),
  masonryOpeningRule: document.querySelector("#masonryOpeningRule"),
  doorCount: document.querySelector("#doorCount"),
  doorSize: document.querySelector("#doorSize"),
  windowCount: document.querySelector("#windowCount"),
  windowSize: document.querySelector("#windowSize"),
  chapiscoFaces: document.querySelector("#chapiscoFaces"),
  rebocoFaces: document.querySelector("#rebocoFaces"),
  finishFaces: document.querySelector("#finishFaces"),
  baldrameLength: document.querySelector("#baldrameLength"),
  baldrameWidth: document.querySelector("#baldrameWidth"),
  baldrameHeight: document.querySelector("#baldrameHeight"),
  floorArea: document.querySelector("#floorArea"),
  upperFloorArea: document.querySelector("#upperFloorArea"),
  roofArea: document.querySelector("#roofArea"),
  wastePercent: document.querySelector("#wastePercent"),
  calculateTakeoffBtn: document.querySelector("#calculateTakeoffBtn"),
  analyzeProjectBtn: document.querySelector("#analyzeProjectBtn"),
  generateBudgetFromTakeoffBtn: document.querySelector("#generateBudgetFromTakeoffBtn"),
  addProjectItemsBtn: document.querySelector("#addProjectItemsBtn"),
  projectReaderStatus: document.querySelector("#projectReaderStatus"),
  takeoffSummary: document.querySelector("#takeoffSummary"),
  cotaPanel: document.querySelector("#cotaPanel"),
  cotaSummary: document.querySelector("#cotaSummary"),
  cotaList: document.querySelector("#cotaList"),
  applyCotasBtn: document.querySelector("#applyCotasBtn"),
  projectEstimates: document.querySelector("#projectEstimates")
};

hydrateForm();
render();

els.clientName.addEventListener("input", updateBudgetMeta);
els.projectName.addEventListener("input", updateBudgetMeta);
els.cityName.addEventListener("input", updateBudgetMeta);
els.bdiInput.addEventListener("input", updateBudgetMeta);
els.budgetServiceSearch.addEventListener("input", updateBudgetSuggestions);
els.budgetServiceSearch.addEventListener("focus", updateBudgetSuggestions);
els.budgetServiceSearch.addEventListener("keydown", handleSuggestionKeys);
els.searchInput.addEventListener("input", renderServices);
els.budgetSearchInput.addEventListener("input", renderBudgetHistory);
els.addItemBtn.addEventListener("click", addBudgetItem);
els.serviceForm.addEventListener("submit", addService);
els.csvInput.addEventListener("change", importCsv);
els.resetSampleBtn.addEventListener("click", restoreSinapiBase);
els.newBudgetBtn.addEventListener("click", newBudget);
els.resetBudgetBtn.addEventListener("click", resetBudget);
els.saveBudgetBtn.addEventListener("click", saveCurrentBudgetToHistory);
els.topSaveBudgetBtn.addEventListener("click", saveCurrentBudgetToHistory);
els.databaseSaveBudgetBtn.addEventListener("click", saveCurrentBudgetToHistory);
els.scrollDatabaseBtn.addEventListener("click", () => {
  els.budgetDatabase.scrollIntoView({ behavior: "smooth", block: "start" });
});
els.exportDatabaseBtn.addEventListener("click", exportBudgetDatabase);
els.importDatabaseInput.addEventListener("change", importBudgetDatabase);
els.exportBudgetBtn.addEventListener("click", exportBudgetCsv);
els.printBtn.addEventListener("click", printBudget);
els.closeExportBtn.addEventListener("click", () => {
  els.exportPanel.hidden = true;
});
els.projectPdfInput.addEventListener("change", readProjectPdf);
els.calculateTakeoffBtn.addEventListener("click", calculateProjectTakeoff);
els.analyzeProjectBtn.addEventListener("click", analyzeProjectText);
els.generateBudgetFromTakeoffBtn.addEventListener("click", generateBudgetFromTakeoff);
els.addProjectItemsBtn.addEventListener("click", addProjectEstimatesToBudget);
els.applyCotasBtn.addEventListener("click", applyExtractedCotas);
document.addEventListener("click", closeSuggestionsOnOutsideClick);

function loadState() {
  const baseServices = getBaseServices();
  const fallbackBudget = {
    client: "",
    project: "",
    city: "",
    bdi: 20,
    items: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return {
        dataVersion: DATA_VERSION,
        hiddenServiceCodes: [],
        services: baseServices,
        budget: fallbackBudget,
        currentBudgetId: null,
        savedBudgets: []
      };
    }

    const hiddenServiceCodes = saved.hiddenServiceCodes || [];
    const visibleBaseServices = baseServices.filter((service) => !hiddenServiceCodes.includes(service.code));
    const customServices = (saved.services || []).filter(isSavedCustomService);

    return {
      dataVersion: DATA_VERSION,
      hiddenServiceCodes,
      services: mergeServices(visibleBaseServices, customServices),
      budget: saved.budget || fallbackBudget,
      currentBudgetId: saved.currentBudgetId || null,
      savedBudgets: saved.savedBudgets || []
    };
  } catch {
    return {
      dataVersion: DATA_VERSION,
      hiddenServiceCodes: [],
      services: baseServices,
      budget: fallbackBudget,
      currentBudgetId: null,
      savedBudgets: []
    };
  }
}

function saveState() {
  const customServices = state.services.filter(isSavedCustomService);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    dataVersion: DATA_VERSION,
    hiddenServiceCodes: state.hiddenServiceCodes || [],
    services: customServices,
    budget: state.budget,
    currentBudgetId: state.currentBudgetId || null,
    savedBudgets: state.savedBudgets || []
  }));
}

function hydrateForm() {
  els.clientName.value = state.budget.client;
  els.projectName.value = state.budget.project;
  els.cityName.value = state.budget.city;
  els.bdiInput.value = state.budget.bdi;
}

function updateBudgetMeta() {
  state.budget.client = els.clientName.value.trim();
  state.budget.project = els.projectName.value.trim();
  state.budget.city = els.cityName.value.trim();
  state.budget.bdi = toNumber(els.bdiInput.value);
  saveState();
  renderSummary();
}

function render() {
  renderBudgetItems();
  renderServices();
  renderBudgetHistory();
  renderSummary();
  clearSelectedService();
}

function renderBudgetItems() {
  els.budgetItems.innerHTML = "";
  els.emptyBudget.hidden = state.budget.items.length > 0;

  state.budget.items.forEach((item) => {
    const tr = document.createElement("tr");
    const total = item.quantity * item.price;

    tr.innerHTML = `
      <td>${escapeHtml(item.code)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td><input min="0" step="0.01" type="number" value="${item.quantity}" aria-label="Quantidade"></td>
      <td>${formatMoney(item.price)}</td>
      <td>${formatMoney(total)}</td>
      <td><button class="icon-button" type="button" aria-label="Remover item">&times;</button></td>
    `;

    tr.querySelector("input").addEventListener("input", (event) => {
      item.quantity = toNumber(event.target.value);
      saveState();
      renderBudgetItems();
      renderSummary();
    });

    tr.querySelector("button").addEventListener("click", () => {
      state.budget.items = state.budget.items.filter((budgetItem) => budgetItem.id !== item.id);
      saveState();
      renderBudgetItems();
      renderSummary();
    });

    els.budgetItems.append(tr);
  });
}

function renderSummary() {
  const direct = getDirectCost();
  const bdi = direct * (toNumber(state.budget.bdi) / 100);
  const final = direct + bdi;

  els.directCost.textContent = formatMoney(direct);
  els.bdiCost.textContent = formatMoney(bdi);
  els.finalCost.textContent = formatMoney(final);
}

function renderBudgetHistory() {
  const term = normalizeSearchText(els.budgetSearchInput.value);
  const budgets = (state.savedBudgets || [])
    .filter((budget) => {
      if (!term) return true;
      const text = normalizeSearchText(`${budget.client} ${budget.project} ${budget.city} ${formatDateTime(budget.updatedAt)}`);
      return text.includes(term);
    })
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  els.budgetHistory.innerHTML = "";
  els.emptyHistory.hidden = budgets.length > 0;
  els.budgetCount.textContent = `${budgets.length} de ${(state.savedBudgets || []).length} orcamento(s)`;

  budgets.forEach((budget) => {
    const card = document.createElement("article");
    card.className = "history-card";
    if (budget.id === state.currentBudgetId) {
      card.classList.add("is-current");
    }

    card.innerHTML = `
      <div>
        <strong>${escapeHtml(getBudgetTitle(budget))}</strong>
        <p>${escapeHtml(budget.client || "Cliente nao informado")} | ${escapeHtml(budget.city || "Cidade nao informada")}</p>
        <span>${budget.items.length} item(ns) | ${formatMoney(getBudgetFinalCost(budget))} | Atualizado em ${formatDateTime(budget.updatedAt)}</span>
      </div>
      <div class="history-actions">
        <button class="ghost" type="button" data-action="open" data-id="${budget.id}" onclick="openSavedBudget('${budget.id}')">Abrir/editar</button>
        <button class="ghost" type="button" data-action="duplicate" data-id="${budget.id}" onclick="duplicateSavedBudget('${budget.id}')">Duplicar</button>
        <button class="icon-button" type="button" data-action="delete" data-id="${budget.id}" onclick="deleteSavedBudget('${budget.id}')" aria-label="Excluir orcamento">&times;</button>
      </div>
    `;
    els.budgetHistory.append(card);
  });
}

function handleHistoryClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (button.dataset.handledByMouseDown === "true") {
    button.dataset.handledByMouseDown = "";
    return;
  }

  runHistoryAction(button);
}

function handleHistoryMouseDown(event) {
  const button = event.target.closest("[data-action]");
  if (!button || event.button !== 0) return;

  button.dataset.handledByMouseDown = "true";
  runHistoryAction(button);
}

function runHistoryAction(button) {
  const id = button.dataset.id;
  if (button.dataset.action === "open") {
    openSavedBudget(id);
  } else if (button.dataset.action === "duplicate") {
    duplicateSavedBudget(id);
  } else if (button.dataset.action === "delete") {
    deleteSavedBudget(id);
  }
}

function saveCurrentBudgetToHistory() {
  if (!state.budget.items.length) {
    alert("Adicione itens antes de salvar o orcamento.");
    return;
  }

  const now = new Date().toISOString();
  const id = state.currentBudgetId || crypto.randomUUID();
  const existing = (state.savedBudgets || []).find((budget) => budget.id === id);
  const savedBudget = {
    id,
    client: state.budget.client,
    project: state.budget.project,
    city: state.budget.city,
    bdi: state.budget.bdi,
    items: cloneBudgetItems(state.budget.items),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  state.currentBudgetId = id;
  state.savedBudgets = [
    savedBudget,
    ...(state.savedBudgets || []).filter((budget) => budget.id !== id)
  ];

  saveState();
  renderBudgetHistory();
  alert("Orcamento salvo no historico.");
}

function openSavedBudget(id) {
  const savedBudget = (state.savedBudgets || []).find((budget) => budget.id === id);
  if (!savedBudget) return;

  if (state.budget.items.length && state.currentBudgetId !== id && !confirm("Abrir este orcamento e substituir o rascunho atual?")) {
    return;
  }

  state.currentBudgetId = id;
  state.budget = budgetFromSaved(savedBudget);
  hydrateForm();
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function duplicateSavedBudget(id) {
  const savedBudget = (state.savedBudgets || []).find((budget) => budget.id === id);
  if (!savedBudget) return;

  const now = new Date().toISOString();
  const copy = {
    ...savedBudget,
    id: crypto.randomUUID(),
    project: `${savedBudget.project || "Orcamento"} - copia`,
    items: cloneBudgetItems(savedBudget.items, true),
    createdAt: now,
    updatedAt: now
  };

  state.savedBudgets = [copy, ...(state.savedBudgets || [])];
  state.currentBudgetId = copy.id;
  state.budget = budgetFromSaved(copy);
  hydrateForm();
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSavedBudget(id) {
  const savedBudget = (state.savedBudgets || []).find((budget) => budget.id === id);
  if (!savedBudget || !confirm(`Excluir "${getBudgetTitle(savedBudget)}" do historico?`)) {
    return;
  }

  state.savedBudgets = (state.savedBudgets || []).filter((budget) => budget.id !== id);
  if (state.currentBudgetId === id) {
    state.currentBudgetId = null;
  }
  saveState();
  renderBudgetHistory();
}

function exportBudgetDatabase() {
  const budgets = state.savedBudgets || [];
  if (!budgets.length) {
    alert("Nenhum orcamento salvo no banco para exportar.");
    return;
  }

  const payload = {
    app: "Sistema ECORP",
    type: "budget-database",
    version: 1,
    exportedAt: new Date().toISOString(),
    budgets
  };
  const json = JSON.stringify(payload, null, 2);
  const filename = `banco-orcamentos-ecorp-${Date.now()}.json`;
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function importBudgetDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      const incomingBudgets = Array.isArray(payload.budgets) ? payload.budgets : [];
      const validBudgets = incomingBudgets
        .filter((budget) => budget && Array.isArray(budget.items))
        .map((budget) => ({
          id: budget.id || crypto.randomUUID(),
          client: budget.client || "",
          project: budget.project || "",
          city: budget.city || "",
          bdi: budget.bdi ?? 20,
          items: cloneBudgetItems(budget.items, false),
          createdAt: budget.createdAt || new Date().toISOString(),
          updatedAt: budget.updatedAt || new Date().toISOString()
        }));

      if (!validBudgets.length) {
        alert("Nao encontrei orcamentos validos nesse arquivo.");
        return;
      }

      state.savedBudgets = mergeBudgets(state.savedBudgets || [], validBudgets);
      saveState();
      renderBudgetHistory();
      alert(`${validBudgets.length} orcamento(s) importado(s) para o banco.`);
    } catch {
      alert("Nao consegui ler o backup JSON do banco de orcamentos.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function mergeBudgets(existing, incoming) {
  const map = new Map((existing || []).map((budget) => [budget.id, budget]));
  incoming.forEach((budget) => map.set(budget.id, budget));
  return Array.from(map.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function renderServices() {
  const term = els.searchInput.value.trim().toLowerCase();
  const services = state.services
    .filter((service) => `${service.code} ${service.description}`.toLowerCase().includes(term))
    .sort(sortServices);
  const visibleServices = services.slice(0, SERVICE_LIST_LIMIT);

  els.serviceList.innerHTML = "";

  visibleServices.forEach((service) => {
    const card = els.serviceCardTemplate.content.cloneNode(true);
    card.querySelector(".service-code").textContent = service.code;
    card.querySelector(".service-description").textContent = service.description;
    card.querySelector(".service-meta").textContent = `${getTypeLabel(service)} | ${service.unit} | ${formatMoney(service.price)}`;
    card.querySelector("button").addEventListener("click", () => removeService(service.code));
    els.serviceList.append(card);
  });

  if (services.length > SERVICE_LIST_LIMIT) {
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = `Mostrando ${SERVICE_LIST_LIMIT} de ${services.length} itens. Use a busca para filtrar por codigo ou descricao.`;
    els.serviceList.append(message);
  }
}

function updateBudgetSuggestions() {
  const term = els.budgetServiceSearch.value.trim();
  els.selectedServiceCode.value = "";

  if (!term) {
    currentSuggestions = [];
    activeSuggestionIndex = -1;
    els.budgetSuggestions.innerHTML = "";
    els.budgetSuggestions.classList.remove("is-open");
    els.selectedServicePreview.textContent = "Digite para ver sugestoes da base SINAPI.";
    return;
  }

  currentSuggestions = findServiceSuggestions(term);
  activeSuggestionIndex = -1;
  renderBudgetSuggestions();
}

function findServiceSuggestions(term) {
  const normalizedTerm = normalizeSearchText(term);
  const words = normalizedTerm.split(" ").filter(Boolean);

  return state.services
    .map((service) => ({
      service,
      score: scoreServiceSuggestion(service, normalizedTerm, words)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || sortServices(a.service, b.service))
    .slice(0, SUGGESTION_LIMIT)
    .map((item) => item.service);
}

function scoreServiceSuggestion(service, term, words) {
  const code = normalizeSearchText(service.code);
  const description = normalizeSearchText(service.description);
  const haystack = `${code} ${description}`;
  let score = 0;

  if (code === term) score += 200;
  if (code.startsWith(term)) score += 120;
  if (description.startsWith(term)) score += 90;
  if (haystack.includes(term)) score += 50;

  const matchedWords = words.filter((word) => haystack.includes(word)).length;
  if (matchedWords) score += matchedWords * 18;
  if (matchedWords === words.length && words.length > 1) score += 35;
  if (service.type === "COMPOSICAO") score += 20;
  if (service.type === "INSUMO") score += 5;

  return score;
}

function renderBudgetSuggestions() {
  els.budgetSuggestions.innerHTML = "";

  if (!currentSuggestions.length) {
    const empty = document.createElement("div");
    empty.className = "suggestion-empty";
    empty.textContent = "Nenhum item encontrado. Tente outra palavra, como reboco, laje, porta ou pintura.";
    els.budgetSuggestions.append(empty);
    els.budgetSuggestions.classList.add("is-open");
    els.selectedServicePreview.textContent = "Nenhum item selecionado.";
    return;
  }

  currentSuggestions.forEach((service, index) => {
    const button = document.createElement("button");
    button.className = "suggestion-item";
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === activeSuggestionIndex));
    button.innerHTML = `
      <strong>${escapeHtml(service.code)}</strong>
      <span>${escapeHtml(service.description)}</span>
      <em>${escapeHtml(getTypeLabel(service))} | ${escapeHtml(service.unit)} | ${formatMoney(service.price)}</em>
    `;
    button.addEventListener("click", () => selectBudgetService(service));
    els.budgetSuggestions.append(button);
  });

  els.budgetSuggestions.classList.add("is-open");
  els.selectedServicePreview.textContent = `Primeira sugestao: ${currentSuggestions[0].code} - ${currentSuggestions[0].description}`;
}

function handleSuggestionKeys(event) {
  if (!currentSuggestions.length && event.key !== "Enter") return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, currentSuggestions.length - 1);
    renderBudgetSuggestions();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
    renderBudgetSuggestions();
  } else if (event.key === "Enter") {
    event.preventDefault();
    selectBudgetService(currentSuggestions[Math.max(activeSuggestionIndex, 0)]);
  } else if (event.key === "Escape") {
    els.budgetSuggestions.classList.remove("is-open");
  }
}

function selectBudgetService(service) {
  if (!service) return;

  els.selectedServiceCode.value = service.code;
  els.budgetServiceSearch.value = `${service.code} - ${service.description}`;
  els.selectedServicePreview.textContent = `${getTypeLabel(service)} | ${service.unit} | ${formatMoney(service.price)}`;
  els.budgetSuggestions.classList.remove("is-open");
  els.quantityInput.focus();
}

function clearSelectedService() {
  currentSuggestions = [];
  activeSuggestionIndex = -1;
  els.selectedServiceCode.value = "";
  els.budgetServiceSearch.value = "";
  els.budgetSuggestions.innerHTML = "";
  els.budgetSuggestions.classList.remove("is-open");
  els.selectedServicePreview.textContent = "Digite para ver sugestoes da base SINAPI.";
}

function closeSuggestionsOnOutsideClick(event) {
  if (!event.target.closest(".service-picker")) {
    els.budgetSuggestions.classList.remove("is-open");
  }
}

async function readProjectPdf(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  setProjectStatus(`Lendo ${files.length} prancha(s)...`);

  if (!window.pdfjsLib) {
    setProjectStatus("Nao foi possivel carregar o leitor de PDF. Verifique a internet ou cole o texto do projeto manualmente.");
    return;
  }

  try {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const documentsText = [];
    const measurements = [];
    const structuralFound = [];
    let pageCount = 0;

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      pageCount += pdf.numPages;
      const pages = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join("\n");
        pages.push(pageText);
        structuralFound.push(...extractStructuralQuantities(pageText, {
          fileName: file.name,
          pageNumber
        }));
        measurements.push(...extractMeasurementsFromPdfItems(content.items, {
          fileName: file.name,
          pageNumber,
          pageWidth: viewport.width,
          pageHeight: viewport.height
        }));
      }

      documentsText.push(`--- ${file.name} ---\n${pages.join("\n\n")}`);
    }

    const text = documentsText.join("\n\n").trim();
    els.projectTextInput.value = text;
    extractedCotaSuggestion = buildTakeoffFromMeasurements(measurements, text);
    structuralEstimates = buildStructuralEstimates(structuralFound);
    renderExtractedCotas(extractedCotaSuggestion);

    if (!text || text.length < 80) {
      if (structuralEstimates.length) {
        projectEstimates = mergeProjectEstimates([...projectEstimates, ...structuralEstimates]);
        renderProjectEstimates();
        setProjectStatus(`Encontrei ${structuralEstimates.length} quantitativo(s) estruturais no PDF. Confira concreto, formas e ferragem.`);
      } else if (extractedCotaSuggestion?.measurements.length) {
        applyExtractedCotas(false);
        setProjectStatus("Extraí algumas cotas numericas do PDF. Confira os campos e clique em Calcular quantitativos.");
      } else {
        setProjectStatus("O PDF parece ser desenho/scan sem texto pesquisavel. Digite as cotas manualmente ou use OCR.");
      }
      return;
    }

    if (extractedCotaSuggestion?.confidence !== "baixa") {
      applyExtractedCotas(false);
      calculateProjectTakeoff();
      setProjectStatus(`Cotas extraidas de ${files.length} arquivo(s). Estrutura: ${structuralEstimates.length} sugestao(oes) para concreto, formas e ferragem.`);
    } else {
      if (structuralEstimates.length) {
        projectEstimates = mergeProjectEstimates([...projectEstimates, ...structuralEstimates]);
        renderProjectEstimates();
      }
      setProjectStatus(`Texto extraido de ${files.length} arquivo(s), ${pageCount} pagina(s). Estrutura: ${structuralEstimates.length} sugestao(oes). Confira ou clique em Analisar texto.`);
    }
  } catch (error) {
    console.error(error);
    setProjectStatus("Nao consegui ler este PDF. Se ele for imagem, digite as areas manualmente no campo de texto.");
  }
}

function analyzeProjectText() {
  const text = els.projectTextInput.value.trim();
  if (!text) {
    setProjectStatus("Anexe um PDF ou cole/digite as medidas do projeto antes de analisar.");
    return;
  }

  structuralEstimates = buildStructuralEstimates(extractStructuralQuantities(text, {
    fileName: "texto colado",
    pageNumber: 1
  }));
  const simplePlanEstimates = buildSimplePlanEstimates(text);

  const found = PROJECT_READER_RULES.map((rule) => {
    const quantity = findQuantityForRule(text, rule);
    if (quantity <= 0) return null;
    const service = findBestServiceForRule(rule);

    return {
      id: crypto.randomUUID(),
      ruleKey: rule.key,
      label: rule.label,
      quantity,
      unit: getPreferredEstimateUnit(rule),
      service,
      confidence: service ? "SINAPI encontrado" : "Sem item SINAPI automatico"
    };
  }).filter(Boolean);

  projectEstimates = mergeProjectEstimates([...found, ...simplePlanEstimates, ...structuralEstimates]);
  renderProjectEstimates();

  if (!projectEstimates.length) {
    setProjectStatus("Nao encontrei quantidades claras. Exemplo para digitar: Alvenaria 120 m2, Chapisco 240 m2, Pintura 180 m2.");
    return;
  }

  setProjectStatus(`${projectEstimates.length} sugestao(oes) encontrada(s). Confira e clique em Adicionar sugestoes.`);
}

function extractStructuralQuantities(text, meta = {}) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const results = [];
  const source = `${meta.fileName || "PDF"}${meta.pageNumber ? ` p.${meta.pageNumber}` : ""}`;

  for (const line of lines) {
    const concreteMatch = line.match(/Volume\s+de\s+concreto\s*\(([^)]*)\)\s*=\s*([0-9]+(?:[,.][0-9]+)?)\s*m[³3]/i);
    if (concreteMatch) {
      results.push({
        key: "estrutura_concreto",
        label: `Concreto estrutural ${cleanupStructuralText(concreteMatch[1] || "C-25")}`,
        quantity: parseProjectNumber(concreteMatch[2]),
        unit: "m3",
        source,
        note: line
      });
      continue;
    }

    const formMatch = line.match(/[ÁA]rea\s+de\s+f[oô]?rma\s*=\s*([0-9]+(?:[,.][0-9]+)?)\s*m[²2]/i);
    if (formMatch) {
      results.push({
        key: "estrutura_forma",
        label: "Forma estrutural",
        quantity: parseProjectNumber(formMatch[1]),
        unit: "m2",
        source,
        note: line
      });
    }
  }

  results.push(...extractSteelTotalsFromStructuralSummary(lines, source));
  return results.filter((item) => item.quantity > 0);
}

function extractSteelTotalsFromStructuralSummary(lines, source) {
  const results = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^PESO TOTAL$/i.test(lines[i])) continue;
    const end = findSteelSummaryEnd(lines, i + 1);
    const windowLines = lines.slice(i + 1, end);
    for (let j = 0; j < windowLines.length - 1; j += 1) {
      const steelType = normalizeSteelType(windowLines[j]);
      if (!steelType) continue;
      const value = parseProjectNumber(windowLines[j + 1]);
      if (value <= 0) continue;
      results.push({
        key: "estrutura_aco",
        label: `Aco estrutural ${steelType}`,
        quantity: value,
        unit: "kg",
        source,
        note: `Resumo do aco ${steelType}`
      });
    }
  }
  return results;
}

function findSteelSummaryEnd(lines, start) {
  const maxEnd = Math.min(lines.length, start + 14);
  for (let i = start; i < maxEnd; i += 1) {
    const line = normalizeSearchText(lines[i]);
    if (i > start && (line.includes("resumo do aco") || line.includes("volume de concreto") || line.includes("area de forma"))) {
      return i;
    }
  }
  return maxEnd;
}

function buildStructuralEstimates(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = `${item.key}|${item.label}|${item.unit}`;
    const current = grouped.get(key) || {
      ...item,
      quantity: 0,
      sources: new Set()
    };
    current.quantity += toNumber(item.quantity);
    current.sources.add(item.source);
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map((item) => {
    const service = findBestServiceForRule({
      key: item.key,
      label: item.label,
      units: [item.unit],
      terms: getStructuralTerms(item)
    });
    const sources = Array.from(item.sources || []).join(", ");
    return {
      id: crypto.randomUUID(),
      ruleKey: item.key,
      label: item.label,
      quantity: roundQuantity(item.quantity),
      unit: item.unit,
      service,
      confidence: service
        ? `Extraido do resumo estrutural (${sources})`
        : `Extraido do resumo estrutural, sem SINAPI automatico (${sources})`
    };
  }).filter((item) => item.quantity > 0);
}

function normalizeSteelType(value) {
  const normalized = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (normalized === "CA50") return "CA50";
  if (normalized === "CA60") return "CA60";
  return "";
}

function getStructuralTerms(item) {
  if (item.key !== "estrutura_aco") return getTakeoffTerms(item.key);
  if (/CA60/i.test(item.label)) return ["aco ca-60", "aco ca60", "ca-60", "ca60", "armadura ca-60"];
  if (/CA50/i.test(item.label)) return ["aco ca-50", "aco ca50", "ca-50", "ca50", "vergalhao", "armadura ca-50"];
  return getTakeoffTerms(item.key);
}

function cleanupStructuralText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseProjectNumber(value) {
  return toNumber(value);
}

function extractMeasurementsFromPdfItems(items, meta) {
  return items
    .map((item) => {
      const value = parseCotaValue(item.str);
      if (!value) return null;

      const transform = item.transform || [];
      const x = toNumber(transform[4]);
      const y = toNumber(transform[5]);
      const angle = Math.round(Math.atan2(toNumber(transform[1]), toNumber(transform[0])) * 180 / Math.PI);
      const region = getPageRegion(x, y, meta.pageWidth, meta.pageHeight);

      return {
        ...meta,
        raw: String(item.str).trim(),
        value,
        x,
        y,
        angle,
        region
      };
    })
    .filter(Boolean)
    .filter((item) => item.value >= 0.15 && item.value <= 30)
    .filter((item) => item.region !== "carimbo");
}

function parseCotaValue(raw) {
  const text = String(raw || "").trim().replace(/\s+/g, "");
  if (!text || text.includes(":") || text.includes("/") || text.includes("-")) return null;
  if (!/^\d{1,2}([,.]\d{1,3})?(m|mt|mts)?$/i.test(text)) return null;
  if (/^0{2,}\d*$/.test(text)) return null;

  const value = toNumber(text.replace(/m|mt|mts/gi, ""));
  if (value <= 0) return null;

  return value;
}

function getPageRegion(x, y, width, height) {
  if (x > width * 0.88) return "carimbo";
  if (y > height * 0.82) return "superior";
  if (y < height * 0.18) return "inferior";
  if (x < width * 0.18) return "esquerda";
  if (x > width * 0.72) return "direita";
  return "centro";
}

function buildTakeoffFromMeasurements(measurements, text) {
  const valid = measurements
    .filter((item) => item.value >= 0.3 && item.value <= 25)
    .sort((a, b) => b.value - a.value);
  const distinct = distinctMeasurements(valid.map((item) => item.value));
  const mainDimensions = distinct.filter((value) => value >= 2).slice(0, 2);
  const simplePlan = findSimplePlanData(text);
  const measuredExternalLength = mainDimensions.length >= 2
    ? roundQuantity((mainDimensions[0] + mainDimensions[1]) * 2)
    : 0;
  const measuredArea = mainDimensions.length >= 2 ? roundQuantity(mainDimensions[0] * mainDimensions[1]) : 0;
  const explicitFloorArea = findAreaFromText(text);
  const floorArea = explicitFloorArea || simplePlan.floorArea || measuredArea;
  const shouldUseSimplePlan = simplePlan.floorArea > 0 && (!measuredArea || measuredArea > simplePlan.floorArea * 2.2);
  const externalLength = shouldUseSimplePlan
    ? estimateExternalWallLengthFromArea(simplePlan.floorArea)
    : measuredExternalLength;
  const internalLength = shouldUseSimplePlan
    ? estimateInternalWallLengthFromArea(simplePlan.floorArea)
    : estimateInternalWallLength(distinct, mainDimensions, externalLength);
  const wallHeights = findWallHeightsFromText(text);
  const openings = findOpeningsFromText(text);
  const explicitRoofArea = findRoofAreaFromText(text);
  const roofArea = explicitRoofArea || (simplePlan.hasRoof ? simplePlan.floorArea : 0);

  return {
    confidence: externalLength ? (shouldUseSimplePlan ? "media" : (mainDimensions.length >= 2 ? "media" : "baixa")) : "baixa",
    measurements: valid.slice(0, 80),
    mainDimensions,
    values: {
      externalWallLength: externalLength,
      internalWallLength,
      wallHeight: wallHeights.ground || wallHeights.default || 2.8,
      upperExternalWallLength: 0,
      upperInternalWallLength: 0,
      upperWallHeight: wallHeights.upper || wallHeights.default || 0,
      openingArea: openings.totalArea,
      doorCount: openings.doorCount,
      doorSize: openings.doorSize,
      windowCount: openings.windowCount,
      windowSize: openings.windowSize,
      baldrameLength: externalLength,
      floorArea,
      upperFloorArea: 0,
      roofArea
    }
  };
}

function distinctMeasurements(values) {
  const unique = [];
  values.forEach((value) => {
    const rounded = roundQuantity(value);
    if (!unique.some((existing) => Math.abs(existing - rounded) < 0.05)) {
      unique.push(rounded);
    }
  });
  return unique;
}

function estimateInternalWallLength(values, mainDimensions, externalLength) {
  if (!externalLength) return 0;
  const internals = values
    .filter((value) => value >= 1 && value <= 7)
    .filter((value) => !mainDimensions.some((main) => Math.abs(main - value) < 0.05));
  const sum = internals.reduce((total, value) => total + value, 0);
  return roundQuantity(Math.min(sum, externalLength * 1.25));
}

function findWallHeightFromText(text) {
  const normalized = normalizeProjectText(text);
  const match = normalized.match(/(?:pe direito|p[eé]-?direito|pd)\s*[:=-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  return match ? toNumber(match[1]) : 0;
}

function findWallHeightsFromText(text) {
  const normalized = normalizeProjectText(text);
  const ground = normalized.match(/(?:terreo|t[eÃ©]rreo|pavimento terreo).{0,80}?(?:pe direito|p[eÃ©]-?direito|pd)\s*[:=-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  const upper = normalized.match(/(?:superior|pavimento superior|2 pavimento|segundo pavimento).{0,80}?(?:pe direito|p[eÃ©]-?direito|pd)\s*[:=-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  const generic = normalized.match(/(?:pe direito|p[eÃ©]-?direito|pd)\s*[:=-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);

  return {
    ground: ground ? toNumber(ground[1]) : 0,
    upper: upper ? toNumber(upper[1]) : 0,
    default: generic ? toNumber(generic[1]) : 0
  };
}

function findRoofAreaFromText(text) {
  const normalized = normalizeProjectText(text);
  const patterns = [
    /(?:area\s+)?(?:cobertura|telhado)\s*[:=-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*m2/i,
    /([0-9]+(?:[.,][0-9]+)?)\s*m2\s*(?:de\s+)?(?:cobertura|telhado)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return toNumber(match[1]);
  }

  return 0;
}

function findAreaFromText(text) {
  const normalized = normalizeProjectText(text);
  const patterns = [
    /area\s+(?:total|construida|pavimento|terreno)?\s*[:=-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*m2/i,
    /([0-9]+(?:[.,][0-9]+)?)\s*m2\s*(?:area\s+total|area\s+construida)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return toNumber(match[1]);
  }

  return 0;
}

function findSimplePlanData(text) {
  const normalized = normalizeProjectText(text);
  const lines = normalizeProjectLines(text);
  const roomAreas = new Map();

  lines.forEach((line, index) => {
    const areaMatch = line.match(/^([0-9]+(?:[.,][0-9]+)?)\s*m2$/i);
    if (!areaMatch) return;

    const area = toNumber(areaMatch[1]);
    if (area <= 0.5 || area > 80) return;

    const label = findNearbyRoomLabel(lines, index);
    if (!label) return;
    roomAreas.set(`${label}|${roundQuantity(area)}`, { label, area });
  });

  const floorArea = roundQuantity(Array.from(roomAreas.values()).reduce((total, item) => total + item.area, 0));
  return {
    floorArea,
    roomCount: roomAreas.size,
    hasRoof: /planta de cobertura|telhado|cobertura/.test(normalized)
  };
}

function buildSimplePlanEstimates(text) {
  const suggestion = buildTakeoffFromMeasurements([], text);
  const values = suggestion.values || {};
  const floorArea = toNumber(values.floorArea);
  const wallHeight = toNumber(values.wallHeight) || 2.8;
  const wallLinear = toNumber(values.externalWallLength) + toNumber(values.internalWallLength);
  if (floorArea <= 0 || wallLinear <= 0) return [];

  const openingArea = toNumber(values.openingArea);
  const finishNetWallArea = Math.max(wallLinear * wallHeight - openingArea, 0);
  const estimates = [];
  addTakeoffEstimate(estimates, "alvenaria", "Alvenaria estimada pelo projeto simplificado", finishNetWallArea, "m2", "Area dos ambientes convertida em metro linear estimado de paredes");
  addTakeoffEstimate(estimates, "chapisco", "Chapisco estimado pelo projeto simplificado", finishNetWallArea * 2, "m2", "Duas faces sobre area estimada de paredes");
  addTakeoffEstimate(estimates, "reboco", "Emboco / reboco estimado pelo projeto simplificado", finishNetWallArea * 2, "m2", "Duas faces sobre area estimada de paredes");
  addTakeoffEstimate(estimates, "pintura", "Pintura estimada pelo projeto simplificado", finishNetWallArea * 2, "m2", "Duas faces sobre area estimada de paredes");
  addTakeoffEstimate(estimates, "contrapiso", "Contrapiso / piso pelo quadro de areas", floorArea, "m2", "Soma das areas dos ambientes");
  addTakeoffEstimate(estimates, "telhado", "Cobertura estimada pelo projeto simplificado", toNumber(values.roofArea), "m2", "Projeto indica planta de cobertura/telhado");
  return estimates;
}

function findNearbyRoomLabel(lines, areaIndex) {
  const candidates = [
    lines[areaIndex + 1],
    lines[areaIndex - 1],
    lines[areaIndex + 2],
    lines[areaIndex - 2]
  ].filter(Boolean);

  return candidates.find(isRoomAreaLabel) || "";
}

function isRoomAreaLabel(value) {
  const label = String(value || "").trim();
  if (label.length < 2 || label.length > 40) return false;
  if (/^[0-9+.,\sx%-]+$/.test(label)) return false;
  if (/planta|cobertura|situacao|escala|quadro|projeto|construcao|cadastro|folha|rua|quadra|lote|cpf|cep|presidente|prudente|alvares|machado|porta|janela|telhado|laje|muro|rampa|referencia|caroline|vitor/.test(label)) return false;
  return /sala|cozinha|dormitorio|quarto|banheiro|closet|circ|circulacao|a s|area de servico|lavanderia|jard|garagem|varanda|suite|despensa/.test(label);
}

function estimateExternalWallLengthFromArea(area) {
  if (area <= 0) return 0;
  return roundQuantity(4 * Math.sqrt(area) * 1.15);
}

function estimateInternalWallLengthFromArea(area) {
  if (area <= 0) return 0;
  return roundQuantity(area * 0.45);
}

function findOpeningsFromText(text) {
  const normalized = normalizeProjectText(text).replace(/,/g, ".");
  const doorMatches = Array.from(normalized.matchAll(/(?:porta|portas|p\d*)[^0-9]{0,20}([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)/gi))
    .map((match) => normalizeOpeningSize(match[1], match[2]));
  const windowMatches = Array.from(normalized.matchAll(/(?:janela|janelas|esquadria|j\d*)[^0-9]{0,20}([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)/gi))
    .map((match) => normalizeOpeningSize(match[1], match[2]));

  const lineOpenings = findOpeningsFromSeparateLines(text);
  const doors = [...doorMatches, ...lineOpenings.doors].filter((item) => item.width > 0 && item.height > 0);
  const windows = [...windowMatches, ...lineOpenings.windows].filter((item) => item.width > 0 && item.height > 0);
  const doorTotalArea = doors.reduce((total, item) => total + item.width * item.height, 0);
  const windowTotalArea = windows.reduce((total, item) => total + item.width * item.height, 0);

  return {
    doorCount: doors.length,
    doorSize: doors[0] ? `${doors[0].width} x ${doors[0].height}` : "",
    windowCount: windows.length,
    windowSize: windows[0] ? `${windows[0].width} x ${windows[0].height}` : "",
    totalArea: roundQuantity(doorTotalArea + windowTotalArea)
  };
}

function findOpeningsFromSeparateLines(normalizedText) {
  const lines = normalizeProjectLines(normalizedText);
  const doors = [];
  const windows = [];

  lines.forEach((line, index) => {
    const isDoor = /porta/.test(line);
    const isWindow = /janela|esquadria/.test(line);
    if (!isDoor && !isWindow) return;

    const dimensionLine = [line, lines[index + 1], lines[index + 2]].find((candidate) => parseOpeningDimension(candidate));
    const size = parseOpeningDimension(dimensionLine);
    if (!size) return;
    if (isDoor) doors.push(size);
    if (isWindow) windows.push(size);
  });

  return { doors, windows };
}

function parseOpeningDimension(value) {
  const clean = String(value || "").replace(/\s+/g, "");
  const match = clean.match(/([0-9]+(?:\.[0-9]+)?)x([0-9]+(?:\.[0-9]+)?)/i);
  return match ? normalizeOpeningSize(match[1], match[2]) : null;
}

function normalizeOpeningSize(widthValue, heightValue) {
  const width = normalizeOpeningMeasure(widthValue);
  const height = normalizeOpeningMeasure(heightValue);
  return { width, height };
}

function normalizeOpeningMeasure(value) {
  const raw = String(value || "").trim();
  const numeric = toNumber(raw);
  if (numeric >= 10 && !raw.includes(".")) return roundQuantity(numeric / 100);
  return roundQuantity(numeric);
}

function normalizeProjectLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => normalizeProjectText(line.replace(/²/g, "2").replace(/³/g, "3")))
    .filter(Boolean);
}

function renderExtractedCotas(suggestion) {
  if (!els.cotaPanel || !els.cotaList || !els.cotaSummary) return;

  if (!suggestion?.measurements?.length) {
    els.cotaPanel.hidden = true;
    return;
  }

  els.cotaPanel.hidden = false;
  const values = suggestion.values;
  els.cotaSummary.textContent = `Sugestao: terreo ${formatNumber(values.externalWallLength + values.internalWallLength)} m lineares, pe-direito ${formatNumber(values.wallHeight)} m; superior ${formatNumber((values.upperExternalWallLength || 0) + (values.upperInternalWallLength || 0))} m lineares, pe-direito ${formatNumber(values.upperWallHeight || 0)} m; cobertura somente se houver area explicita. Confira antes de calcular.`;
  els.cotaList.innerHTML = suggestion.measurements.slice(0, 36).map((item) => (
    `<span class="cota-chip">${formatNumber(item.value)} m <small>${escapeHtml(item.region)}</small></span>`
  )).join("");
}

function applyExtractedCotas(shouldCalculate = true) {
  if (!extractedCotaSuggestion?.values) {
    setProjectStatus("Nenhuma cota extraida para aplicar.");
    return;
  }

  const values = extractedCotaSuggestion.values;
  setInputValueIfPositive(els.externalWallLength, values.externalWallLength);
  setInputValueIfPositive(els.internalWallLength, values.internalWallLength);
  setInputValueIfPositive(els.wallHeight, values.wallHeight);
  setInputValueIfPositive(els.upperExternalWallLength, values.upperExternalWallLength);
  setInputValueIfPositive(els.upperInternalWallLength, values.upperInternalWallLength);
  setInputValueIfPositive(els.upperWallHeight, values.upperWallHeight);
  setInputValueIfPositive(els.openingArea, values.openingArea);
  setInputValueIfPositive(els.doorCount, values.doorCount);
  setTextInputValue(els.doorSize, values.doorSize);
  setInputValueIfPositive(els.windowCount, values.windowCount);
  setTextInputValue(els.windowSize, values.windowSize);
  setInputValueIfPositive(els.baldrameLength, values.baldrameLength);
  setInputValueIfPositive(els.floorArea, values.floorArea);
  setInputValueIfPositive(els.upperFloorArea, values.upperFloorArea);
  setInputValueIfPositive(els.roofArea, values.roofArea);

  if (shouldCalculate) {
    calculateProjectTakeoff();
  }
}

function setInputValueIfPositive(input, value) {
  if (input && toNumber(value) > 0) {
    input.value = roundQuantity(value);
  }
}

function setTextInputValue(input, value) {
  if (input && value) {
    input.value = value;
  }
}

function calculateProjectTakeoff() {
  const externalLength = toNumber(els.externalWallLength.value);
  const internalLength = toNumber(els.internalWallLength.value);
  const wallHeight = toNumber(els.wallHeight.value);
  const upperExternalLength = toNumber(els.upperExternalWallLength.value);
  const upperInternalLength = toNumber(els.upperInternalWallLength.value);
  const upperWallHeight = toNumber(els.upperWallHeight.value);
  const manualOpeningArea = toNumber(els.openingArea.value);
  const openingBreakdown = getOpeningBreakdown();
  const doorArea = openingBreakdown.doorArea;
  const windowArea = openingBreakdown.windowArea;
  const openingArea = manualOpeningArea || openingBreakdown.totalArea;
  const masonryOpeningDiscount = getMasonryOpeningDiscount(openingBreakdown, manualOpeningArea, els.masonryOpeningRule.value);
  const finishOpeningDiscount = openingArea;
  const chapiscoFaces = toNumber(els.chapiscoFaces.value);
  const rebocoFaces = toNumber(els.rebocoFaces.value);
  const finishFaces = toNumber(els.finishFaces.value);
  const baldrameLength = toNumber(els.baldrameLength.value);
  const baldrameWidth = toNumber(els.baldrameWidth.value);
  const baldrameHeight = toNumber(els.baldrameHeight.value);
  const floorArea = toNumber(els.floorArea.value);
  const upperFloorArea = toNumber(els.upperFloorArea.value);
  const roofArea = toNumber(els.roofArea.value);
  const wasteMultiplier = 1 + toNumber(els.wastePercent.value) / 100;

  const wallLinear = externalLength + internalLength;
  const upperWallLinear = upperExternalLength + upperInternalLength;
  const groundWallArea = wallLinear * wallHeight;
  const upperWallArea = upperWallLinear * upperWallHeight;
  const grossWallArea = groundWallArea + upperWallArea;
  const masonryNetWallArea = Math.max(grossWallArea - masonryOpeningDiscount, 0);
  const finishNetWallArea = Math.max(grossWallArea - finishOpeningDiscount, 0);
  const baldrameVolume = baldrameLength * baldrameWidth * baldrameHeight;
  const masonryArea = masonryNetWallArea * wasteMultiplier;
  const chapiscoArea = finishNetWallArea * chapiscoFaces * wasteMultiplier;
  const rebocoArea = finishNetWallArea * rebocoFaces * wasteMultiplier;
  const finishArea = finishNetWallArea * finishFaces * wasteMultiplier;
  const totalFloorArea = floorArea + upperFloorArea;
  const floorAreaWithWaste = totalFloorArea * wasteMultiplier;
  const roofAreaWithWaste = roofArea * wasteMultiplier;

  const estimates = [];
  addTakeoffEstimate(estimates, "baldrame_escavacao", "Escavacao de baldrame", baldrameVolume, "m3", "Comprimento x largura x altura do baldrame");
  addTakeoffEstimate(estimates, "baldrame_concreto", "Concreto de baldrame", baldrameVolume, "m3", "Comprimento x largura x altura do baldrame");
  addTakeoffEstimate(estimates, "alvenaria", "Alvenaria", masonryArea, "m2", "Metro linear de paredes x pe-direito com criterio de desconto de vaos");
  addTakeoffEstimate(estimates, "chapisco", "Chapisco", chapiscoArea, "m2", `${chapiscoFaces} face(s) sobre alvenaria liquida`);
  addTakeoffEstimate(estimates, "reboco", "Emboco / reboco", rebocoArea, "m2", `${rebocoFaces} face(s) sobre alvenaria liquida`);
  addTakeoffEstimate(estimates, "pintura", "Acabamento / pintura", finishArea, "m2", `${finishFaces} face(s) sobre alvenaria liquida`);
  addTakeoffEstimate(estimates, "contrapiso", "Contrapiso", floorAreaWithWaste, "m2", "Area informada de piso/laje");
  addTakeoffEstimate(estimates, "telhado", "Telhado / cobertura", roofAreaWithWaste, "m2", "Area informada de cobertura");

  projectEstimates = mergeProjectEstimates([...estimates, ...structuralEstimates]);
  renderProjectEstimates();
  renderTakeoffSummary({
    wallLinear,
    upperWallLinear,
    groundWallArea,
    upperWallArea,
    grossWallArea,
    doorArea,
    windowArea,
    manualOpeningArea,
    openingArea,
    masonryOpeningDiscount,
    finishOpeningDiscount,
    masonryNetWallArea,
    finishNetWallArea,
    baldrameVolume,
    chapiscoArea,
    rebocoArea,
    finishArea,
    floorArea: floorAreaWithWaste,
    groundFloorArea: floorArea,
    upperFloorArea,
    roofArea: roofAreaWithWaste,
    wastePercent: toNumber(els.wastePercent.value)
  });

  if (!projectEstimates.length) {
    setProjectStatus("Informe pelo menos metro linear, pe-direito, baldrame, piso ou cobertura para calcular.");
    return;
  }

  setProjectStatus(`${projectEstimates.length} quantitativo(s) calculado(s). Confira as quantidades e adicione ao orcamento.`);
}

function addTakeoffEstimate(estimates, ruleKey, label, quantity, unit, note) {
  const rounded = roundQuantity(quantity);
  if (rounded <= 0) return;

  const service = findBestServiceForRule({
    key: ruleKey,
    label,
    units: [unit],
    terms: getTakeoffTerms(ruleKey)
  });

  estimates.push({
    id: crypto.randomUUID(),
    ruleKey,
    label,
    quantity: rounded,
    unit,
    service,
    confidence: service ? `Calculado pelo levantamento: ${note}` : `Calculado, mas sem SINAPI automatico: ${note}`
  });
}

function getTakeoffTerms(ruleKey) {
  const rule = PROJECT_READER_RULES.find((item) => item.key === ruleKey);
  const terms = {
    reboco: ["reboco", "emboco", "massa unica", "revestimento argamassa"],
    pintura: ["pintura", "latex", "acrilica"],
    baldrame_escavacao: ["escavacao", "baldrame", "sapata corrida"],
    baldrame_concreto: ["concreto", "concretagem", "viga baldrame"],
    estrutura_concreto: ["concreto", "concretagem", "concreto estrutural", "fck 25", "c-25"],
    estrutura_forma: ["forma", "formas", "forma estrutura", "forma para concreto"],
    estrutura_aco: ["aco", "armadura", "vergalhao", "corte dobra", "ca-50", "ca-60"]
  };
  return terms[ruleKey] || rule?.terms || [ruleKey];
}

function getRepeatedOpeningArea(countValue, sizeValue) {
  const count = toNumber(countValue);
  const size = parseDimensionPair(sizeValue);
  return count * size.width * size.height;
}

function getOpeningBreakdown() {
  const doorCount = toNumber(els.doorCount.value);
  const doorSize = parseDimensionPair(els.doorSize.value);
  const windowCount = toNumber(els.windowCount.value);
  const windowSize = parseDimensionPair(els.windowSize.value);
  const doorSingleArea = doorSize.width * doorSize.height;
  const windowSingleArea = windowSize.width * windowSize.height;

  return {
    doorCount,
    doorSingleArea,
    doorArea: doorCount * doorSingleArea,
    windowCount,
    windowSingleArea,
    windowArea: windowCount * windowSingleArea,
    totalArea: doorCount * doorSingleArea + windowCount * windowSingleArea
  };
}

function getMasonryOpeningDiscount(openings, manualOpeningArea, rule) {
  if (rule === "none") return 0;
  if (manualOpeningArea > 0) {
    return rule === "excess2" ? Math.max(manualOpeningArea - 2, 0) : manualOpeningArea;
  }
  if (rule === "total") return openings.totalArea;

  const doorDiscount = Math.max(openings.doorSingleArea - 2, 0) * openings.doorCount;
  const windowDiscount = Math.max(openings.windowSingleArea - 2, 0) * openings.windowCount;
  return doorDiscount + windowDiscount;
}

function parseDimensionPair(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/[×]/g, "x");
  const numbers = normalized.match(/[0-9]+(?:\.[0-9]+)?/g) || [];
  return {
    width: toNumber(numbers[0] || 0),
    height: toNumber(numbers[1] || 0)
  };
}

function renderTakeoffSummary(values) {
  if (!els.takeoffSummary) return;

  els.takeoffSummary.innerHTML = `
    <strong>Memoria de calculo</strong><br>
    Terreo: ${formatNumber(values.wallLinear)} m x pe-direito = ${formatNumber(values.groundWallArea)} m2 |
    Superior: ${formatNumber(values.upperWallLinear)} m x pe-direito = ${formatNumber(values.upperWallArea)} m2<br>
    Area bruta paredes: ${formatNumber(values.grossWallArea)} m2 |
    Portas: ${formatNumber(values.doorArea)} m2 |
    Janelas: ${formatNumber(values.windowArea)} m2 |
    Vaos totais: ${formatNumber(values.openingArea)} m2<br>
    Desconto alvenaria: ${formatNumber(values.masonryOpeningDiscount)} m2 |
    Alvenaria liquida: ${formatNumber(values.masonryNetWallArea)} m2 |
    Desconto revestimentos: ${formatNumber(values.finishOpeningDiscount)} m2 |
    Area revestimentos por face: ${formatNumber(values.finishNetWallArea)} m2<br>
    Chapisco: ${formatNumber(values.chapiscoArea)} m2 |
    Emboco/reboco: ${formatNumber(values.rebocoArea)} m2 |
    Acabamento/pintura: ${formatNumber(values.finishArea)} m2<br>
    Baldrame: ${formatNumber(values.baldrameVolume)} m3 |
    Piso terreo + superior: ${formatNumber(values.groundFloorArea)} + ${formatNumber(values.upperFloorArea)} = ${formatNumber(values.floorArea)} m2 |
    Cobertura real informada: ${formatNumber(values.roofArea)} m2 |
    Perda tecnica: ${formatNumber(values.wastePercent)}%`;
}

function findQuantityForRule(text, rule) {
  const normalized = normalizeProjectText(text);
  const unitPattern = rule.units.map((unit) => unit.replace("2", "[²2]").replace("3", "[³3]")).join("|");
  let best = 0;

  rule.terms.forEach((term) => {
    const safeTerm = normalizeProjectText(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const after = new RegExp(`${safeTerm}.{0,90}?([0-9]+(?:[.,][0-9]+)?)\\s*(${unitPattern})\\b`, "gi");
    const before = new RegExp(`([0-9]+(?:[.,][0-9]+)?)\\s*(${unitPattern})\\b.{0,90}?${safeTerm}`, "gi");
    best = Math.max(best, maxQuantityFromMatches(normalized, after), maxQuantityFromMatches(normalized, before));
  });

  return roundQuantity(best);
}

function maxQuantityFromMatches(text, regex) {
  let match;
  let max = 0;
  while ((match = regex.exec(text))) {
    max = Math.max(max, toNumber(match[1]));
  }
  return max;
}

function findBestServiceForRule(rule) {
  const preferredUnit = getPreferredEstimateUnit(rule);
  const candidates = state.services
    .filter((service) => service.type === "COMPOSICAO" || service.source === SINAPI_SOURCE || service.type === "EXEMPLO")
    .map((service) => ({ service, score: scoreServiceForRule(service, rule, preferredUnit) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.service.code.localeCompare(b.service.code));

  return candidates[0]?.service || null;
}

function scoreServiceForRule(service, rule, preferredUnit) {
  const description = normalizeSearchText(`${service.description} ${service.code}`);
  const unit = normalizeUnit(service.unit);
  let score = 0;

  rule.terms.forEach((term) => {
    if (description.includes(normalizeSearchText(term))) score += 8;
  });

  if (unit === preferredUnit) score += 5;
  if (service.type === "COMPOSICAO") score += 3;
  if (description.includes("mao de obra") || description.includes("pedreiro") || description.includes("servente")) score += 1;

  return score;
}

function mergeProjectEstimates(estimates) {
  const map = new Map();
  estimates.forEach((estimate) => {
    const key = `${estimate.ruleKey}|${estimate.label}|${estimate.unit}`;
    const existing = map.get(key);
    if (!existing || estimate.quantity > existing.quantity) {
      map.set(key, estimate);
    }
  });
  return Array.from(map.values());
}

function renderProjectEstimates() {
  if (!els.projectEstimates) return;

  if (!projectEstimates.length) {
    els.projectEstimates.innerHTML = "";
    return;
  }

  els.projectEstimates.innerHTML = projectEstimates.map((estimate) => {
    const serviceText = estimate.service
      ? `${escapeHtml(estimate.service.code)} - ${escapeHtml(estimate.service.description)}`
      : "Nenhum item SINAPI encontrado automaticamente";

    return `
      <article class="estimate-card">
        <input type="checkbox" data-estimate-check="${estimate.id}" checked />
        <div>
          <strong>${escapeHtml(estimate.label)}</strong>
          <small>${serviceText}</small>
          <small>${escapeHtml(estimate.confidence)}</small>
        </div>
        <label>
          Qtd.
          <input data-estimate-quantity="${estimate.id}" min="0" step="0.01" type="number" value="${estimate.quantity}" />
        </label>
        <label>
          Unidade
          <input value="${escapeHtml(estimate.unit)}" readonly />
        </label>
      </article>`;
  }).join("");
}

function addProjectEstimatesToBudget() {
  return addSelectedProjectEstimatesToBudget({ scrollToBudget: false });
}

function generateBudgetFromTakeoff() {
  if (!projectEstimates.length) {
    calculateProjectTakeoff();
  }

  const added = addSelectedProjectEstimatesToBudget({ scrollToBudget: true });
  if (added > 0) {
    setProjectStatus(`${added} item(ns) gerado(s) no orcamento automatico. Confira a tabela e salve no banco.`);
  }
}

function addSelectedProjectEstimatesToBudget({ scrollToBudget }) {
  const selected = projectEstimates.filter((estimate) => {
    const checkbox = document.querySelector(`[data-estimate-check="${estimate.id}"]`);
    return checkbox?.checked && estimate.service;
  });

  if (!selected.length) {
    alert("Nenhuma sugestao com item SINAPI foi selecionada.");
    return 0;
  }

  selected.forEach((estimate) => {
    const quantityInput = document.querySelector(`[data-estimate-quantity="${estimate.id}"]`);
    const quantity = toNumber(quantityInput?.value || estimate.quantity);
    if (quantity <= 0) return;

    state.budget.items.push({
      id: crypto.randomUUID(),
      code: estimate.service.code,
      description: `${estimate.service.description} (${estimate.label} - levantamento do projeto)`,
      unit: estimate.service.unit,
      price: estimate.service.price,
      type: estimate.service.type,
      quantity
    });
  });

  saveState();
  renderBudgetItems();
  renderSummary();
  setProjectStatus(`${selected.length} item(ns) adicionado(s) ao orcamento. Confira as quantidades e salve no banco.`);

  if (scrollToBudget) {
    els.budgetItems.closest(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return selected.length;
}

function setProjectStatus(message) {
  if (els.projectReaderStatus) {
    els.projectReaderStatus.textContent = message;
  }
}

function addBudgetItem() {
  const typedService = currentSuggestions[0];
  const service = state.services.find((item) => item.code === els.selectedServiceCode.value) || typedService;
  const quantity = toNumber(els.quantityInput.value);

  if (!service || quantity <= 0) {
    alert("Digite e selecione um item da base SINAPI, depois informe uma quantidade maior que zero.");
    return;
  }

  state.budget.items.push({
    id: crypto.randomUUID(),
    code: service.code,
    description: service.description,
    unit: service.unit,
    price: service.price,
    type: service.type,
    quantity
  });

  saveState();
  renderBudgetItems();
  renderSummary();
  clearSelectedService();
}

function addService(event) {
  event.preventDefault();

  const service = {
    code: els.serviceCode.value.trim(),
    description: els.serviceDescription.value.trim(),
    unit: els.serviceUnit.value.trim(),
    price: toNumber(els.servicePrice.value),
    type: "CUSTOM",
    source: "CUSTOM"
  };

  if (!service.code || !service.description || !service.unit || service.price <= 0) {
    alert("Preencha codigo, descricao, unidade e preco unitario.");
    return;
  }

  upsertService(service);
  els.serviceForm.reset();
  saveState();
  render();
}

function removeService(code) {
  const service = state.services.find((item) => item.code === code);
  const inUse = state.budget.items.some((item) => item.code === code);
  if (inUse && !confirm("Este servico esta no orcamento. Deseja excluir da base mesmo assim?")) {
    return;
  }

  if (service?.source === SINAPI_SOURCE) {
    state.hiddenServiceCodes = Array.from(new Set([...(state.hiddenServiceCodes || []), code]));
  }

  state.services = state.services.filter((item) => item.code !== code);
  saveState();
  render();
}

function restoreSinapiBase() {
  const customServices = state.services.filter(isSavedCustomService);
  state.hiddenServiceCodes = [];
  state.services = mergeServices(getBaseServices(), customServices);
  saveState();
  render();
}

function newBudget() {
  if (state.budget.items.length && !confirm("Criar um orcamento novo e limpar os itens atuais?")) {
    return;
  }

  resetBudgetDraft();
  saveState();
  render();
}

function resetBudget() {
  if (!confirm("Resetar o orcamento atual? Isso limpa o rascunho, itens e levantamento, mas nao apaga o banco de orcamentos salvos.")) {
    return;
  }

  resetBudgetDraft();
  saveState();
  render();
  setProjectStatus("Orcamento resetado. O banco de orcamentos salvos foi mantido.");
}

function resetBudgetDraft() {
  state.budget = {
    client: "",
    project: "",
    city: "",
    bdi: 20,
    items: []
  };
  state.currentBudgetId = null;
  projectEstimates = [];
  structuralEstimates = [];
  extractedCotaSuggestion = null;

  hydrateForm();
  clearSelectedService();
  clearProjectReaderFields();
}

function clearProjectReaderFields() {
  [
    els.projectTextInput,
    els.projectPdfInput,
    els.externalWallLength,
    els.internalWallLength,
    els.wallHeight,
    els.upperExternalWallLength,
    els.upperInternalWallLength,
    els.upperWallHeight,
    els.openingArea,
    els.doorCount,
    els.doorSize,
    els.windowCount,
    els.windowSize,
    els.baldrameLength,
    els.baldrameWidth,
    els.baldrameHeight,
    els.floorArea,
    els.upperFloorArea,
    els.roofArea
  ].forEach((field) => {
    if (field) field.value = "";
  });

  if (els.masonryOpeningRule) els.masonryOpeningRule.value = "excess2";
  if (els.chapiscoFaces) els.chapiscoFaces.value = "2";
  if (els.rebocoFaces) els.rebocoFaces.value = "2";
  if (els.finishFaces) els.finishFaces.value = "2";
  if (els.wastePercent) els.wastePercent.value = "5";
  if (els.takeoffSummary) els.takeoffSummary.innerHTML = "";
  if (els.projectEstimates) els.projectEstimates.innerHTML = "";
  if (els.cotaPanel) els.cotaPanel.hidden = true;
  if (els.cotaSummary) els.cotaSummary.textContent = "";
  if (els.cotaList) els.cotaList.innerHTML = "";
}

function importCsv(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imported = parseServicesCsv(String(reader.result));
    if (!imported.length) {
      alert("Nao encontrei servicos validos no CSV.");
      return;
    }

    state.services = mergeServices(state.services, imported);
    saveState();
    render();
    alert(`${imported.length} servico(s) importado(s) ou atualizado(s).`);
  };
  reader.readAsText(file, "utf-8");
  event.target.value = "";
}

function parseServicesCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => splitCsvLine(line))
    .filter((row) => row.some(Boolean));

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const indexes = {
    code: findHeader(headers, ["codigo", "cod", "item"]),
    description: findHeader(headers, ["descricao", "servico"]),
    unit: findHeader(headers, ["unidade", "un", "und"]),
    price: findHeader(headers, ["preco", "valor", "custo", "unitario"])
  };

  if (Object.values(indexes).some((index) => index === -1)) {
    alert("O CSV precisa ter colunas de codigo, descricao, unidade e preco.");
    return [];
  }

  return rows.slice(1).map((row) => ({
    code: row[indexes.code]?.trim(),
    description: row[indexes.description]?.trim(),
    unit: row[indexes.unit]?.trim(),
    price: toNumber(row[indexes.price]),
    type: "CUSTOM",
    source: "CUSTOM"
  })).filter((service) => service.code && service.description && service.unit && service.price > 0);
}

function splitCsvLine(line) {
  const separator = line.includes(";") ? ";" : ",";
  const values = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === separator && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function mergeServices(existing, incoming) {
  const map = new Map(existing.map((service) => [service.code, service]));
  incoming.forEach((service) => map.set(service.code, service));
  return Array.from(map.values());
}

function getBaseServices() {
  const sinapiServices = window.SINAPI_DATA?.services;
  return Array.isArray(sinapiServices) && sinapiServices.length ? sinapiServices : sampleServices;
}

function isSavedCustomService(service) {
  return service.source !== SINAPI_SOURCE && service.source !== "EXEMPLO" && !String(service.code || "").startsWith("SINAPI-");
}

function sortServices(a, b) {
  const typeOrder = { COMPOSICAO: 0, INSUMO: 1, CUSTOM: 2, EXEMPLO: 3 };
  return (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9) || a.code.localeCompare(b.code);
}

function getTypeLabel(service) {
  const labels = {
    COMPOSICAO: "Composicao SINAPI",
    INSUMO: "Insumo SINAPI",
    CUSTOM: "Cadastro manual",
    EXEMPLO: "Exemplo"
  };
  return labels[service.type] || "Item";
}

function upsertService(service) {
  state.services = mergeServices(state.services, [service]);
}

function findHeader(headers, names) {
  return headers.findIndex((header) => names.some((name) => header.includes(name)));
}

function normalizeHeader(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeSearchText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProjectText(value) {
  return normalizeSearchText(value)
    .replace(/m\s*[²2]/g, "m2")
    .replace(/m\s*[³3]/g, "m3");
}

function normalizeUnit(value) {
  return normalizeSearchText(value)
    .replace(/m\s*[²2]/g, "m2")
    .replace(/m\s*[³3]/g, "m3")
    .replace("unidade", "un");
}

function getPreferredEstimateUnit(rule) {
  return normalizeUnit(rule.units[0] || "un");
}

function roundQuantity(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function getDirectCost() {
  return state.budget.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

function getBudgetDirectCost(budget) {
  return (budget.items || []).reduce((sum, item) => sum + item.quantity * item.price, 0);
}

function getBudgetFinalCost(budget) {
  return getBudgetDirectCost(budget) * (1 + toNumber(budget.bdi) / 100);
}

function getBudgetTitle(budget) {
  return budget.project || budget.client || "Orcamento sem nome";
}

function budgetFromSaved(savedBudget) {
  return {
    client: savedBudget.client || "",
    project: savedBudget.project || "",
    city: savedBudget.city || "",
    bdi: savedBudget.bdi ?? 20,
    items: cloneBudgetItems(savedBudget.items || [])
  };
}

function cloneBudgetItems(items, regenerateIds = false) {
  return (items || []).map((item) => ({
    ...item,
    id: regenerateIds ? crypto.randomUUID() : item.id || crypto.randomUUID()
  }));
}

function exportBudgetCsv() {
  if (!state.budget.items.length) {
    alert("Adicione itens antes de exportar.");
    return;
  }

  const rows = [
    ["Cliente", state.budget.client],
    ["Obra", state.budget.project],
    ["Municipio", state.budget.city],
    ["BDI (%)", state.budget.bdi],
    [],
    ["Codigo", "Descricao", "Unidade", "Quantidade", "Preco unitario", "Total"],
    ...state.budget.items.map((item) => [
      item.code,
      item.description,
      item.unit,
      item.quantity,
      item.price,
      item.quantity * item.price
    ]),
    [],
    ["Custo direto", getDirectCost()],
    ["BDI", getDirectCost() * (toNumber(state.budget.bdi) / 100)],
    ["Total final", getDirectCost() * (1 + toNumber(state.budget.bdi) / 100)]
  ];

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const filename = `orcamento-${Date.now()}.csv`;
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  showExportPanel(csv, filename);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function printBudget() {
  if (!state.budget.items.length) {
    alert("Adicione itens antes de imprimir.");
    return;
  }

  els.printArea.innerHTML = buildPrintContent();
  document.body.classList.add("printing-budget");

  if (typeof window.print !== "function") {
    alert("Proposta preparada. Use o comando de impressao do navegador.");
    return;
  }

  const cleanupPrintMode = () => document.body.classList.remove("printing-budget");
  window.addEventListener("afterprint", cleanupPrintMode, { once: true });
  window.print();
  setTimeout(cleanupPrintMode, 5000);
}

function showExportPanel(csv, filename) {
  const encodedCsv = encodeURIComponent(`\uFEFF${csv}`);
  els.downloadCsvLink.href = `data:text/csv;charset=utf-8,${encodedCsv}`;
  els.downloadCsvLink.download = filename;
  els.exportCsvPreview.value = csv;
  els.exportPanel.hidden = false;
  els.exportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildPrintContent() {
  const direct = getDirectCost();
  const bdi = direct * (toNumber(state.budget.bdi) / 100);
  const final = direct + bdi;
  const today = new Intl.DateTimeFormat("pt-BR").format(new Date());
  const rows = state.budget.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.code)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td class="number">${formatNumber(item.quantity)}</td>
      <td class="number">${formatMoney(item.price)}</td>
      <td class="number">${formatMoney(item.quantity * item.price)}</td>
    </tr>
  `).join("");

  return `
        <header class="print-header">
          <h1>Sistema ECORP</h1>
          <p>Proposta de orcamento</p>
          <p>Data: ${today}</p>
        </header>

        <section class="meta">
          <div><strong>Cliente</strong><br>${escapeHtml(state.budget.client || "-")}</div>
          <div><strong>Obra</strong><br>${escapeHtml(state.budget.project || "-")}</div>
          <div><strong>Municipio</strong><br>${escapeHtml(state.budget.city || "-")}</div>
          <div><strong>BDI</strong><br>${formatNumber(state.budget.bdi)}%</div>
        </section>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Codigo</th>
              <th>Descricao</th>
              <th>Un.</th>
              <th>Qtd.</th>
              <th>Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <section class="totals">
          <div><span>Custo direto</span><strong>${formatMoney(direct)}</strong></div>
          <div><span>BDI</span><strong>${formatMoney(bdi)}</strong></div>
          <div class="final"><span>Total final</span><strong>${formatMoney(final)}</strong></div>
        </section>`;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 4
  }).format(toNumber(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function toNumber(value) {
  if (typeof value === "number") return value;
  const raw = String(value).trim();

  if (raw.includes(",") && raw.includes(".")) {
    return Number(raw.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (raw.includes(",")) {
    return Number(raw.replace(",", ".")) || 0;
  }

  return Number(raw) || 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}
