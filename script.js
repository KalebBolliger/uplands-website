document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", async () => {
    const link = button.dataset.copyLink;
    const status = button.closest("section")?.querySelector("[data-copy-status]");
    try {
      await navigator.clipboard.writeText(link);
      if (status) status.textContent = "Page link copied.";
      button.textContent = "Copied!";
      window.setTimeout(() => {
        button.textContent = "Copy page link";
        if (status) status.textContent = "";
      }, 2400);
    } catch {
      if (status) status.textContent = `Copy this link: ${link}`;
    }
  });
});

document.querySelectorAll("nav").forEach((nav) => {
  const links = nav.querySelector(".nav-links");
  if (!links) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const activeGroups = {
    "about.html": ["about.html", "history.html", "association-overview.html"],
    "news-information.html": ["news-information.html", "neighbor-update.html", "garage-sale.html", "new-neighbor.html", "local-resources.html"],
    "calendar.html": ["calendar.html"],
    "community.html": [
      "community.html",
      "block-parties.html",
      "services.html",
      "garage-sale.html",
      "garden.html",
      "halloween.html",
      "picnic.html",
      "snow-removal-fund.html",
    ],
    "documents.html": ["documents.html"],
    "gallery.html": ["gallery.html", "a-view-from-the-uplands.html", "picture-of-the-month.html"],
    "support.html": ["support.html"],
  };
  const primaryLinks = [
    ["about.html", "About"],
    ["news-information.html", "News & Information"],
    ["calendar.html", "Calendar"],
    ["community.html", "Community"],
    ["documents.html", "Documents"],
    ["gallery.html", "Gallery"],
    ["support.html", "Support"],
  ];
  links.replaceChildren(...primaryLinks.map(([href, label]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (activeGroups[href].includes(currentPage)) link.classList.add("active");
    return link;
  }));

  const button = document.createElement("button");
  button.className = "nav-toggle";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open navigation");
  button.innerHTML = "<span></span><span></span><span></span>";
  nav.insertBefore(button, links);

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });

  links.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    nav.classList.remove("nav-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation");
  });
});

// Paste the public Google Calendar ID between the quotation marks.
// Find it in Google Calendar: Settings > Integrate calendar > Calendar ID.
const publicCalendarId = "admin@theuplandspeoria.org";

document.querySelectorAll("[data-calendar-shell]").forEach((shell) => {
  if (!publicCalendarId) return;

  const calendarUrl = new URL("https://calendar.google.com/calendar/embed");
  calendarUrl.searchParams.set("src", publicCalendarId);
  calendarUrl.searchParams.set("ctz", "America/Chicago");
  calendarUrl.searchParams.set("mode", "MONTH");
  calendarUrl.searchParams.set("showTitle", "0");
  calendarUrl.searchParams.set("showPrint", "0");
  calendarUrl.searchParams.set("showCalendars", "0");

  const frame = document.createElement("iframe");
  frame.className = "calendar-frame";
  frame.src = calendarUrl.toString();
  frame.title = "Uplands neighborhood events calendar";
  frame.loading = "lazy";
  frame.setAttribute("frameborder", "0");
  frame.setAttribute("scrolling", "no");

  shell.replaceChildren(frame);
});

// Gallery image lightbox with scroll/pinch zoom
(() => {
  const links = document.querySelectorAll("a.gallery-item");
  if (!links.length) return;

  const minScale = 1;
  const maxScale = 4;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-content" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button type="button" class="lightbox-close" aria-label="Close photo viewer">&times;</button>
      <div class="lightbox-image-wrap">
        <img class="lightbox-image" alt="" draggable="false">
      </div>
      <div class="lightbox-panel">
        <p class="lightbox-caption"></p>
        <a class="button button--dark lightbox-fullsize" target="_blank" rel="noopener">View full size</a>
      </div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const backdrop = lightbox.querySelector(".lightbox-backdrop");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const imageWrap = lightbox.querySelector(".lightbox-image-wrap");
  const image = lightbox.querySelector(".lightbox-image");
  const caption = lightbox.querySelector(".lightbox-caption");
  const fullsizeLink = lightbox.querySelector(".lightbox-fullsize");

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let lastFocused = null;

  const clampScale = (value) => Math.min(maxScale, Math.max(minScale, value));

  const applyTransform = () => {
    image.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    imageWrap.classList.toggle("zoomed", scale > minScale);
  };

  const setScale = (nextScale) => {
    scale = clampScale(nextScale);
    if (scale === minScale) {
      originX = 0;
      originY = 0;
    }
    applyTransform();
  };

  const resetZoom = () => {
    scale = 1;
    originX = 0;
    originY = 0;
    applyTransform();
  };

  const openLightbox = (link) => {
    const img = link.querySelector("img");
    if (!img) return;
    lastFocused = document.activeElement;
    image.src = link.href;
    image.alt = img.alt || "";
    caption.textContent = img.alt || "";
    fullsizeLink.href = link.href;
    resetZoom();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    requestAnimationFrame(() => lightbox.classList.add("open"));
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.classList.remove("lightbox-open");
    window.setTimeout(() => {
      lightbox.hidden = true;
      image.src = "";
    }, 200);
    if (lastFocused) lastFocused.focus();
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(link);
    });
  });

  backdrop.addEventListener("click", closeLightbox);
  closeButton.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden || event.key !== "Escape") return;
    closeLightbox();
  });

  // Desktop: scroll/wheel to zoom
  imageWrap.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setScale(scale * zoomFactor);
  }, { passive: false });

  // Desktop: drag to pan once zoomed in
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;

  imageWrap.addEventListener("mousedown", (event) => {
    if (scale <= minScale) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = originX;
    dragOriginY = originY;
    imageWrap.classList.add("dragging");
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    originX = dragOriginX + (event.clientX - dragStartX);
    originY = dragOriginY + (event.clientY - dragStartY);
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    imageWrap.classList.remove("dragging");
  });

  // Mobile: pinch to zoom, single-finger drag to pan once zoomed in
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchOriginX = 0;
  let touchOriginY = 0;

  const touchDistance = (touches) => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

  imageWrap.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      pinchStartDistance = touchDistance(event.touches);
      pinchStartScale = scale;
    } else if (event.touches.length === 1 && scale > minScale) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchOriginX = originX;
      touchOriginY = originY;
    }
  }, { passive: true });

  imageWrap.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      setScale(pinchStartScale * (distance / pinchStartDistance));
    } else if (event.touches.length === 1 && scale > minScale) {
      event.preventDefault();
      originX = touchOriginX + (event.touches[0].clientX - touchStartX);
      originY = touchOriginY + (event.touches[0].clientY - touchStartY);
      applyTransform();
    }
  }, { passive: false });

  image.addEventListener("dblclick", () => {
    setScale(scale > minScale ? 1 : 2);
  });
})();
