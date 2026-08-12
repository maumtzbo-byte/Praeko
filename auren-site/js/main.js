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

  /* ---------- locale toggle ---------- */

  function initLocaleToggle() {
    const actions = document.querySelector(".header-actions");
    if (!actions || actions.querySelector(".locale-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "locale-toggle";
    btn.textContent = localStorage.getItem("auren_locale") || "ES · EUR";
    btn.addEventListener("click", () => {
      const next = btn.textContent === "ES · EUR" ? "EN · USD" : "ES · EUR";
      btn.textContent = next;
      localStorage.setItem("auren_locale", next);
      showToast(next === "EN · USD" ? "Currency switched to USD" : "Moneda cambiada a EUR");
    });
    actions.insertBefore(btn, actions.firstChild);
  }

  /* ---------- footer payment badges ---------- */

  function initPaymentBadges() {
    const brand = document.querySelector(".footer-brand");
    if (!brand || brand.querySelector(".payment-badges")) return;
    const row = document.createElement("div");
    row.className = "payment-badges";
    ["Visa", "Mastercard", "PayPal", "Bizum", "Apple Pay"].forEach((label) => {
      const span = document.createElement("span");
      span.className = "payment-badge";
      span.textContent = label;
      row.appendChild(span);
    });
    brand.appendChild(row);
  }

  /* ---------- cookie consent banner ---------- */

  function initCookieBanner() {
    if (localStorage.getItem("auren_cookie_consent")) return;
    const bar = document.createElement("div");
    bar.className = "cookie-banner";
    bar.innerHTML =
      '<p>Usamos cookies propias y de terceros para mejorar tu experiencia de compra y analizar la navegación. <a href="privacidad.html">Más información</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-outline" data-cookie="reject">Rechazar</button>' +
      '<button type="button" class="btn" data-cookie="accept">Aceptar</button>' +
      "</div>";
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add("show"));
    bar.querySelectorAll("[data-cookie]").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("auren_cookie_consent", btn.dataset.cookie);
        bar.classList.remove("show");
        setTimeout(() => bar.remove(), 350);
      });
    });
  }

  /* ---------- newsletter entry popup ---------- */

  function initNewsletterPopup() {
    if (sessionStorage.getItem("auren_popup_seen")) return;
    setTimeout(() => {
      if (sessionStorage.getItem("auren_popup_seen")) return;
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";
      overlay.innerHTML =
        '<div class="popup-card">' +
        '<button type="button" class="popup-close" aria-label="Cerrar">×</button>' +
        '<span class="eyebrow">AUREN Members</span>' +
        "<h3>Un 10% en tu primer pedido</h3>" +
        "<p>Suscríbete y sé el primero en conocer las novedades de cada temporada.</p>" +
        '<form class="popup-form newsletter-form">' +
        '<input type="email" placeholder="Tu correo electrónico" required />' +
        '<button type="submit">Unirme →</button>' +
        "</form>" +
        '<button type="button" class="popup-dismiss">No, gracias</button>' +
        "</div>";
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("show"));

      function close() {
        sessionStorage.setItem("auren_popup_seen", "1");
        overlay.classList.remove("show");
        setTimeout(() => overlay.remove(), 300);
      }

      overlay.querySelector(".popup-close").addEventListener("click", close);
      overlay.querySelector(".popup-dismiss").addEventListener("click", close);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });
      overlay.querySelector(".popup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Gracias por suscribirte");
        close();
      });
    }, 4000);
  }

  /* ---------- floating chat button + back to top ---------- */

  function initChatButton() {
    if (document.querySelector(".chat-fab")) return;
    const btn = document.createElement("a");
    btn.className = "chat-fab";
    btn.href = "mailto:hola@auren-store.com";
    btn.setAttribute("aria-label", "Escríbenos");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>' +
      "</svg>";
    document.body.appendChild(btn);
  }

  function initBackToTop() {
    if (document.querySelector(".back-to-top")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Volver arriba");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener(
      "scroll",
      () => btn.classList.toggle("show", window.scrollY > 600),
      { passive: true }
    );
  }

  /* ---------- deterministic star ratings (no backend, just UI polish) ---------- */

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function ratingFor(name) {
    const hash = hashString(name);
    const rating = (4 + (hash % 10) / 10).toFixed(1);
    const count = 12 + (hash % 140);
    return { rating, count };
  }

  function starsMarkup(rating) {
    const pct = Math.round((rating / 5) * 100);
    return (
      '<span class="stars" aria-label="' + rating + ' de 5 estrellas">' +
      '<span class="stars-bg">★★★★★</span>' +
      '<span class="stars-fg" style="width:' + pct + '%">★★★★★</span>' +
      "</span>"
    );
  }

  function initCardRatings() {
    document.querySelectorAll(".product-card").forEach((card) => {
      if (card.querySelector(".rating-row")) return;
      const nameEl = card.querySelector("h3");
      const catBlock = card.querySelector(".product-info > div");
      if (!nameEl || !catBlock) return;
      const { rating, count } = ratingFor(nameEl.textContent.trim());
      const row = document.createElement("div");
      row.className = "rating-row";
      row.innerHTML = starsMarkup(rating) + '<span class="rating-count">(' + count + ")</span>";
      catBlock.appendChild(row);
    });
  }

  function initPdpRating() {
    const h1 = document.querySelector(".pdp-info h1");
    if (!h1 || document.querySelector(".rating-row-pdp")) return;
    const { rating, count } = ratingFor(h1.textContent.trim());
    const row = document.createElement("div");
    row.className = "rating-row rating-row-pdp";
    row.innerHTML = starsMarkup(rating) + '<span class="rating-count">' + rating + " · " + count + " reseñas</span>";
    h1.insertAdjacentElement("afterend", row);
  }

  /* ---------- product detail: low stock note ---------- */

  function initStockNote() {
    const actions = document.querySelector(".pdp-actions");
    const h1 = document.querySelector(".pdp-info h1");
    if (!actions || !h1 || document.querySelector(".stock-note")) return;
    const hash = hashString(h1.textContent.trim());
    const stock = 2 + (hash % 6);
    const note = document.createElement("p");
    note.className = "stock-note";
    note.textContent =
      stock <= 4 ? "Quedan solo " + stock + " unidades en esta talla" : "Disponible — envío en 24/48h";
    actions.insertAdjacentElement("afterend", note);
  }

  /* ---------- product detail: sticky mobile add-to-cart ---------- */

  function initStickyAddToCart() {
    const original = document.querySelector(".pdp-actions [data-add-to-cart]");
    const priceEl = document.querySelector(".pdp-price");
    if (!original || !priceEl || document.querySelector(".sticky-add-bar")) return;

    const bar = document.createElement("div");
    bar.className = "sticky-add-bar";
    bar.innerHTML =
      '<span class="sticky-add-price">' + priceEl.textContent.trim() + "</span>" +
      '<button type="button" class="btn" data-add-to-cart>Añadir a la bolsa</button>';
    document.body.appendChild(bar);

    bar.querySelector("[data-add-to-cart]").addEventListener("click", (e) => {
      e.preventDefault();
      addToCart(1);
      showToast("Añadido a la bolsa");
    });

    if ("IntersectionObserver" in window) {
      const footer = document.querySelector(".site-footer");
      let ctaVisible = true;
      let footerVisible = false;

      function refresh() {
        bar.classList.toggle("show", !ctaVisible && !footerVisible);
      }

      const ctaObserver = new IntersectionObserver(
        ([entry]) => {
          ctaVisible = entry.isIntersecting;
          refresh();
        },
        { threshold: 0 }
      );
      ctaObserver.observe(original);

      if (footer) {
        const footerObserver = new IntersectionObserver(
          ([entry]) => {
            footerVisible = entry.isIntersecting;
            refresh();
          },
          { threshold: 0 }
        );
        footerObserver.observe(footer);
      }
    }
  }

  /* ---------- recently viewed products ---------- */

  const RECENT_KEY = "auren_recent_products";

  function renderRecentlyViewed() {
    const mount = document.querySelector("[data-recently-viewed]");
    if (!mount) return;
    const h1 = document.querySelector(".pdp-info h1");
    const currentName = h1 ? h1.textContent.trim() : null;
    let list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    if (currentName) list = list.filter((p) => p.name !== currentName);
    if (!list.length) {
      mount.hidden = true;
      return;
    }
    mount.hidden = false;
    mount.innerHTML =
      '<div class="section-head related-heading">' +
      '<div><span class="eyebrow">Tu historial</span><h2 class="h-display">Vistos recientemente</h2></div>' +
      "</div>" +
      '<div class="product-grid">' +
      list
        .map(
          (p) =>
            '<a class="product-card" href="product.html">' +
            '<div class="art ' + p.artClass + '" data-tag="' + p.tag + '"></div>' +
            '<div class="product-info">' +
            "<div><h3>" + p.name + "</h3><span class=\"cat\">" + p.cat + "</span></div>" +
            '<span class="product-price">' + p.price + "</span>" +
            "</div></a>"
        )
        .join("") +
      "</div>";
  }

  function trackRecentProduct() {
    const h1 = document.querySelector(".pdp-info h1");
    const priceEl = document.querySelector(".pdp-price");
    const art = document.querySelector(".pdp-main .art");
    const eyebrow = document.querySelector(".pdp-info .eyebrow");
    if (!h1 || !priceEl || !art) return;

    const entry = {
      name: h1.textContent.trim(),
      price: priceEl.textContent.trim(),
      artClass: art.className.replace("art", "").trim(),
      tag: art.getAttribute("data-tag") || "AUREN",
      cat: eyebrow ? eyebrow.textContent.split("·")[0].trim() : "AUREN",
    };

    let list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    list = list.filter((p) => p.name !== entry.name);
    list.unshift(entry);
    list = list.slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
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

    initLocaleToggle();
    initPaymentBadges();
    initCookieBanner();
    initNewsletterPopup();
    initChatButton();
    initBackToTop();

    initPdpRating();
    initStockNote();
    initStickyAddToCart();
    renderRecentlyViewed();
    initCardRatings();
    trackRecentProduct();
  });
})();
