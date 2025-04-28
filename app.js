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

function renderInventory(showCheckbox = false) {
  const list = document.getElementById("inventoryList");
  if (!list) return;

  list.innerHTML = "";

  // Sort inventory berdasarkan ID
  inventory.sort((a, b) => {
    const aNum = parseInt(a.id.replace(/[^\d]/g, ''));
    const bNum = parseInt(b.id.replace(/[^\d]/g, ''));
    return aNum - bNum;
  });

  inventory.forEach((item, index) => {
    const isAvailable = item.qty > 0;
    const div = document.createElement("div");
    div.className = "item-card" + (isAvailable ? "" : " disabled");
    div.innerHTML = `
      <input type="checkbox" class="multi-check" data-index="${index}" style="display: ${showCheckbox ? "inline-block" : "none"};" ${!isAvailable ? "disabled" : ""}>
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
  if (showCheckbox) setupMultiSelectListener();
}

function updateUsernameDisplay() {
  const usernameSpan = document.getElementById("usernameSpan");
  if (usernameSpan) {
    const user = localStorage.getItem("lotoUser") || "Guest";
    usernameSpan.textContent = user;
  }
}


function checkOut(index) {
  if (inventory[index].qty <= 0) return;
  showPrompt("Describe the activity using this item:", (description) => {
    if (description) {
      inventory[index].qty = 0;
      inventory[index].description = description;
      logActivity("Use", inventory[index].id, 1, description);
      renderInventory();
      showNotice(`Now You Can Use ${inventory[index].id}, Don't forget to return it back after use`, "info");
    }
  });
}

function checkIn(index) {
  if (inventory[index].qty >= 1) return;
  inventory[index].qty = 1;
  inventory[index].description = "";
  logActivity("Return", inventory[index].id, 1);
  renderInventory();
  showNotice(`${inventory[index].id} has been returned`, "success");
}

function useSelectedLOTOS() {
  const selected = [...document.querySelectorAll(".multi-check:checked")].map(cb => parseInt(cb.dataset.index));
  if (selected.length === 0) return alert("Please select at least one available LOTO.");

  showPrompt("Describe the activity for selected LOTO(s):", (description) => {
    if (!description) return;

    const usedIds = [];

    selected.forEach(index => {
      if (inventory[index].qty > 0) {
        inventory[index].qty = 0;
        inventory[index].description = description;
        logActivity("Use", inventory[index].id, 1, description);
        usedIds.push(inventory[index].id);
      }
    });

    renderInventory(); // Reset tampilan, hide checkbox

    if (usedIds.length === 1) {
      showNotice(`Now You Can Use ${usedIds[0]}, Don't forget to return it back after use`, "info");
    } else {
      const tableHTML = `
        <div class="loto-table">
          ${usedIds.map(id => `<div class="loto-item">🔹 ${id}</div>`).join('')}
        </div>
      `;
      showNotice(`You can now use ${usedIds.length} LOTO tools:<br>${tableHTML}<br>Don't forget to return them!`, "info", true);
    }
    const cancelBtn = document.getElementById("cancelButton");
    if (cancelBtn) cancelBtn.remove();

  });
}


let recentlyDeletedLOTOS = [];

function deleteSelectedLOTOS() {
  const selected = [...document.querySelectorAll(".multi-check:checked")].map(cb => parseInt(cb.dataset.index));
  if (selected.length === 0) return alert("Please select at least one LOTO to delete.");

  if (!confirm(`Are you sure you want to delete ${selected.length} LOTO(s)?`)) return;

  recentlyDeletedLOTOS = selected.map(index => inventory[index]);

  selected.sort((a, b) => b - a).forEach(index => {
    inventory.splice(index, 1);
  });

  renderInventory(); // Reset tampilan, hide checkbox
  const cancelBtn = document.getElementById("cancelButton");
  if (cancelBtn) cancelBtn.remove();

  showUndoNotice(`${selected.length} LOTO(s) have been deleted!`, "success");
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
    li.innerHTML = `<strong>${entry.date}</strong> - ${entry.user} <em>${entry.type}</em>: ${entry.id}${desc}`;
    list.appendChild(li);
  });

  addHistoryNavigation();
}


function addNavigation() {
  const existing = document.getElementById("navBar");
  if (existing) existing.remove();

  const nav = document.createElement("div");
  nav.id = "navBar";
  nav.innerHTML = `
    <div class="nav-bar" style="flex-direction: column; align-items: stretch;">
      <div class="floating-action" style="display: flex; justify-content: center; gap: 10px; padding: 6px;">
        <button id="multiUseBtn" style="flex:1;">
          📦 Use Multiple LOTO <span id="counterBadge" style="display:none;">(0)</span>
        </button>
        <button id="multiDeleteBtn" style="background-color: #e74c3c; flex:1;">
          🗑️ Delete Existing LOTO <span id="deleteCounterBadge" style="display:none;">(0)</span>
        </button>
      </div>
      <div style="display: flex; justify-content: center; gap: 10px; padding: 6px 0;">
        <a href="#" id="historyLink" class="history-btn">📜 History</a>   
        <a href="#" id="logoutLink" class="logout-btn">🚪 Logout</a>
      </div>
    </div>
  `;
  document.body.appendChild(nav);

  document.getElementById("multiUseBtn").addEventListener("click", () => {
    if (multiSelectMode === "use") {
      useSelectedLOTOS();
    } else {
      activateMultiSelect("use");
    }
  });
  
  document.getElementById("multiDeleteBtn").addEventListener("click", () => {
    if (multiSelectMode === "delete") {
      deleteSelectedLOTOS();
    } else {
      activateMultiSelect("delete");
    }
  });
  
  

  document.getElementById("historyLink").addEventListener("click", (e) => {
    e.preventDefault();
    pageFadeOut("history.html");
  });
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    pageFadeOut("index.html");
  });
}


function setupMultiSelectListener() {
  const checkboxes = document.querySelectorAll(".multi-check");
  const btnUse = document.getElementById("multiUseBtn");
  const btnDelete = document.getElementById("multiDeleteBtn");
  const badge = document.getElementById("counterBadge");
  const deleteBadge = document.getElementById("deleteCounterBadge");
  if (!btnUse || !badge || !btnDelete || !deleteBadge) return;

  function updateBadge() {
    const selected = [...checkboxes].filter(cb => cb.checked).length;

    badge.textContent = `(${selected})`;
    deleteBadge.textContent = `(${selected})`;

    badge.style.display = selected > 0 ? "inline-block" : "none";
    deleteBadge.style.display = selected > 0 ? "inline-block" : "none";

    if (multiSelectMode === "use") {
      btnUse.disabled = (selected === 0);
      btnDelete.disabled = true;
    } else if (multiSelectMode === "delete") {
      btnDelete.disabled = (selected === 0);
      btnUse.disabled = true;
    } else {
      btnUse.disabled = selected === 0;
      btnDelete.disabled = selected === 0;
    }

    btnUse.style.opacity = btnUse.disabled ? "0.6" : "1";
    btnDelete.style.opacity = btnDelete.disabled ? "0.6" : "1";

    if (selected > 1) {
      btnUse.classList.add("shake");
      btnDelete.classList.add("shake");
      setTimeout(() => {
        btnUse.classList.remove("shake");
        btnDelete.classList.remove("shake");
      }, 500);
    }
  }

  checkboxes.forEach(cb => {
    cb.addEventListener("change", updateBadge);
  });

  updateBadge();
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

function showNotice(message, type = "info", allowHTML = false) {
  const existing = document.getElementById("customNotice");
  if (existing) existing.remove();

  const icon = type === "success" ? "✅" : "🔓";

  const box = document.createElement("div");
  box.id = "customNotice";
  box.innerHTML = `
    <div class="notice-overlay">
      <div class="notice-box slide-up">
        <div class="notice-icon">${icon}</div>
        <p ${allowHTML ? 'style="text-align:left;"' : ""}>${message}</p>
      </div>
    </div>
  `;
  document.body.appendChild(box);

  playSound(type);

  // Fade out after 3 seconds
  setTimeout(() => {
    const overlay = document.getElementById("customNotice");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }
  }, 3000);
}

function showUndoNotice(message, type = "info") {
  const existing = document.getElementById("customNotice");
  if (existing) existing.remove();

  const icon = type === "success" ? "🗑️" : "🔔";

  const box = document.createElement("div");
  box.id = "customNotice";
  box.innerHTML = `
    <div class="notice-overlay">
      <div class="notice-box slide-up">
        <div class="notice-icon">${icon}</div>
        <p>${message}</p>
        <button id="undoButton" style="margin-top:10px; padding:6px 14px; background-color:#27ae60; border:none; color:white; border-radius:8px; font-weight:bold;">UNDO</button>
      </div>
    </div>
  `;
  document.body.appendChild(box);

  playSound(type);

  document.getElementById("undoButton").addEventListener("click", () => {
    undoDelete();
  });

  // Auto remove after 5 seconds kalau tidak klik UNDO
  setTimeout(() => {
    const overlay = document.getElementById("customNotice");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
      recentlyDeletedLOTOS = []; // Clear backup kalau tidak undo
    }
  }, 5000);
}

function undoDelete() {
  if (recentlyDeletedLOTOS.length === 0) return;

  inventory = recentlyDeletedLOTOS.concat(inventory);
  recentlyDeletedLOTOS = [];

  renderInventory();

  // Tambahkan efek fade-in untuk seluruh card baru
  const cards = document.querySelectorAll(".item-card");
  cards.forEach(card => {
    card.classList.add("fade-in");
    setTimeout(() => card.classList.remove("fade-in"), 800); // Hapus class setelah animasi selesai
  });

  showNotice("Deleted LOTO(s) have been restored!", "success");
}

function pageFadeOut(target) {
  document.body.style.transition = "opacity 0.5s";
  document.body.style.opacity = "0";
  setTimeout(() => {
    window.location.href = target;
  }, 500);
}

function addHistoryNavigation() {
  const existing = document.getElementById("navBar");
  if (existing) existing.remove();

  const nav = document.createElement("div");
  nav.id = "navBar";
  nav.innerHTML = `
    <div class="nav-bar">
      <a href="#" id="homeLink" class="home-button">🏠 Home</a>
      <a href="#" id="logoutLink" class="logout-btn">🚪 Logout</a>
    </div>
  `;
  document.body.appendChild(nav);

  document.getElementById("homeLink").addEventListener("click", (e) => {
    e.preventDefault();
    pageFadeOut("inventory.html");
  });
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    pageFadeOut("index.html");
  });
}

let multiSelectMode = "";

function activateMultiSelect(mode) {
  multiSelectMode = mode;
  renderInventory(true); // Tampilkan checkbox

  const btnUse = document.getElementById("multiUseBtn");
  const btnDelete = document.getElementById("multiDeleteBtn");

  // Kunci tombol lain
  if (mode === "use") {
    btnUse.disabled = true; // Klik Use sekali lagi untuk execute
    btnDelete.disabled = true; // Kunci Delete
  } else if (mode === "delete") {
    btnUse.disabled = true; // Kunci Use
    btnDelete.disabled = true; // Klik Delete lagi untuk execute
  }

  btnUse.style.opacity = btnUse.disabled ? "0.6" : "1";
  btnDelete.style.opacity = btnDelete.disabled ? "0.6" : "1";

  showCancelButton();
}


function showCancelButton() {
  const existing = document.getElementById("cancelButton");
  if (existing) return; // Kalau sudah ada, jangan buat lagi

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelButton";
  cancelBtn.textContent = "❌ Cancel Multi Select Mode";
  cancelBtn.style.cssText = "position: fixed; bottom: 140px; left: 50%; transform: translateX(-50%); padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 8px; font-weight: bold; z-index: 999;";
  
  cancelBtn.onclick = cancelMultiSelectMode;
  
  document.body.appendChild(cancelBtn);
}

function cancelMultiSelectMode() {
  multiSelectMode = "";
  const cancelBtn = document.getElementById("cancelButton");
  if (cancelBtn) cancelBtn.remove();

  renderInventory(false); // Reset tampilan tanpa checkbox
}

function playSound(type = "info") {
  let src = "";

  if (type === "success") src = "assets/sounds/success.mp3";
  else if (type === "info") src = "assets/sounds/info.mp3";
  else if (type === "login") src = "assets/sounds/login-success.mp3";

  const audio = new Audio(src);
  audio.volume = 0.5;
  audio.play().catch((e) => console.warn("Sound play blocked:", e));
}


// Auto-render
if (document.getElementById("inventoryList")) renderInventory();
if (document.getElementById("historyList")) renderHistory();
