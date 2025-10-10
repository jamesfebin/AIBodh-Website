document.addEventListener('DOMContentLoaded', () => {
  const content = document.querySelector('.post-content');
  const tocContainer = document.querySelector('.post-toc');
  const tocPlaceholder = document.getElementById('post-toc-links');
  const tocWrapper = document.querySelector('.post-toc-wrapper') || tocContainer?.parentElement;
  const tocColumn = document.querySelector('.post-toc-column');

  if (!content || !tocContainer || !tocPlaceholder) {
    return;
  }

  const headings = Array.from(content.querySelectorAll('h2, h3')).filter(
    (heading) => heading.textContent && heading.textContent.trim().length > 0
  );

  if (headings.length === 0) {
    tocContainer.style.display = 'none';
    if (tocWrapper && tocWrapper !== tocContainer) {
      tocWrapper.style.display = 'none';
    }
    const tocAside = (tocWrapper || tocContainer).closest('aside');
    if (tocAside) {
      tocAside.style.display = 'none';
    }
    return;
  }

  const computeTopOffset = () => {
    if (!tocWrapper) {
      return 0;
    }
    const topValue = getComputedStyle(tocWrapper).top;
    const numeric = parseFloat(topValue);
    if (Number.isNaN(numeric)) {
      return 0;
    }
    if (topValue.includes('rem')) {
      const rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      return numeric * (Number.isNaN(rootFontSize) ? 16 : rootFontSize);
    }
    return numeric;
  };

  let topOffset = computeTopOffset();

  const usedIds = new Set();
  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const ensureUniqueId = (base) => {
    let uniqueId = base;
    let counter = 1;
    while (usedIds.has(uniqueId) || (uniqueId && document.getElementById(uniqueId))) {
      uniqueId = `${base}-${counter}`;
      counter += 1;
    }
    usedIds.add(uniqueId);
    return uniqueId;
  };

  const rootList = document.createElement('ul');
  rootList.className = 'post-toc__list';

  let currentSublist = null;
  let lastH2Item = null;
  const tocEntries = [];

  headings.forEach((heading) => {
    if (!heading.id || heading.id.trim().length === 0) {
      const baseId = slugify(heading.textContent);
      const generatedId = ensureUniqueId(baseId || 'section');
      heading.id = generatedId;
    } else {
      usedIds.add(heading.id);
    }

    const level = heading.tagName === 'H3' ? 3 : 2;
    const listItem = document.createElement('li');
    listItem.className = `post-toc__item post-toc__item--level${level}`;

    const link = document.createElement('a');
    link.className = 'post-toc__link';
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();

    link.addEventListener('click', (event) => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${heading.id}`);
    });

    listItem.appendChild(link);

    if (level === 2) {
      rootList.appendChild(listItem);
      lastH2Item = listItem;
      currentSublist = null;
    } else if (level === 3 && lastH2Item) {
      if (!currentSublist) {
        currentSublist = document.createElement('ul');
        currentSublist.className = 'post-toc__sublist';
        lastH2Item.appendChild(currentSublist);
      }
      currentSublist.appendChild(listItem);
    } else {
      // No preceding H2; append to root for fallback
      rootList.appendChild(listItem);
    }

    tocEntries.push({
      id: heading.id,
      link,
      heading,
    });
  });

  tocPlaceholder.appendChild(rootList);

  const updateActiveLink = (activeId) => {
    let activeLink = null;
    tocEntries.forEach(({ id, link }) => {
      if (id === activeId) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
        activeLink = link;
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
    if (activeLink) {
      activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const observerTopMargin = -(topOffset + 24);
  const observerBottomMargin = -Math.max(window.innerHeight * 0.35, 220);

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.target.offsetTop - b.target.offsetTop);

      if (visibleEntries.length > 0) {
        updateActiveLink(visibleEntries[0].target.id);
        return;
      }

      // Fallback: highlight the last heading above the viewport
      const scrollPosition = window.scrollY || window.pageYOffset;
      let closestEntry = tocEntries[0];
      tocEntries.forEach((entry) => {
        if (entry.heading.offsetTop <= scrollPosition + topOffset + 32) {
          closestEntry = entry;
        }
      });
      updateActiveLink(closestEntry.id);
    },
    {
      rootMargin: `${observerTopMargin}px 0px ${observerBottomMargin}px 0px`,
      threshold: [0, 0.2, 0.6, 1],
    }
  );

  tocEntries.forEach(({ heading }) => observer.observe(heading));

  // Ensure the active link is correct on initial load (e.g., with hash)
  const initialHash = window.location.hash.slice(1);
  if (initialHash) {
    updateActiveLink(initialHash);
  } else {
    const firstHeading = tocEntries[0];
    if (firstHeading) {
      updateActiveLink(firstHeading.id);
    }
  }

  if (!tocWrapper || !tocColumn) {
    return;
  }

  let stickyStart = tocWrapper.getBoundingClientRect().top + window.scrollY - topOffset;
  let isFixed = false;
  let fixedRect = null;

  const placeholder = document.createElement('div');
  placeholder.className = 'post-toc-placeholder';

  const setPlaceholderHeight = (height) => {
    placeholder.style.height = `${height}px`;
  };

  const isColumnHidden = () => window.getComputedStyle(tocColumn).display === 'none';

  let baseRect = null;
  const applyFixedStyles = () => {
    if (!isFixed || !baseRect) {
      return;
    }
    const maxHeight = window.innerHeight - topOffset - 24;
    tocWrapper.style.width = `${baseRect.width}px`;
    tocWrapper.style.left = `${baseRect.left}px`;
    tocWrapper.style.right = 'auto';
    tocWrapper.style.maxHeight = `${maxHeight}px`;
  };

  const enableFixed = () => {
    if (isFixed) {
      applyFixedStyles();
      setPlaceholderHeight(tocWrapper.offsetHeight);
      return;
    }
    fixedRect = tocWrapper.getBoundingClientRect();
    baseRect = {
      left: fixedRect.left,
      width: fixedRect.width,
    };
    isFixed = true;
    setPlaceholderHeight(fixedRect.height);
    applyFixedStyles();
    tocColumn.appendChild(placeholder);
    tocWrapper.classList.add('is-fixed');
    applyFixedStyles();
  };

  const disableFixed = () => {
    if (!isFixed) {
      return;
    }
    isFixed = false;
    fixedRect = null;
    baseRect = null;
    tocWrapper.classList.remove('is-fixed');
    tocWrapper.style.width = '';
    tocWrapper.style.left = '';
    tocWrapper.style.right = '';
    tocWrapper.style.maxHeight = '';
    if (placeholder.parentNode === tocColumn) {
      tocColumn.removeChild(placeholder);
    }
  };

  const syncStickyStart = () => {
    if (isColumnHidden()) {
      stickyStart = Infinity;
      return;
    }
    stickyStart = tocWrapper.getBoundingClientRect().top + window.scrollY - topOffset;
  };

  const handleScroll = () => {
    if (isColumnHidden()) {
      disableFixed();
      return;
    }
    if (window.scrollY >= stickyStart) {
      enableFixed();
    } else {
      disableFixed();
    }
  };

  const handleResize = () => {
    disableFixed();
    topOffset = computeTopOffset();
    syncStickyStart();
    handleScroll();
  };

  const refreshFixedMetrics = () => {
    if (!isFixed) {
      return;
    }
    fixedRect = tocWrapper.getBoundingClientRect();
    setPlaceholderHeight(fixedRect.height);
    applyFixedStyles();
  };

  syncStickyStart();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    disableFixed();
    topOffset = computeTopOffset();
    syncStickyStart();
    handleScroll();
  });

  const mutationObserver = new MutationObserver(() => {
    refreshFixedMetrics();
  });

  mutationObserver.observe(tocWrapper, { childList: true, subtree: true, characterData: true });

  handleScroll();
});
