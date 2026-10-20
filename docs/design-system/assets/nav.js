/* ==========================================================================
   Navegación de la documentación del design system.

   Única fuente de la lista de páginas: para sumar una, agregala en PAGES.
   Arma el menú lateral, las secciones de la página actual (desde sus
   <h2 id>), la barra con botón "Menú" en pantallas chicas y los links de
   anterior/siguiente al pie. Cada página solo necesita:

     <div class="docs">
       <nav class="docs-nav" id="docs-nav" aria-label="Design system"></nav>
       <main class="docs-main"> … </main>
     </div>
     <script src="assets/nav.js"></script>
   ========================================================================== */

(function () {
  var PAGES = [
    { group: null, items: [
      { href: "index.html", label: "Inicio" },
    ] },
    { group: "Sistema", items: [
      { href: "02-fundamentos.html", label: "Fundamentos", tag: "Validar" },
      { href: "03-componentes.html", label: "Componentes", tag: "Validar" },
      { href: "05-ilustraciones-e-imagenes.html", label: "Ilustraciones e imágenes", tag: "Validar" },
    ] },
    { group: "Recursos", items: [
      { href: "galeria.html", label: "Galería de assets" },
    ] },
    { group: "Proceso", items: [
      { href: "01-diagnostico.html", label: "Diagnóstico", tag: "Hecho" },
      { href: "04-validacion.html", label: "Validación e implementación", tag: "Validar" },
      { href: "06-migracion.html", label: "Migración", tag: "2 de 5" },
    ] },
  ];

  var BRAND = "Rituales";
  var SUBTITLE = "Design system · v1 propuesta";

  var nav = document.getElementById("docs-nav");
  if (!nav) return;

  var current = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  var flat = [];
  PAGES.forEach(function (g) { g.items.forEach(function (i) { flat.push(i); }); });
  var currentPage = flat.filter(function (i) { return i.href === current; })[0];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  // Secciones de la página actual, desde sus <h2 id>.
  var headings = Array.prototype.slice.call(document.querySelectorAll(".docs-main h2[id]"));
  var sectionLinks = [];

  function sectionsList() {
    if (!headings.length) return null;
    return el("ul", { class: "docs-nav-sections" }, headings.map(function (h) {
      var a = el("a", { href: "#" + h.id, text: h.textContent.replace(/\s+/g, " ").trim() });
      sectionLinks.push({ link: a, heading: h });
      return el("li", {}, [a]);
    }));
  }

  // Menú lateral
  nav.textContent = "";
  nav.appendChild(el("a", { class: "docs-nav-brand", href: "index.html" }, [
    el("b", { text: BRAND }), el("span", { text: SUBTITLE }),
  ]));
  PAGES.forEach(function (group) {
    var list = el("ul", {}, group.items.map(function (item) {
      var isCurrent = item.href === current;
      var link = el("a", { class: "docs-nav-link", href: item.href }, [
        el("span", { text: item.label }),
        item.tag ? el("span", { class: "docs-nav-tag", text: item.tag }) : null,
      ]);
      if (isCurrent) link.setAttribute("aria-current", "page");
      return el("li", {}, [link, isCurrent ? sectionsList() : null]);
    }));
    nav.appendChild(el("div", { class: "docs-nav-group" }, [
      group.group ? el("p", { text: group.group }) : null, list,
    ]));
  });

  // Barra superior con botón "Menú" (se ve solo en pantallas chicas)
  var toggle = el("button", { type: "button", "aria-expanded": "false", "aria-controls": "docs-nav" }, [
    el("span", { "aria-hidden": "true", text: "☰" }), el("span", { text: "Menú" }),
  ]);
  var topbar = el("header", { class: "docs-topbar" }, [
    el("a", { href: "index.html" }, [
      el("b", { text: BRAND }),
      el("span", { text: currentPage ? currentPage.label : SUBTITLE }),
    ]),
    toggle,
  ]);
  var layout = nav.closest(".docs") || nav.parentNode;
  layout.parentNode.insertBefore(topbar, layout);

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.lastChild.textContent = open ? "Cerrar" : "Menú";
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });

  // Sección activa mientras se lee: la última cuyo título ya pasó el primer
  // tercio de la pantalla.
  if (sectionLinks.length) {
    var ticking = false;
    var updateActive = function () {
      ticking = false;
      var active = sectionLinks[0];
      for (var i = 0; i < sectionLinks.length; i++) {
        if (sectionLinks[i].heading.getBoundingClientRect().top < window.innerHeight * 0.35) active = sectionLinks[i];
      }
      sectionLinks.forEach(function (s) {
        var on = s === active;
        s.link.classList.toggle("is-active", on);
        if (on) s.link.setAttribute("aria-current", "true"); else s.link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateActive); }
    }, { passive: true });
    updateActive();
  }

  // Anterior / siguiente según el orden del menú
  var index = flat.indexOf(currentPage);
  var content = document.querySelector(".docs-content") || document.querySelector(".docs-main main") || document.querySelector(".docs-main");
  if (index >= 0 && content && !document.body.hasAttribute("data-no-pager")) {
    var prev = flat[index - 1];
    var next = flat[index + 1];
    var pager = el("nav", { class: "docs-pager", "aria-label": "Anterior y siguiente" }, [
      prev ? el("a", { href: prev.href }, [el("small", { text: "Anterior" }), el("span", { text: prev.label })]) : null,
      next ? el("a", { href: next.href, class: "is-next" }, [el("small", { text: "Siguiente" }), el("span", { text: next.label })]) : null,
    ]);
    content.appendChild(pager);
  }
})();
