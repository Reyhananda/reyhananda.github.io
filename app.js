// Enhanced LOTO app with multi-select usage feature
const baseItem = {
  name: "LOTO",
  qty: 1,
  img: "assets/loto1.png",
  description: ""
};

let inventory = Array.from({ length: 10 }, (_, i) => ({
  id: `LOTO-${(i + 1).toString().padStart(2, '0')}`,
  ...baseItem,
}));

let history = JSON.parse(localStorage.getItem("lotoHistory")) || [];

function renderInventory() {
  const list = document.getElementById("inventoryList");
  if (!list) return;

  list.innerHTML = "";
  inventory.forEach((item, index) => {
    const isAvailable = item.qty > 0;
    const div = document.createElement("div");
    div.className = "item-card" + (isAvailable ? "" : " disabled");
    div.innerHTML = `
      <input type="checkbox" class="multi-check" data-index="${index}" ${!isAvailable ? "disabled" : ""}>
      <img src="${item.img}" alt="${item.id}">
      <h3 style="color: #2c3e50">${item.id}</h3>
      <p class="status">${isAvailable ? "✅ Available" : "⛔ In Use"}</p>
      ${!isAvailable && item.description ? `<div class="description" style="color: #2c3e50">📋 ${item.description}</div>` : ""}
      <div class="button-group">
        <button onclick="checkOut(${index})" ${!isAvailable ? "disabled" : ""}>🔧 Use</button>
        <button onclick="checkIn(${index})">↩️ Return</button>
      </div>
    `;
    list.appendChild(div);
  });
  const addButton = document.createElement("button");
  addButton.textContent = "➕ Add New LOTO";
  addButton.style.margin = "1rem auto";
  addButton.style.display = "block";
  addButton.onclick = addNewLOTO;
  list.appendChild(addButton);
  
  addNavigation();
  setupMultiSelectListener();
}

function checkOut(index) {
  if (inventory[index].qty <= 0) return;
  showPrompt("Describe the activity using this item:", (description) => {
    if (description) {
      inventory[index].qty = 0;
      inventory[index].description = description;
      logActivity("Use", inventory[index].id, 1, description);
      renderInventory();
    }
  });
}

function checkIn(index) {
  if (inventory[index].qty >= 1) return;
  inventory[index].qty = 1;
  inventory[index].description = "";
  logActivity("Return", inventory[index].id, 1);
  renderInventory();
}

function useSelectedLOTOS() {
  const selected = [...document.querySelectorAll(".multi-check:checked")].map(cb => parseInt(cb.dataset.index));
  if (selected.length === 0) return alert("Please select at least one available LOTO.");

  showPrompt("Describe the activity for selected LOTO(s):", (description) => {
    if (!description) return;
    selected.forEach(index => {
      if (inventory[index].qty > 0) {
        inventory[index].qty = 0;
        inventory[index].description = description;
        logActivity("Use", inventory[index].id, 1, description);
      }
    });
    renderInventory();
  });
}

function addNewLOTO() {
  showPrompt("Enter name for new LOTO:", (name) => {
    if (name) {
      const newItem = {
        id: name,
        name: "LOTO",
        qty: 1,
        img: "assets/loto1.png",
        description: ""
      };
      inventory.push(newItem);
      renderInventory();
    }
  });
}

function logActivity(type, id, qty, description = "") {
  const user = localStorage.getItem("lotoUser") || "Guest";
  const entry = {
    user,
    type,
    id,
    qty,
    description,
    date: new Date().toLocaleString(),
  };
  history.unshift(entry);
  localStorage.setItem("lotoHistory", JSON.stringify(history));
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";
  history.slice(0, 30).forEach(entry => {
    const li = document.createElement("li");
    const desc = entry.description ? ` - 📋 ${entry.description}` : "";
    li.innerHTML = `<strong style="color: #2c3e50">${entry.date}</strong> - ${entry.user} <em style="color: #2c3e50">${entry.type}</em>: ${entry.id}${desc}`;
    list.appendChild(li);
  });

  addNavigation();
}

function addNavigation() {
  const existing = document.getElementById("navBar");
  if (existing) existing.remove();

  const nav = document.createElement("div");
  nav.id = "navBar";
  nav.innerHTML = `
  <div class="nav-bar" style="flex-direction: column; align-items: stretch;">
    <div class="floating-action">
      <button id="multiUseBtn" disabled>📦 Use Selected LOTO</button>
    </div>
    <div style="display: flex; justify-content: center; gap: 10px; padding: 6px 0;">
      <a href="history.html" class="history-btn">📜 History</a>
      <a href="index.html" class="logout-btn">🚪 Logout</a>
    </div>
  </div>
`;

  document.body.appendChild(nav);

  document.getElementById("multiUseBtn").addEventListener("click", useSelectedLOTOS);
}

function setupMultiSelectListener() {
  const checkboxes = document.querySelectorAll(".multi-check");
  const btn = document.getElementById("multiUseBtn");
  if (!btn) return;

  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const anyChecked = [...checkboxes].some(c => c.checked);
      btn.disabled = !anyChecked;
      btn.style.opacity = anyChecked ? "1" : "0.6";
      btn.style.cursor = anyChecked ? "pointer" : "not-allowed";
    });
  });
}

function showPrompt(message, callback) {
  const existing = document.getElementById("customPrompt");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "customPrompt";
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box">
        <h4 style="color: #34495e;">${message}</h4>
        <textarea id="promptInput" rows="4"></textarea>
        <div class="modal-actions">
          <button id="cancelPrompt">Cancel</button>
          <button id="okPrompt">OK</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancelPrompt").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("okPrompt").addEventListener("click", () => {
    const value = document.getElementById("promptInput").value.trim();
    modal.remove();
    callback(value);
  });
}

// Auto-render
if (document.getElementById("inventoryList")) renderInventory();
if (document.getElementById("historyList")) renderHistory();
