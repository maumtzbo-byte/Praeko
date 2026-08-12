// AUREN — shared front-end behaviour (no build step, vanilla JS)
(function () {
  "use strict";

  const CART_KEY = "auren_cart_count";

  /* ---------- cart badge (persisted via localStorage) ---------- */

  function getCartCount() {
    return parseInt(localStorage.getItem(CART_KEY) || "0", 10);
  }

  function setCartCount(n) {
    localStorage.setItem(CART_KEY, String(n));
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(n);
      el.style.display = n > 0 ? "flex" : "none";
    });
  }

  function addToCart(n = 1) {
    setCartCount(getCartCount() + n);
  }

  /* ---------- toast ---------- */

  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  /* ---------- mobile nav ---------- */

  function initMobileNav() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      toggle.classList.toggle("is-open");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  /* ---------- quick add / add to cart buttons ---------- */

  function initAddToCartButtons() {
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        addToCart(1);
        showToast("Añadido a la bolsa");
      });
    });
  }

  /* ---------- newsletter form (static demo) ---------- */

  function initNewsletterForm() {
    document.querySelectorAll(".newsletter-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Gracias por suscribirte");
        form.reset();
      });
    });
  }

  /* ---------- shop page: filter tabs ---------- */

  function initFilterTabs() {
    const tabWrap = document.querySelector(".filter-tabs");
    const grid = document.querySelector("[data-product-grid]");
    if (!tabWrap || !grid) return;
    const cards = grid.querySelectorAll(".product-card");
    const countEl = document.querySelector("[data-result-count]");

    function applyFilter(category) {
      let visible = 0;
      cards.forEach((card) => {
        const match = category === "all" || card.dataset.category === category;
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (countEl) countEl.textContent = visible;
    }

    tabWrap.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        tabWrap.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilter(btn.dataset.filter);
      });
    });

    applyFilter("all");
  }

  /* ---------- shop page: sort ---------- */

  function initSort() {
    const select = document.querySelector(".sort-select");
    const grid = document.querySelector("[data-product-grid]");
    if (!select || !grid) return;

    select.addEventListener("change", () => {
      const cards = Array.from(grid.querySelectorAll(".product-card"));
      const dir = select.value;
      cards.sort((a, b) => {
        const pa = parseFloat(a.dataset.price);
        const pb = parseFloat(b.dataset.price);
        if (dir === "price-asc") return pa - pb;
        if (dir === "price-desc") return pb - pa;
        return 0;
      });
      cards.forEach((card) => grid.appendChild(card));
    });
  }

  /* ---------- product detail: gallery ---------- */

  function initGallery() {
    const thumbs = document.querySelectorAll(".pdp-thumbs .art");
    const main = document.querySelector(".pdp-main .art");
    if (!thumbs.length || !main) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        thumbs.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
        main.className = "art " + thumb.dataset.tone;
        main.setAttribute("data-tag", thumb.getAttribute("data-tag"));
      });
    });
  }

  /* ---------- product detail: size / color selection ---------- */

  function initOptionPickers() {
    document.querySelectorAll(".size-options, .color-options").forEach((group) => {
      group.querySelectorAll("button, .color-swatch").forEach((opt) => {
        opt.addEventListener("click", () => {
          if (opt.hasAttribute("disabled")) return;
          group.querySelectorAll(".active").forEach((el) => el.classList.remove("active"));
          opt.classList.add("active");
          const label = group.parentElement.querySelector("[data-selected-value]");
          if (label) label.textContent = opt.dataset.value || opt.textContent.trim();
        });
      });
    });
  }

  /* ---------- product detail: accordion ---------- */

  function initAccordion() {
    document.querySelectorAll(".accordion-item").forEach((item) => {
      const trigger = item.querySelector(".accordion-trigger");
      const panel = item.querySelector(".accordion-panel");
      if (!trigger || !panel) return;
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".accordion-item").forEach((other) => {
          other.classList.remove("open");
          other.querySelector(".accordion-panel").style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add("open");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- cart page: quantity steppers + line removal ---------- */

  function formatPrice(n) {
    return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  function recalcCartTotals() {
    const lines = document.querySelectorAll(".cart-line");
    let subtotal = 0;
    let itemCount = 0;
    lines.forEach((line) => {
      const price = parseFloat(line.dataset.price);
      const qty = parseInt(line.querySelector("[data-qty]").textContent, 10);
      const lineTotal = price * qty;
      subtotal += lineTotal;
      itemCount += qty;
      const lineEl = line.querySelector(".cart-line-price");
      if (lineEl) lineEl.textContent = formatPrice(lineTotal);
    });

    const subtotalEl = document.querySelector("[data-cart-subtotal]");
    const totalEl = document.querySelector("[data-cart-total]");
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(subtotal);
    setCartCount(itemCount);

    const emptyState = document.querySelector("[data-cart-empty]");
    const filledState = document.querySelector("[data-cart-filled]");
    if (emptyState && filledState) {
      const hasLines = lines.length > 0;
      emptyState.hidden = hasLines;
      filledState.hidden = !hasLines;
    }
  }

  function initCartPage() {
    const lines = document.querySelectorAll(".cart-line");
    if (!lines.length) return;

    lines.forEach((line) => {
      const qtyEl = line.querySelector("[data-qty]");
      line.querySelectorAll("[data-qty-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          let qty = parseInt(qtyEl.textContent, 10);
          qty = btn.dataset.qtyAction === "inc" ? qty + 1 : Math.max(1, qty - 1);
          qtyEl.textContent = String(qty);
          recalcCartTotals();
        });
      });
      const removeBtn = line.querySelector(".remove-line");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          line.remove();
          recalcCartTotals();
        });
      }
    });

    recalcCartTotals();
  }

  /* ---------- init ---------- */

  document.addEventListener("DOMContentLoaded", () => {
    setCartCount(getCartCount());
    initMobileNav();
    initAddToCartButtons();
    initNewsletterForm();
    initFilterTabs();
    initSort();
    initGallery();
    initOptionPickers();
    initAccordion();
    initCartPage();
  });
})();
