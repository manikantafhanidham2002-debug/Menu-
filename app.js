/**
 * L'Atelier Gourmet — Restaurant Menu Application Controller
 * Interactive Menu Board, Live Cart, Dish Inspector, Search & Audio Engine
 */

import { RESTAURANT_INFO, MENU_VOLUMES, ALL_MENU_ITEMS } from "./menu-data.js";

/* ==========================================================================
   1. AUDIO SYNTHESIS ENGINE (Web Audio API)
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.45);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const sounds = new SoundEngine();

/* ==========================================================================
   2. SHOPPING CART & ORDER SYSTEM
   ========================================================================== */
class CartManager {
  constructor() {
    this.items = JSON.parse(localStorage.getItem("latelier_cart") || "[]");
    this.initDOM();
    this.render();
  }

  initDOM() {
    this.badge = document.getElementById("cart-badge-count");
    this.drawer = document.getElementById("cart-drawer");
    this.itemsList = document.getElementById("cart-items-list");
    this.emptyState = document.getElementById("empty-cart-state");
    this.subtotalEl = document.getElementById("cart-subtotal");
    this.taxEl = document.getElementById("cart-tax");
    this.grandTotalEl = document.getElementById("cart-grand-total");
    this.checkoutBtn = document.getElementById("btn-checkout");

    document.getElementById("btn-cart-toggle")?.addEventListener("click", () => this.toggleDrawer());
    document.getElementById("btn-close-cart")?.addEventListener("click", () => this.closeDrawer());
    this.checkoutBtn?.addEventListener("click", () => this.checkout());
  }

  save() {
    localStorage.setItem("latelier_cart", JSON.stringify(this.items));
    this.render();
  }

  addItem(dishId, qty = 1) {
    const dish = ALL_MENU_ITEMS.find(d => d.id === dishId);
    if (!dish) return;

    const existing = this.items.find(i => i.dishId === dishId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({ dishId, qty, dish });
    }

    sounds.playChime();
    this.save();
    this.animateBadge();
    showToast(`Added "${dish.name}" to your order`);
  }

  updateQty(dishId, delta) {
    const item = this.items.find(i => i.dishId === dishId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      this.items = this.items.filter(i => i.dishId !== dishId);
    }
    sounds.playClick();
    this.save();
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.dish.price * item.qty), 0);
  }

  animateBadge() {
    if (this.badge) {
      this.badge.classList.remove("bounce");
      void this.badge.offsetWidth;
      this.badge.classList.add("bounce");
    }
  }

  toggleDrawer() {
    this.drawer?.classList.toggle("open");
    sounds.playClick();
  }

  closeDrawer() {
    this.drawer?.classList.remove("open");
    sounds.playClick();
  }

  checkout() {
    if (this.items.length === 0) return;
    const totalFormatted = `$${(this.getSubtotal() * (1 + RESTAURANT_INFO.taxRate)).toFixed(2)}`;
    showToast(`Thank you! Your order (${totalFormatted}) has been sent to the kitchen.`);
    this.items = [];
    this.save();
    this.closeDrawer();
    sounds.playChime();
  }

  render() {
    const count = this.getTotalCount();
    if (this.badge) {
      this.badge.textContent = count;
      this.badge.style.display = count > 0 ? "grid" : "none";
    }

    const subtotal = this.getSubtotal();
    const tax = subtotal * RESTAURANT_INFO.taxRate;
    const grandTotal = subtotal + tax;

    if (this.subtotalEl) this.subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (this.taxEl) this.taxEl.textContent = `$${tax.toFixed(2)}`;
    if (this.grandTotalEl) this.grandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;
    if (this.checkoutBtn) {
      this.checkoutBtn.disabled = this.items.length === 0;
      this.checkoutBtn.textContent = this.items.length > 0 
        ? `Proceed to Order ($${grandTotal.toFixed(2)})` 
        : "Tray is Empty";
    }

    if (!this.itemsList || !this.emptyState) return;

    if (this.items.length === 0) {
      this.emptyState.style.display = "grid";
      this.itemsList.innerHTML = "";
    } else {
      this.emptyState.style.display = "none";
      this.itemsList.innerHTML = this.items.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <span class="cart-item-name">${item.dish.name}</span>
            <span class="cart-item-price">$${(item.dish.price * item.qty).toFixed(2)} ($${item.dish.price} each)</span>
          </div>
          <div class="cart-qty-controls">
            <button class="qty-btn btn-qty-minus" data-id="${item.dishId}" aria-label="Decrease quantity">−</button>
            <span style="font-size:0.85rem; font-weight:600; min-width:18px; text-align:center;">${item.qty}</span>
            <button class="qty-btn btn-qty-plus" data-id="${item.dishId}" aria-label="Increase quantity">+</button>
          </div>
        </div>
      `).join("");

      // Bind quantity events
      this.itemsList.querySelectorAll(".btn-qty-minus").forEach(btn => {
        btn.addEventListener("click", () => this.updateQty(btn.dataset.id, -1));
      });
      this.itemsList.querySelectorAll(".btn-qty-plus").forEach(btn => {
        btn.addEventListener("click", () => this.updateQty(btn.dataset.id, 1));
      });
    }
  }
}

const cart = new CartManager();

/* ==========================================================================
   3. TOAST NOTIFICATIONS & MODAL DIALOGS
   ========================================================================== */
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 240ms ease";
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function openDishModal(dishId) {
  const dish = ALL_MENU_ITEMS.find(d => d.id === dishId);
  if (!dish) return;

  const modal = document.getElementById("dish-modal");
  if (!modal) return;

  document.getElementById("modal-dish-image").src = dish.image;
  document.getElementById("modal-dish-category").textContent = dish.category;
  document.getElementById("modal-dish-title").textContent = dish.name;
  document.getElementById("modal-dish-price").textContent = `$${dish.price}`;
  document.getElementById("modal-dish-description").textContent = dish.description;
  document.getElementById("modal-dish-calories").textContent = dish.calories || "450 kcal";
  document.getElementById("modal-dish-preptime").textContent = dish.prepTime || "12 mins";

  const tagsContainer = document.getElementById("modal-dish-tags");
  const allTags = [...(dish.tags || []), ...(dish.allergens?.map(a => `Contains: ${a}`) || [])];
  tagsContainer.innerHTML = allTags.map(t => `<span class="meta-pill">${t}</span>`).join("");

  const addBtn = document.getElementById("modal-btn-add-cart");
  addBtn.textContent = `Add to Order ($${dish.price}.00)`;
  addBtn.onclick = () => {
    cart.addItem(dish.id, 1);
    modal.classList.remove("open");
  };

  modal.classList.add("open");
  sounds.playClick();
}

function initModals() {
  const dishModal = document.getElementById("dish-modal");
  document.getElementById("btn-close-dish-modal")?.addEventListener("click", () => {
    dishModal.classList.remove("open");
    sounds.playClick();
  });

  const reserveModal = document.getElementById("reservation-modal");
  document.getElementById("btn-open-reserve")?.addEventListener("click", () => {
    reserveModal.classList.add("open");
    sounds.playClick();
  });
  document.getElementById("btn-close-reservation-modal")?.addEventListener("click", () => {
    reserveModal.classList.remove("open");
    sounds.playClick();
  });

  document.getElementById("reservation-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("res-name").value;
    const date = document.getElementById("res-date").value;
    const time = document.getElementById("res-time").value;
    reserveModal.classList.remove("open");
    showToast(`Table reserved for ${name} on ${date} at ${time}. Confirmation sent!`);
    sounds.playChime();
  });

  // Design Samples Modal & Brand Switcher
  const designsModal = document.getElementById("designs-modal");
  document.getElementById("btn-design-samples")?.addEventListener("click", () => {
    designsModal.classList.add("open");
    sounds.playClick();
  });
  document.getElementById("btn-close-designs-modal")?.addEventListener("click", () => {
    designsModal.classList.remove("open");
    sounds.playClick();
  });

  const BRAND_STYLES_MAP = {
    style1: {
      crest: "⚜",
      name: "L'Atelier Gourmet",
      tagline: "FOOD & DRINK MENU · EST. 2023",
      label: "Option 1: Imperial Gold Crest"
    },
    style2: {
      crest: "👑",
      name: `L'Atelier Gourmet <span style="color:#e5b95f; font-size:0.75rem; letter-spacing:2px;">★★★</span>`,
      tagline: "● MICHELIN SELECTION · OPEN TODAY",
      label: "Option 2: Michelin 3-Star Grand Palais"
    },
    style3: {
      crest: "◆ LG ◆",
      name: "L'ATELIER GOURMET",
      tagline: "BOTANICAL LOUNGE · MCMXXIII",
      label: "Option 3: Art Deco 1920s Gatsby"
    },
    style4: {
      crest: "A / G",
      name: `L'Atelier <em style="font-family:var(--serif); font-weight:400; font-style:italic; color:#e5b95f;">Gourmet</em>`,
      tagline: "FINE DINING · TABLE SERVICE",
      label: "Option 4: Swiss Minimalist Haute Cuisine"
    },
    style5: {
      crest: "🍷",
      name: "Maison L'Atelier",
      tagline: "CUISINE SOIGNÉE · CAVE À VINS",
      label: "Option 5: Parisian Bistro Gazette"
    }
  };

  document.querySelectorAll(".sample-design-card").forEach(card => {
    card.addEventListener("click", () => {
      const styleId = card.dataset.styleId;
      const styleConfig = BRAND_STYLES_MAP[styleId];
      if (!styleConfig) return;

      document.querySelectorAll(".sample-design-card").forEach(c => {
        c.classList.remove("active");
        const btn = c.querySelector(".btn-apply-sample");
        if (btn) btn.textContent = "Select";
      });

      card.classList.add("active");
      const activeBtn = card.querySelector(".btn-apply-sample");
      if (activeBtn) activeBtn.textContent = "Active";

      const brandLink = document.getElementById("brand-link");
      const crestEl = document.getElementById("brand-crest-el");
      const nameEl = document.getElementById("brand-name-el");
      const taglineEl = document.getElementById("brand-tagline-el");

      if (brandLink) brandLink.setAttribute("data-brand-style", styleId);
      if (crestEl) crestEl.innerHTML = styleConfig.crest;
      if (nameEl) nameEl.innerHTML = styleConfig.name;
      if (taglineEl) taglineEl.innerHTML = styleConfig.tagline;

      sounds.playChime();
      showToast(`Applied ${styleConfig.label}`);
    });
  });

  // Set default reservation date to tomorrow
  const dateInput = document.getElementById("res-date");
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
  }
}

/* ==========================================================================
   4. EDITORIAL MENU BOARD CONTROLLER
   ========================================================================== */
function initMenuBoard() {
  const col1Starters = document.getElementById("col1-starters-list");
  const col1Drinks = document.getElementById("col1-drinks-grid");
  const col2Mains = document.getElementById("col2-mains-list");
  const col2Pasta = document.getElementById("col2-pasta-list");
  const col2Specials = document.getElementById("col2-specials-list");
  const col2Coffee = document.getElementById("col2-coffee-grid");
  const col3Burgers = document.getElementById("col3-burgers-list");
  const col3Desserts = document.getElementById("col3-desserts-list");

  function renderList(items, container) {
    if (!container) return;
    container.innerHTML = items.map(item => `
      <div class="menu-line-item" data-dish-id="${item.id}" role="button" tabindex="0" title="Click to view details or add to cart">
        <div class="item-main-row">
          <span class="item-name">${item.name}</span>
          <span class="item-dots"></span>
          <span class="item-price">${RESTAURANT_INFO.currency}${item.price}</span>
        </div>
        <p class="item-subtext">${item.description}</p>
      </div>
    `).join("");
  }

  function renderDrinks(items, container) {
    if (!container) return;
    container.innerHTML = items.map(item => `
      <div class="drink-line" data-dish-id="${item.id}" role="button" tabindex="0" title="Click to view details">
        <span>${item.name}</span>
        <span>${RESTAURANT_INFO.currency}${item.price}</span>
      </div>
    `).join("");
  }

  // Populate sections with authentic items matching reference image
  const starters = MENU_VOLUMES.find(v => v.id === "starters")?.items || [];
  const mains = MENU_VOLUMES.find(v => v.id === "main-course")?.items || [];
  const pasta = MENU_VOLUMES.find(v => v.id === "pasta")?.items || [];
  const specials = (MENU_VOLUMES.find(v => v.id === "specials-breakfast")?.items || []).filter(i => i.id !== "all-day-breakfast");
  const burgers = MENU_VOLUMES.find(v => v.id === "burger")?.items || [];
  const drinks = MENU_VOLUMES.find(v => v.id === "fresh-drinks")?.items || [];
  const coffeeAndDessert = MENU_VOLUMES.find(v => v.id === "coffee-dessert")?.items || [];
  const coffee = coffeeAndDessert.filter(i => i.category === "House Coffee");
  const desserts = coffeeAndDessert.filter(i => i.category === "Dessert Menu");

  renderList(starters, col1Starters);
  renderDrinks(drinks, col1Drinks);
  renderList(mains, col2Mains);
  renderList(pasta, col2Pasta);
  renderList(specials, col2Specials);
  renderDrinks(coffee, col2Coffee);
  renderList(burgers, col3Burgers);
  renderList(desserts, col3Desserts);

  // Global click delegate for dish rows & photo items
  document.getElementById("menu-board-canvas")?.addEventListener("click", (e) => {
    const clickable = e.target.closest("[data-dish-id]");
    if (clickable && clickable.dataset.dishId) {
      openDishModal(clickable.dataset.dishId);
    }
  });





  // Middle Search Filter Handler
  const middleSearch = document.getElementById("middle-menu-search");
  const clearBtn = document.getElementById("btn-clear-search");

  function filterMenu(query) {
    const q = query.toLowerCase().trim();
    if (clearBtn) clearBtn.style.display = q.length > 0 ? "block" : "none";

    document.querySelectorAll(".menu-line-item, .drink-line, .photo-item").forEach(el => {
      const dishId = el.dataset.dishId;
      const dish = ALL_MENU_ITEMS.find(d => d.id === dishId);
      if (!dish) return;
      const matches = dish.name.toLowerCase().includes(q) ||
                      dish.description.toLowerCase().includes(q) ||
                      dish.category.toLowerCase().includes(q) ||
                      (dish.tags && dish.tags.some(t => t.toLowerCase().includes(q)));
      el.style.display = matches ? "" : "none";
    });
  }

  middleSearch?.addEventListener("input", (e) => {
    filterMenu(e.target.value);
  });

  clearBtn?.addEventListener("click", () => {
    if (middleSearch) {
      middleSearch.value = "";
      filterMenu("");
      middleSearch.focus();
    }
    sounds.playClick();
  });
  document.getElementById("btn-print-menu")?.addEventListener("click", () => {
    window.print();
  });
}

/* ==========================================================================
   5. APP INITIALIZATION
   ========================================================================== */
window.addEventListener("DOMContentLoaded", () => {
  initMenuBoard();
  initModals();

  // Audio Toggle
  const btnAudio = document.getElementById("btn-audio-toggle");
  const iconSoundOn = document.getElementById("icon-sound-on");
  const iconSoundOff = document.getElementById("icon-sound-off");

  btnAudio?.addEventListener("click", () => {
    const isEnabled = sounds.toggle();
    if (iconSoundOn && iconSoundOff) {
      iconSoundOn.style.display = isEnabled ? "block" : "none";
      iconSoundOff.style.display = isEnabled ? "none" : "block";
    }
    showToast(isEnabled ? "Sound Effects Enabled" : "Sound Effects Muted");
  });

  // Theme Toggle
  const btnTheme = document.getElementById("btn-theme-toggle");
  const iconMoon = document.getElementById("icon-theme-moon");
  const iconSun = document.getElementById("icon-theme-sun");

  btnTheme?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);

    if (iconMoon && iconSun) {
      iconMoon.style.display = newTheme === "dark" ? "block" : "none";
      iconSun.style.display = newTheme === "dark" ? "none" : "block";
    }
    sounds.playClick();
  });
});
