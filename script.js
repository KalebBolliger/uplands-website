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
    "gallery.html": ["gallery.html", "a-view-from-the-uplands.html"],
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

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.gallery-item");
    if (!link) return;
    event.preventDefault();
    openLightbox(link);
  });

  backdrop.addEventListener("click", closeLightbox);
  closeButton.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden || event.key !== "Escape") return;
    event.stopImmediatePropagation();
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

// Monthly highlights: year-by-year strip (placeholder data until real winners are chosen)
(() => {
  const strip = document.querySelector("[data-month-strip]");
  const yearLabel = document.querySelector("[data-month-year-label]");
  const prevYearLabel = document.querySelector("[data-month-year-prev-label]");
  const nextYearLabel = document.querySelector("[data-month-year-next-label]");
  const prevButton = document.querySelector("[data-month-year-prev]");
  const nextButton = document.querySelector("[data-month-year-next]");
  const feature = document.querySelector("[data-month-feature]");
  const featureLink = document.querySelector("[data-month-feature-link]");
  const featureImg = document.querySelector("[data-month-feature-img]");
  const featureCaption = document.querySelector("[data-month-feature-caption]");
  if (!strip || !yearLabel || !prevYearLabel || !nextYearLabel || !prevButton || !nextButton) return;

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const START_YEAR = 2021;

  const now = new Date();
  const CURRENT_YEAR = now.getFullYear();
  const CURRENT_MONTH = now.getMonth();

  const PLACEHOLDER_IMAGES = [
    "assets/images/gallery/370200587_870606807759681_210162988387038657_n.jpg",
    "assets/images/gallery/370284342_3724934461074046_4475135608361034929_n.jpg",
    "assets/images/gallery/370288914_343897248176822_4017444663952019519_n.jpg",
    "assets/images/gallery/387524236_654603430138371_8893289489707215956_n.jpg",
    "assets/images/gallery/393069102_852196503037291_2594759480600169748_n.jpg",
    "assets/images/gallery/393239159_832398685026651_940337507189797651_n.jpg",
    "assets/images/gallery/393239160_1048998059878200_1765748896183752875_n.jpg",
    "assets/images/gallery/393317372_156920570831181_316524598836203724_n.jpg",
    "assets/images/gallery/393441815_1036597244320316_8906372888410770643_n.jpg",
    "assets/images/gallery/393441822_1001897891131364_6273993662342847778_n.jpg",
    "assets/images/gallery/393462541_1014906179809474_5199457459963997106_n.jpg",
    "assets/images/gallery/IMG_0650.JPG.jpeg",
    "assets/images/gallery/IMG_1450.jpeg",
    "assets/images/gallery/IMG_1564_VSCO.JPG.jpeg",
    "assets/images/gallery/IMG_2232.jpeg",
    "assets/images/gallery/IMG_6191.jpeg",
    "assets/images/gallery/IMG_6194.jpeg",
    "assets/images/gallery/IMG_6196.jpeg",
    "assets/images/gallery/IMG_6401.JPG.jpeg",
    "assets/images/gallery/IMG_6482_VSCO.JPG.jpeg",
    "assets/images/gallery/IMG_8886.jpeg",
    "assets/images/gallery/blue-door.jpg",
    "assets/images/gallery/flower-pinwheel.jpg",
    "assets/images/gallery/hero-fall-frame-houses.jpg",
    "assets/images/gallery/plant-drop-house.jpg",
    "assets/images/gallery/porch-light.jpg",
    "assets/images/gallery/sunset-fence.jpg",
    "assets/images/gallery/sunset-lamp.jpg",
    "assets/images/gallery/sunset-stop-sign.jpg",
    "assets/images/gallery/sunset-waves.jpg",
  ];

  const currentMonthLabel = document.querySelector("[data-current-month]");
  if (currentMonthLabel) currentMonthLabel.textContent = MONTHS[CURRENT_MONTH];

  const imageFor = (year, monthIndex) => {
    const seed = (year - START_YEAR) * MONTHS.length + monthIndex;
    return PLACEHOLDER_IMAGES[seed % PLACEHOLDER_IMAGES.length];
  };

  // Whether a month actually has a chosen highlight yet. Past years are fully
  // decided; the current year is only decided through *last* month, since the
  // current month's photo may not be picked yet. Written as a per-month check
  // (not a contiguous count) so gaps — including "nothing chosen this month" —
  // render correctly instead of assuming every month up to some cutoff exists.
  const hasHighlight = (year, monthIndex) => {
    if (year < START_YEAR || year > CURRENT_YEAR) return false;
    if (year < CURRENT_YEAR) return true;
    return monthIndex < CURRENT_MONTH;
  };

  const findLatestHighlight = () => {
    for (let year = CURRENT_YEAR; year >= START_YEAR; year--) {
      for (let monthIndex = MONTHS.length - 1; monthIndex >= 0; monthIndex--) {
        if (hasHighlight(year, monthIndex)) return { year, monthIndex };
      }
    }
    return null;
  };

  if (feature && featureLink && featureImg && featureCaption) {
    const latest = findLatestHighlight();
    if (latest) {
      const src = imageFor(latest.year, latest.monthIndex);
      const label = `${MONTHS[latest.monthIndex]} ${latest.year}`;
      featureLink.href = src;
      featureLink.setAttribute("aria-label", `Open the ${label} highlight at full size`);
      featureImg.src = src;
      featureImg.alt = `${label} monthly highlight (placeholder)`;
      featureCaption.textContent = label;
      feature.hidden = false;
    }
  }

  let selectedYear = CURRENT_YEAR;

  const render = () => {
    yearLabel.textContent = selectedYear;
    prevYearLabel.textContent = selectedYear > START_YEAR ? selectedYear - 1 : "";
    nextYearLabel.textContent = selectedYear < CURRENT_YEAR ? selectedYear + 1 : "";
    prevButton.disabled = selectedYear <= START_YEAR;
    nextButton.disabled = selectedYear >= CURRENT_YEAR;

    const decidedMonths = MONTHS
      .map((month, monthIndex) => ({ month, monthIndex }))
      .filter(({ monthIndex }) => hasHighlight(selectedYear, monthIndex));

    strip.replaceChildren(...decidedMonths.map(({ month, monthIndex }) => {
      const link = document.createElement("a");
      link.className = "gallery-item month-tile";
      link.href = imageFor(selectedYear, monthIndex);
      link.innerHTML = `
        <span class="month-tile-thumb"><img src="${link.href}" alt="${month} ${selectedYear} monthly highlight (placeholder)"></span>
        <span class="month-tile-label">${MONTHS_SHORT[monthIndex]}</span>
      `;
      return link;
    }));
  };

  prevButton.addEventListener("click", () => {
    if (selectedYear <= START_YEAR) return;
    selectedYear -= 1;
    render();
  });

  nextButton.addEventListener("click", () => {
    if (selectedYear >= CURRENT_YEAR) return;
    selectedYear += 1;
    render();
  });

  render();
})();
