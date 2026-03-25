const KEY_CATEGORIES = "report_app_categories_v1";
const KEY_REPORTS = "report_app_reports_v1";
const KEY_SETTINGS = "report_app_settings_v1";
const UNCATEGORIZED_ID = "cat-uncategorized";

function loadData() {
  return {
    categories: parse(KEY_CATEGORIES, []),
    reports: parse(KEY_REPORTS, []),
    settings: parse(KEY_SETTINGS, { schemaVersion: 1 })
  };
}

function saveData(data) {
  localStorage.setItem(KEY_CATEGORIES, JSON.stringify(data.categories));
  localStorage.setItem(KEY_REPORTS, JSON.stringify(data.reports));
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(data.settings));
}

function exportJson(data) {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    categories: data.categories,
    reports: data.reports
  };
  return JSON.stringify(payload, null, 2);
}

function importJson(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("잘못된 JSON 형식입니다.");
  }
  if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.reports)) {
    throw new Error("categories/reports 배열이 필요합니다.");
  }
  return {
    categories: parsed.categories,
    reports: parsed.reports,
    settings: { schemaVersion: Number(parsed.schemaVersion || 1) }
  };
}

function parse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeData(rawData) {
  const now = new Date().toISOString();
  const safe = {
    categories: Array.isArray(rawData.categories) ? rawData.categories : [],
    reports: Array.isArray(rawData.reports) ? rawData.reports : [],
    settings: rawData.settings || { schemaVersion: 1 }
  };

  let categories = safe.categories
    .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
    .map((item) => ({
      id: item.id,
      name: item.name.trim() || "이름없음",
      createdAt: item.createdAt || now
    }));

  if (!categories.some((c) => c.id === UNCATEGORIZED_ID)) {
    categories = [
      {
        id: UNCATEGORIZED_ID,
        name: "미분류",
        createdAt: now
      },
      ...categories
    ];
  }

  const categoryIds = new Set(categories.map((c) => c.id));

  const reports = safe.reports
    .filter((item) => item && typeof item.id === "string")
    .map((item) => {
      const createdAt = item.createdAt || now;
      const updatedAt = item.updatedAt || createdAt;
      const categoryId = categoryIds.has(item.categoryId) ? item.categoryId : UNCATEGORIZED_ID;
      const tags = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];

      return {
        id: item.id,
        title: (item.title || "제목 없음").trim(),
        categoryId,
        content: item.content || "",
        tags,
        pinned: Boolean(item.pinned),
        archived: Boolean(item.archived),
        createdAt,
        updatedAt
      };
    });

  return {
    categories,
    reports,
    settings: { schemaVersion: Number(safe.settings.schemaVersion || 1) }
  };
}

function makeCategory(name) {
  return {
    id: `cat-${crypto.randomUUID()}`,
    name: name.trim(),
    createdAt: new Date().toISOString()
  };
}

function makeReport() {
  const now = new Date().toISOString();
  return {
    id: `rep-${crypto.randomUUID()}`,
    title: "새 리포트",
    categoryId: UNCATEGORIZED_ID,
    content: "",
    tags: [],
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}

function getUncategorizedId() {
  return UNCATEGORIZED_ID;
}

const md = window.markdownit({
  html: false,
  linkify: true,
  breaks: true
});

let mermaidInitialized = false;

function ensureMermaidInitialized() {
  if (mermaidInitialized || !window.mermaid) {
    return;
  }

  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default"
  });
  mermaidInitialized = true;
}

function renderMarkdownAndMath(source, container) {
  const normalized = normalizeMathDelimiters(source || "");
  const extracted = extractMathBlocks(normalized);
  const html = md.render(preprocessWikiLinks(extracted.markdown));
  const clean = window.DOMPurify.sanitize(html);
  container.innerHTML = clean;

  restoreAndRenderMathBlocks(container, extracted.blocks);

  if (window.renderMathInElement) {
    window.renderMathInElement(container, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$", right: "$", display: false }
      ],
      strict: "ignore",
      throwOnError: false
    });
  }

  renderMermaidInContainer(container);
}

function normalizeMathDelimiters(source) {
  return source.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, expr) => `$$${expr.trim()}$$`);
}

function extractMathBlocks(source) {
  const blocks = [];
  const markdown = source.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
    const idx = blocks.push(expr.trim()) - 1;
    return `@@MATH_BLOCK_${idx}@@`;
  });
  return { markdown, blocks };
}

function restoreAndRenderMathBlocks(container, blocks) {
  if (!blocks || blocks.length === 0) {
    return;
  }

  let html = container.innerHTML;
  blocks.forEach((_, idx) => {
    html = html.replaceAll(
      `@@MATH_BLOCK_${idx}@@`,
      `<span class="math-block" data-math-idx="${idx}"></span>`
    );
  });
  container.innerHTML = html;

  const nodes = Array.from(container.querySelectorAll(".math-block"));
  nodes.forEach((node) => {
    const idx = Number(node.dataset.mathIdx);
    const expr = blocks[idx] || "";
    if (window.katex) {
      window.katex.render(expr, node, {
        displayMode: true,
        throwOnError: false,
        strict: "ignore"
      });
    } else {
      node.textContent = `$$${expr}$$`;
    }
  });
}

function preprocessWikiLinks(source) {
  return source.replace(/\[\[([^\]\n]+)\]\]/g, (_, rawTitle) => {
    const title = rawTitle.trim();
    if (!title) {
      return "";
    }
    return `[${title}](#wikilink:${encodeURIComponent(title)})`;
  });
}

function renderMermaidInContainer(container) {
  const codeBlocks = Array.from(container.querySelectorAll("pre code.language-mermaid"));
  if (codeBlocks.length === 0) {
    return;
  }

  ensureMermaidInitialized();
  if (!window.mermaid) {
    return;
  }

  const nodes = [];
  codeBlocks.forEach((code) => {
    const pre = code.closest("pre");
    if (!pre) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "mermaid";
    wrapper.textContent = code.textContent || "";
    pre.replaceWith(wrapper);
    nodes.push(wrapper);
  });

  if (nodes.length > 0) {
    window.mermaid.run({ nodes }).catch(() => {
      // Keep raw mermaid source visible if rendering fails.
    });
  }
}

function reportToMarkdown(report, categoryName) {
  const tagLine = report.tags.join(", ");
  return [
    "---",
    `title: ${report.title}`,
    `category: ${categoryName}`,
    `tags: ${tagLine}`,
    `updatedAt: ${report.updatedAt}`,
    "---",
    "",
    report.content
  ].join("\n");
}

function markdownToDraft(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    return {
      title: guessTitle(text),
      tags: [],
      categoryName: "미분류",
      content: text
    };
  }

  let i = 1;
  const meta = {};
  while (i < lines.length && lines[i] !== "---") {
    const line = lines[i];
    const idx = line.indexOf(":");
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    }
    i += 1;
  }

  const content = lines.slice(i + 1).join("\n");

  return {
    title: meta.title || guessTitle(content),
    categoryName: meta.category || "미분류",
    tags: (meta.tags || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    content
  };
}

function guessTitle(content) {
  const first = (content || "").split(/\r?\n/).find((line) => line.trim().length > 0);
  return first ? first.replace(/^#+\s*/, "").slice(0, 40) : "가져온 리포트";
}

function suggestTitleFromContent(content) {
  const first = (content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("$$") && !line.startsWith("|"));

  if (!first) {
    return "제목 없음";
  }

  return first
    .replace(/^#+\s*/, "")
    .replace(/^[-*]\s+/, "")
    .slice(0, 40);
}

let data = normalizeData(loadData());
let currentView = "dashboard";
let selectedReportId = data.reports[0]?.id || null;
let debounceTimer = null;
let isPreviewOpen = true;
let isFocusMode = false;
let selectedCategoryIdInManager = null;

const els = {
  navButtons: Array.from(document.querySelectorAll("[data-view-target]")),
  views: Array.from(document.querySelectorAll(".main-view")),
  syncStatus: document.getElementById("sync-status"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  statsCategories: document.getElementById("stats-categories"),
  statsReports: document.getElementById("stats-reports"),
  statsUpdated: document.getElementById("stats-updated"),
  recentList: document.getElementById("recent-list"),
  categoryInput: document.getElementById("category-input"),
  categoryAddBtn: document.getElementById("category-add-btn"),
  categoryList: document.getElementById("category-list"),
  categorySelectedName: document.getElementById("category-selected-name"),
  categoryBulkTarget: document.getElementById("category-bulk-target"),
  categoryMoveSelectedBtn: document.getElementById("category-move-selected-btn"),
  categoryMoveAllBtn: document.getElementById("category-move-all-btn"),
  categoryReportList: document.getElementById("category-report-list"),
  reportSearch: document.getElementById("report-search"),
  reportCategoryFilter: document.getElementById("report-category-filter"),
  reportTagFilter: document.getElementById("report-tag-filter"),
  reportShowArchived: document.getElementById("report-show-archived"),
  reportList: document.getElementById("report-list"),
  reportCreateBtn: document.getElementById("report-create-btn"),
  editorTitle: document.getElementById("editor-title"),
  editorCategory: document.getElementById("editor-category"),
  editorTags: document.getElementById("editor-tags"),
  editorContent: document.getElementById("editor-content"),
  editorUpdated: document.getElementById("editor-updated"),
  editorSaveBtn: document.getElementById("editor-save-btn"),
  editorUndoBtn: document.getElementById("editor-undo-btn"),
  editorRedoBtn: document.getElementById("editor-redo-btn"),
  editorDeleteBtn: document.getElementById("editor-delete-btn"),
  editorExportMdBtn: document.getElementById("editor-export-md-btn"),
  editorImportMdInput: document.getElementById("editor-import-md-input"),
  editorTemplate: document.getElementById("editor-template"),
  editorApplyTemplateBtn: document.getElementById("editor-apply-template-btn"),
  editorLayout: document.getElementById("editor-layout"),
  editorPreviewPane: document.getElementById("editor-preview-pane"),
  editorTogglePreviewBtn: document.getElementById("editor-toggle-preview-btn"),
  editorFocusBtn: document.getElementById("editor-focus-btn"),
  editorStats: document.getElementById("editor-stats"),
  editorToolbar: document.querySelector(".editor-toolbar"),
  editorInsertPosition: document.getElementById("editor-insert-position"),
  editorLinkTarget: document.getElementById("editor-link-target"),
  editorInsertLinkBtn: document.getElementById("editor-insert-link-btn"),
  editorMathTemplate: document.getElementById("editor-math-template"),
  editorInsertMathTemplateBtn: document.getElementById("editor-insert-math-template-btn"),
  editorOutgoingLinks: document.getElementById("editor-outgoing-links"),
  editorBacklinks: document.getElementById("editor-backlinks"),
  preview: document.getElementById("preview"),
  backupExportBtn: document.getElementById("backup-export-btn"),
  backupImportMode: document.getElementById("backup-import-mode"),
  backupImportInput: document.getElementById("backup-import-input"),
  backupMessage: document.getElementById("backup-message")
};

init();

function init() {
  const preferredTheme = data.settings.theme || "light";
  applyTheme(preferredTheme);

  isPreviewOpen = data.settings.previewOpen !== false;
  const savedReportId = data.settings.lastReportId;
  if (savedReportId && data.reports.some((r) => r.id === savedReportId)) {
    selectedReportId = savedReportId;
  }

  if (els.reportShowArchived) {
    els.reportShowArchived.checked = Boolean(data.settings.showArchivedInList);
  }

  if (els.editorLayout) {
    els.editorLayout.classList.toggle("preview-hidden", !isPreviewOpen);
  }
  if (els.editorTogglePreviewBtn) {
    els.editorTogglePreviewBtn.textContent = isPreviewOpen ? "미리보기 닫기" : "미리보기 열기";
  }

  bindNav();
  bindCategoryActions();
  bindReportListActions();
  bindEditorActions();
  bindBackupActions();
  bindThemeActions();

  if (!selectedReportId && data.reports.length > 0) {
    selectedReportId = data.reports[0].id;
  }

  renderAll();
}

function bindThemeActions() {
  if (!els.themeToggleBtn) {
    return;
  }

  updateThemeButtonText();
  els.themeToggleBtn.addEventListener("click", () => {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    data.settings.theme = nextTheme;
    saveData(data);
    updateThemeButtonText();
    setStatus(nextTheme === "dark" ? "다크 모드 적용" : "라이트 모드 적용");
  });
}

function getCurrentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
}

function updateThemeButtonText() {
  if (!els.themeToggleBtn) {
    return;
  }
  els.themeToggleBtn.textContent = getCurrentTheme() === "dark" ? "라이트 모드" : "다크 모드";
}

function bindNav() {
  const titleEl = document.getElementById("current-view-title");
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.viewTarget;
      const titleLabel = button.textContent.replace(/[^가-힣a-zA-Z\s\/]/g, "").trim();
      if (titleEl) {
        titleEl.textContent = titleLabel;
      }
      renderViews();
    });
  });
}

function bindCategoryActions() {
  els.categoryAddBtn.addEventListener("click", () => {
    const name = els.categoryInput.value.trim();
    if (!name) {
      return;
    }

    const exists = data.categories.some((item) => item.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("이미 존재하는 카테고리입니다.");
      return;
    }

    data.categories.push(makeCategory(name));
    els.categoryInput.value = "";
    saveAndRender("카테고리 추가 완료");
  });

  els.categoryList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const id = target.dataset.categoryId;
    if (!id) {
      return;
    }

    if (target.matches("[data-action='select-category']")) {
      selectedCategoryIdInManager = id;
      renderCategoryReportsManager();
      return;
    }

    if (target.matches("[data-action='edit-category']")) {
      const category = data.categories.find((item) => item.id === id);
      if (!category) {
        return;
      }

      const nextName = prompt("새 카테고리 이름", category.name);
      if (!nextName) {
        return;
      }

      const exists = data.categories.some(
        (item) => item.id !== id && item.name.toLowerCase() === nextName.trim().toLowerCase()
      );
      if (exists) {
        alert("이미 존재하는 이름입니다.");
        return;
      }

      category.name = nextName.trim();
      saveAndRender("카테고리 수정 완료");
      renderCategoryReportsManager();
    }

    if (target.matches("[data-action='delete-category']")) {
      if (id === getUncategorizedId()) {
        alert("미분류 카테고리는 삭제할 수 없습니다.");
        return;
      }

      const ok = confirm("카테고리를 삭제하면 연결 리포트는 미분류로 이동됩니다. 계속할까요?");
      if (!ok) {
        return;
      }

      data.categories = data.categories.filter((item) => item.id !== id);
      data.reports = data.reports.map((report) => {
        if (report.categoryId === id) {
          return { ...report, categoryId: getUncategorizedId(), updatedAt: new Date().toISOString() };
        }
        return report;
      });
      if (selectedCategoryIdInManager === id) {
        selectedCategoryIdInManager = getUncategorizedId();
      }
      saveAndRender("카테고리 삭제 완료");
    }
  });

  els.categoryReportList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const reportId = target.dataset.reportId;
    if (!reportId) {
      return;
    }

    selectedReportId = reportId;
    data.settings.lastReportId = reportId;
    currentView = "editor";
    saveAndRender("리포트를 열었습니다.");
  });

  els.categoryMoveSelectedBtn.addEventListener("click", () => {
    if (!selectedCategoryIdInManager) {
      alert("먼저 카테고리를 선택하세요.");
      return;
    }

    const toCategoryId = els.categoryBulkTarget.value;
    if (!toCategoryId || toCategoryId === selectedCategoryIdInManager) {
      alert("이동할 다른 카테고리를 선택하세요.");
      return;
    }

    const checked = Array.from(
      els.categoryReportList.querySelectorAll("input[data-report-select]:checked")
    ).map((item) => item.value);

    if (checked.length === 0) {
      alert("이동할 리포트를 선택하세요.");
      return;
    }

    const now = new Date().toISOString();
    data.reports = data.reports.map((report) =>
      checked.includes(report.id) ? { ...report, categoryId: toCategoryId, updatedAt: now } : report
    );

    saveAndRender(`${checked.length}개 리포트를 이동했습니다.`);
  });

  els.categoryMoveAllBtn.addEventListener("click", () => {
    if (!selectedCategoryIdInManager) {
      alert("먼저 카테고리를 선택하세요.");
      return;
    }

    const toCategoryId = els.categoryBulkTarget.value;
    if (!toCategoryId || toCategoryId === selectedCategoryIdInManager) {
      alert("이동할 다른 카테고리를 선택하세요.");
      return;
    }

    const targets = data.reports.filter((report) => report.categoryId === selectedCategoryIdInManager);
    if (targets.length === 0) {
      alert("이동할 리포트가 없습니다.");
      return;
    }

    const ok = confirm(`${targets.length}개 리포트를 한번에 이동할까요?`);
    if (!ok) {
      return;
    }

    const now = new Date().toISOString();
    data.reports = data.reports.map((report) =>
      report.categoryId === selectedCategoryIdInManager
        ? { ...report, categoryId: toCategoryId, updatedAt: now }
        : report
    );

    saveAndRender(`${targets.length}개 리포트를 이동했습니다.`);
  });
}

function bindReportListActions() {
  els.reportCreateBtn.addEventListener("click", () => {
    const report = makeReport();
    data.reports.unshift(report);
    selectedReportId = report.id;
    data.settings.lastReportId = report.id;
    currentView = "editor";
    saveAndRender("리포트 생성 완료");
  });

  els.reportSearch.addEventListener("input", () => renderReportList());
  els.reportCategoryFilter.addEventListener("change", () => renderReportList());
  els.reportTagFilter.addEventListener("input", () => renderReportList());
  els.reportShowArchived.addEventListener("change", () => {
    data.settings.showArchivedInList = els.reportShowArchived.checked;
    saveData(data);
    renderReportList();
  });

  els.reportList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const reportId = target.dataset.reportId || target.closest("[data-report-id]")?.dataset.reportId;
    if (!reportId) {
      return;
    }

    const report = data.reports.find((item) => item.id === reportId);
    if (!report) {
      return;
    }

    if (target.matches("[data-action='toggle-pin']")) {
      report.pinned = !report.pinned;
      report.updatedAt = new Date().toISOString();
      saveAndRender(report.pinned ? "리포트를 고정했습니다." : "리포트 고정을 해제했습니다.");
      return;
    }

    if (target.matches("[data-action='toggle-archive']")) {
      report.archived = !report.archived;
      report.updatedAt = new Date().toISOString();
      saveAndRender(report.archived ? "리포트를 보관했습니다." : "리포트를 복원했습니다.");
      return;
    }

    if (target.matches("[data-action='clone-report']")) {
      const clone = {
        ...report,
        id: `rep-${crypto.randomUUID()}`,
        title: `${report.title} (복제본)`,
        pinned: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.reports.unshift(clone);
      selectedReportId = clone.id;
      data.settings.lastReportId = clone.id;
      saveAndRender("리포트를 복제했습니다.");
      return;
    }

    selectedReportId = reportId;
    data.settings.lastReportId = reportId;
    currentView = "editor";
    renderAll();
  });
}

function bindEditorActions() {
  const onInput = () => {
    const report = getSelectedReport();
    if (!report) {
      return;
    }

    report.title = els.editorTitle.value.trim() || "제목 없음";
    report.categoryId = els.editorCategory.value;
    report.tags = els.editorTags.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    report.content = els.editorContent.value;

    if (!els.editorTitle.value.trim() || els.editorTitle.value.trim() === "새 리포트" || els.editorTitle.value.trim() === "제목 없음") {
      const suggestedTitle = suggestTitleFromContent(report.content);
      if (suggestedTitle) {
        report.title = suggestedTitle;
        els.editorTitle.value = suggestedTitle;
      }
    }

    report.updatedAt = new Date().toISOString();

    renderPreview(report.content);
    renderEditorStats(report.content);
    renderDashboard();
    updateEditorMeta(report);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      saveData(data);
      setStatus("자동 저장됨");
      renderReportList();
    }, 700);
  };

  els.editorTitle.addEventListener("input", onInput);
  els.editorCategory.addEventListener("change", onInput);
  els.editorTags.addEventListener("input", onInput);
  els.editorContent.addEventListener("input", onInput);

  if (els.editorTogglePreviewBtn && els.editorLayout) {
    els.editorTogglePreviewBtn.addEventListener("click", () => {
      isPreviewOpen = !isPreviewOpen;
      els.editorLayout.classList.toggle("preview-hidden", !isPreviewOpen);
      els.editorTogglePreviewBtn.textContent = isPreviewOpen ? "미리보기 닫기" : "미리보기 열기";
      data.settings.previewOpen = isPreviewOpen;
      saveData(data);
      setStatus(isPreviewOpen ? "미리보기를 열었습니다." : "미리보기를 닫았습니다.");
    });
  }

  if (els.editorFocusBtn) {
    els.editorFocusBtn.addEventListener("click", () => {
      isFocusMode = !isFocusMode;
      document.body.classList.toggle("focus-mode", isFocusMode);
      els.editorFocusBtn.textContent = isFocusMode ? "집중 모드 해제" : "집중 모드";
    });
  }

  if (els.editorUndoBtn) {
    els.editorUndoBtn.addEventListener("click", () => {
      els.editorContent.focus();
      document.execCommand("undo");
      els.editorContent.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  if (els.editorRedoBtn) {
    els.editorRedoBtn.addEventListener("click", () => {
      els.editorContent.focus();
      document.execCommand("redo");
      els.editorContent.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  if (els.editorToolbar) {
    els.editorToolbar.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const action = target.dataset.insert;
      if (!action) {
        return;
      }

      applyInsert(action);
    });
  }

  if (els.editorInsertMathTemplateBtn) {
    els.editorInsertMathTemplateBtn.addEventListener("click", () => {
      ensureEditableReport();
      const type = els.editorMathTemplate.value;
      if (!type) {
        alert("삽입할 수식 템플릿을 선택하세요.");
        return;
      }

      const latex = getMathTemplate(type);
      if (!latex) {
        return;
      }

      insertMathBlock(latex, els.editorInsertPosition?.value || "cursor");
      setStatus("수식 템플릿을 삽입했습니다.");
    });
  }

  if (els.editorInsertLinkBtn) {
    els.editorInsertLinkBtn.addEventListener("click", () => {
      const title = els.editorLinkTarget.value;
      if (!title) {
        alert("링크할 리포트를 선택하세요.");
        return;
      }
      insertWikiLink(title);
      setStatus("내부 링크를 삽입했습니다.");
    });
  }

  if (els.preview) {
    els.preview.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const link = target.closest("a[href^='#wikilink:']");
      if (!link) {
        return;
      }

      event.preventDefault();
      const href = link.getAttribute("href") || "";
      const encoded = href.replace("#wikilink:", "");
      const title = decodeURIComponent(encoded);
      const report = findReportByTitle(title);
      if (!report) {
        alert(`연결된 문서를 찾을 수 없습니다: ${title}`);
        return;
      }

      selectedReportId = report.id;
      data.settings.lastReportId = report.id;
      saveAndRender("위키 링크로 문서를 열었습니다.");
    });
  }

  [els.editorOutgoingLinks, els.editorBacklinks].forEach((zone) => {
    zone?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const reportId = target.dataset.openReportId;
      if (!reportId) {
        return;
      }

      selectedReportId = reportId;
      data.settings.lastReportId = reportId;
      saveAndRender("문서를 열었습니다.");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!event.ctrlKey) {
      return;
    }

    if (currentView !== "editor") {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "s") {
      event.preventDefault();
      els.editorSaveBtn.click();
      return;
    }

    if (key === "b") {
      event.preventDefault();
      applyInsert("bold");
      return;
    }

    if (key === "i") {
      event.preventDefault();
      applyInsert("italic");
      return;
    }

    if (key === "/") {
      event.preventDefault();
      applyInsert("math");
    }
  });

  els.editorSaveBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) {
      return;
    }

    report.updatedAt = new Date().toISOString();
    data.settings.lastReportId = report.id;
    saveAndRender("수동 저장 완료");
  });

  els.editorDeleteBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) {
      return;
    }

    const ok = confirm("현재 리포트를 삭제할까요?");
    if (!ok) {
      return;
    }

    data.reports = data.reports.filter((item) => item.id !== report.id);
    selectedReportId = data.reports[0]?.id || null;
    saveAndRender("리포트 삭제 완료");
  });

  els.editorExportMdBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) {
      return;
    }

    const categoryName = getCategoryName(report.categoryId);
    const text = reportToMarkdown(report, categoryName);
    downloadFile(`${safeFilename(report.title)}.md`, text, "text/markdown;charset=utf-8");
    setStatus("Markdown 내보내기 완료");
  });

  els.editorImportMdInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const draft = markdownToDraft(text);

    const report = makeReport();
    report.title = draft.title || report.title;
    report.content = draft.content;
    report.tags = draft.tags;

    const categoryId = findOrCreateCategoryByName(draft.categoryName || "미분류");
    report.categoryId = categoryId;

    data.reports.unshift(report);
    selectedReportId = report.id;
    data.settings.lastReportId = report.id;
    event.target.value = "";
    saveAndRender("Markdown 가져오기 완료");
  });

  [els.editorContent, els.preview].forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    zone.addEventListener("drop", async (event) => {
      event.preventDefault();
      const file = event.dataTransfer?.files?.[0];
      if (!file || !file.name.toLowerCase().endsWith(".md")) {
        return;
      }

      const text = await file.text();
      const draft = markdownToDraft(text);
      const report = makeReport();
      report.title = draft.title || report.title;
      report.content = draft.content;
      report.tags = draft.tags;
      report.categoryId = findOrCreateCategoryByName(draft.categoryName || "미분류");

      data.reports.unshift(report);
      selectedReportId = report.id;
      data.settings.lastReportId = report.id;
      saveAndRender("드래그 앤 드롭으로 Markdown을 가져왔습니다.");
    });
  });

  els.editorApplyTemplateBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) return;

    const templateType = els.editorTemplate.value;
    if (!templateType) {
      alert("적용할 템플릿을 선택하세요.");
      return;
    }

    if (report.content.trim() !== "") {
      const ok = confirm("현재 작성된 내용이 있습니다. 템플릿을 덮어씌울까요?");
      if (!ok) return;
    }

    let templateText = "";
    if (templateType === "experiment") {
      templateText = "# 🧪 실험 보고서\n\n## 1. 목적\n- \n\n## 2. 가설 및 변인\n- 가설:\n- 독립변인:\n- 종속변인:\n\n## 3. 방법 (Methods)\n1. \n2. \n\n## 4. 데이터 및 결과 (Results)\n$$ y = ax + b $$\n\n## 5. 결론 및 고찰 (Conclusion)\n- ";
    } else if (templateType === "literature") {
      templateText = "# 📚 문헌 리뷰\n\n## 메타정보\n- **논문 제목**: \n- **저자**: \n- **출판년도/저널**: \n\n## 1. 연구 배경 및 목적\n- \n\n## 2. 한계점 및 제안점 (Motivation)\n- \n\n## 3. 사용한 방법론 (Methodology)\n- \n\n## 4. 주요 결과 및 기여 (Contribution)\n- \n\n## 5. 내 연구에의 적용 아이디어\n- ";
    } else if (templateType === "meeting") {
      templateText = "# 🤝 연구 미팅 회의록\n\n- **일시**: \n- **참석자**: \n\n## 1. 진행 상황 공유\n- \n- \n\n## 2. 논의 사항 및 피드백\n- [ ] 논의 안건 1\n  - 피드백 내용\n\n## 3. 다음 목표 (Action Items)\n- [ ] \n- [ ] \n\n## 4. 비고\n- ";
    }

    if (templateText) {
      els.editorContent.value = templateText;
      report.content = templateText;
      renderPreview(templateText);
      renderEditorStats(templateText);
      report.updatedAt = new Date().toISOString();
      updateEditorMeta(report);
      saveData(data);
      setStatus("템플릿 적용 완료");
    }
  });
}

function bindBackupActions() {
  els.backupExportBtn.addEventListener("click", () => {
    const text = exportJson(data);
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    downloadFile(`report-backup-${stamp}.json`, text, "application/json;charset=utf-8");
    els.backupMessage.textContent = "JSON 백업 파일을 생성했습니다.";
  });

  els.backupImportInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = normalizeData(importJson(text));
      if (els.backupImportMode?.value === "merge") {
        mergeImportedData(imported);
      } else {
        data = imported;
      }

      selectedReportId = data.settings.lastReportId || data.reports[0]?.id || null;
      saveData(data);
      renderAll();
      els.backupMessage.textContent = els.backupImportMode?.value === "merge"
        ? "병합 복원 완료: 기존 데이터에 추가되었습니다."
        : "복원 완료: 데이터가 반영되었습니다.";
      setStatus("백업 복원 완료");
    } catch (error) {
      els.backupMessage.textContent = `복원 실패: ${error.message}`;
    } finally {
      event.target.value = "";
    }
  });
}

function mergeImportedData(imported) {
  const existingCategoryByName = new Map(data.categories.map((cat) => [cat.name.toLowerCase(), cat.id]));
  const importCategoryById = new Map(imported.categories.map((cat) => [cat.id, cat]));
  const categoryIdMap = new Map();

  imported.categories.forEach((category) => {
    const key = category.name.toLowerCase();
    const existingId = existingCategoryByName.get(key);
    if (existingId) {
      categoryIdMap.set(category.id, existingId);
      return;
    }

    const next = makeCategory(category.name);
    data.categories.push(next);
    existingCategoryByName.set(key, next.id);
    categoryIdMap.set(category.id, next.id);
  });

  imported.reports.forEach((report) => {
    const sourceCategory = importCategoryById.get(report.categoryId);
    const mappedCategoryId = categoryIdMap.get(report.categoryId)
      || (sourceCategory ? findOrCreateCategoryByName(sourceCategory.name) : getUncategorizedId());

    const cloned = {
      ...report,
      id: `rep-${crypto.randomUUID()}`,
      title: report.title || "가져온 리포트",
      categoryId: mappedCategoryId,
      updatedAt: report.updatedAt || new Date().toISOString(),
      createdAt: report.createdAt || new Date().toISOString(),
      pinned: Boolean(report.pinned),
      archived: Boolean(report.archived)
    };
    data.reports.unshift(cloned);
  });
}

function saveAndRender(message) {
  saveData(data);
  setStatus(message);
  renderAll();
}

function renderAll() {
  data = normalizeData(data);
  renderViews();
  renderCategories();
  renderCategoryReportsManager();
  renderReportFilter();
  renderReportList();
  renderEditor();
  renderDashboard();
}

function renderViews() {
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === currentView);
  });

  els.views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === currentView);
  });
}

function renderDashboard() {
  els.statsCategories.textContent = String(data.categories.length);
  els.statsReports.textContent = String(data.reports.length);

  const updatedAt = data.reports
    .map((r) => new Date(r.updatedAt).getTime())
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => b - a)[0];
  els.statsUpdated.textContent = updatedAt ? new Date(updatedAt).toLocaleString("ko-KR") : "없음";

  const recent = [...data.reports]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    els.recentList.innerHTML = "<p class='muted'>아직 작성된 리포트가 없습니다.</p>";
    return;
  }

  els.recentList.innerHTML = recent
    .map(
      (report) =>
        `<div class="list-item"><strong>${escapeHtml(report.title)}</strong><span class="muted">${new Date(report.updatedAt).toLocaleString("ko-KR")} · ${escapeHtml(getCategoryName(report.categoryId))}</span></div>`
    )
    .join("");
}

function renderCategories() {
  if (!selectedCategoryIdInManager || !data.categories.some((c) => c.id === selectedCategoryIdInManager)) {
    selectedCategoryIdInManager = data.categories[0]?.id || null;
  }

  els.categoryList.innerHTML = data.categories
    .map((category) => {
      const linkedCount = data.reports.filter((r) => r.categoryId === category.id).length;
      const isFixed = category.id === getUncategorizedId();
      const activeClass = selectedCategoryIdInManager === category.id ? "active" : "";
      return `
        <div class="list-item ${activeClass}">
          <strong>${escapeHtml(category.name)}</strong>
          <span class="badge">리포트 ${linkedCount}개</span>
          <div class="list-actions">
            <button class="secondary" data-action="select-category" data-category-id="${category.id}">리포트 보기</button>
            <button class="ghost" data-action="edit-category" data-category-id="${category.id}" ${isFixed ? "disabled" : ""}>이름 변경</button>
            <button class="danger" data-action="delete-category" data-category-id="${category.id}" ${isFixed ? "disabled" : ""}>삭제</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCategoryReportsManager() {
  if (!selectedCategoryIdInManager) {
    els.categorySelectedName.textContent = "카테고리를 선택해 주세요";
    els.categoryReportList.innerHTML = "<p class='text-muted'>선택된 카테고리가 없습니다.</p>";
    return;
  }

  const current = data.categories.find((c) => c.id === selectedCategoryIdInManager);
  if (!current) {
    return;
  }

  els.categorySelectedName.textContent = `선택 카테고리: ${current.name}`;

  els.categoryBulkTarget.innerHTML = data.categories
    .filter((c) => c.id !== selectedCategoryIdInManager)
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");

  const reports = data.reports
    .filter((report) => report.categoryId === selectedCategoryIdInManager)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (reports.length === 0) {
    els.categoryReportList.innerHTML = "<p class='text-muted'>이 카테고리에 리포트가 없습니다.</p>";
    return;
  }

  els.categoryReportList.innerHTML = reports
    .map(
      (report) => `
        <article class="list-item">
          <div class="list-header">
            <strong>${escapeHtml(report.title)}</strong>
            <label class="badge">
              <input type="checkbox" data-report-select value="${report.id}" />
              선택
            </label>
          </div>
          <span class="text-muted">${new Date(report.updatedAt).toLocaleString("ko-KR")}</span>
          <div class="list-actions">
            <button class="ghost" data-report-id="${report.id}">열기</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderReportFilter() {
  const selected = els.reportCategoryFilter.value;
  const options = [
    `<option value="all">전체 카테고리</option>`,
    ...data.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
  ].join("");

  els.reportCategoryFilter.innerHTML = options;
  if (["all", ...data.categories.map((c) => c.id)].includes(selected)) {
    els.reportCategoryFilter.value = selected;
  }
}

function renderReportList() {
  const keyword = els.reportSearch.value.trim().toLowerCase();
  const tagKeyword = els.reportTagFilter.value.trim().toLowerCase();
  const categoryFilter = els.reportCategoryFilter.value || "all";
  const showArchived = Boolean(els.reportShowArchived.checked);

  const filtered = data.reports
    .filter((report) => {
      const passCategory = categoryFilter === "all" || report.categoryId === categoryFilter;
      const hay = `${report.title}\n${report.content}`.toLowerCase();
      const passKeyword = !keyword || hay.includes(keyword);
      const passTag = !tagKeyword || report.tags.join(" ").toLowerCase().includes(tagKeyword);
      const passArchived = showArchived ? true : !report.archived;
      return passCategory && passKeyword && passTag && passArchived;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  if (filtered.length === 0) {
    els.reportList.innerHTML = "<p class='muted'>조건에 맞는 리포트가 없습니다.</p>";
    return;
  }

  els.reportList.innerHTML = filtered
    .map((report) => {
      const activeClass = selectedReportId === report.id ? "active" : "";
      return `
        <article class="list-item ${activeClass}" data-report-id="${report.id}">
          <strong>${escapeHtml(report.title)}</strong>
          <div class="report-meta-row">
            ${report.pinned ? '<span class="chip">고정됨</span>' : ""}
            ${report.archived ? '<span class="chip">보관됨</span>' : ""}
            ${report.tags.map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`).join("")}
          </div>
          <span class="muted">${escapeHtml(getCategoryName(report.categoryId))}</span>
          <span class="muted">${new Date(report.updatedAt).toLocaleString("ko-KR")}</span>
          <div class="list-actions">
            <button class="ghost" data-report-id="${report.id}">편집</button>
            <button class="ghost" data-action="toggle-pin" data-report-id="${report.id}">${report.pinned ? "고정해제" : "고정"}</button>
            <button class="ghost" data-action="clone-report" data-report-id="${report.id}">복제</button>
            <button class="danger" data-action="toggle-archive" data-report-id="${report.id}">${report.archived ? "복원" : "보관"}</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderEditor() {
  const report = getSelectedReport();

  const options = data.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");
  els.editorCategory.innerHTML = options;

  if (!report) {
    els.editorTitle.value = "";
    els.editorTags.value = "";
    els.editorContent.value = "";
    els.editorUpdated.textContent = "선택된 리포트 없음";
    if (els.editorStats) {
      els.editorStats.textContent = "0자";
    }
    els.preview.innerHTML = "<p class='muted'>리포트를 선택하거나 새로 생성해 주세요.</p>";
    if (els.editorOutgoingLinks) {
      els.editorOutgoingLinks.innerHTML = "<p class='text-muted'>연결 문서가 없습니다.</p>";
    }
    if (els.editorBacklinks) {
      els.editorBacklinks.innerHTML = "<p class='text-muted'>백링크가 없습니다.</p>";
    }
    return;
  }

  els.editorTitle.value = report.title;
  data.settings.lastReportId = report.id;
  els.editorCategory.value = report.categoryId;
  els.editorTags.value = report.tags.join(", ");
  els.editorContent.value = report.content;
  updateEditorMeta(report);
  renderPreview(report.content);
  renderEditorStats(report.content);
  renderWikiPanels(report);
  renderLinkTargetOptions(report.id);
}

function updateEditorMeta(report) {
  els.editorUpdated.textContent = `최근 수정: ${new Date(report.updatedAt).toLocaleString("ko-KR")}`;
}

function renderPreview(content) {
  renderMarkdownAndMath(content, els.preview);
}

function renderEditorStats(content) {
  if (!els.editorStats) {
    return;
  }
  const text = (content || "").trim();
  const charCount = text.length;
  els.editorStats.textContent = `${charCount}자`;
}

function renderWikiPanels(currentReport) {
  if (!els.editorOutgoingLinks || !els.editorBacklinks) {
    return;
  }

  const outgoingTitles = extractWikiTitles(currentReport.content);
  if (outgoingTitles.length === 0) {
    els.editorOutgoingLinks.innerHTML = "<p class='text-muted'>연결 문서가 없습니다.</p>";
  } else {
    els.editorOutgoingLinks.innerHTML = outgoingTitles
      .map((title) => {
        const report = findReportByTitle(title);
        if (!report) {
          return `<div class="badge">${escapeHtml(title)} (미존재)</div>`;
        }
        return `<button class="wiki-link-btn" data-open-report-id="${report.id}">${escapeHtml(report.title)}</button>`;
      })
      .join("");
  }

  const backlinks = data.reports.filter((report) => {
    if (report.id === currentReport.id) {
      return false;
    }
    const titles = extractWikiTitles(report.content).map(normalizeTitle);
    return titles.includes(normalizeTitle(currentReport.title));
  });

  if (backlinks.length === 0) {
    els.editorBacklinks.innerHTML = "<p class='text-muted'>백링크가 없습니다.</p>";
  } else {
    els.editorBacklinks.innerHTML = backlinks
      .map((report) => `<button class="wiki-link-btn" data-open-report-id="${report.id}">${escapeHtml(report.title)}</button>`)
      .join("");
  }
}

function renderLinkTargetOptions(currentReportId) {
  if (!els.editorLinkTarget) {
    return;
  }

  const options = [
    `<option value="">내부 링크 대상 선택...</option>`,
    ...data.reports
      .filter((report) => report.id !== currentReportId)
      .map((report) => `<option value="${escapeHtml(report.title)}">${escapeHtml(report.title)}</option>`)
  ];
  els.editorLinkTarget.innerHTML = options.join("");
}

function applyInsert(action) {
  const textarea = els.editorContent;
  if (!textarea) {
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  let before = "";
  let after = "";
  let fallback = "";

  if (action === "bold") {
    before = "**";
    after = "**";
    fallback = "굵은 텍스트";
  } else if (action === "italic") {
    before = "*";
    after = "*";
    fallback = "기울임 텍스트";
  } else if (action === "h2") {
    before = "## ";
    after = "";
    fallback = "제목";
  } else if (action === "list") {
    before = "- ";
    after = "";
    fallback = "목록 항목";
  } else if (action === "code") {
    before = "```\n";
    after = "\n```";
    fallback = "코드";
  } else if (action === "math") {
    ensureEditableReport();
    insertMathBlock("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", els.editorInsertPosition?.value || "cursor");
    return;
  } else if (action === "table") {
    before = "| 항목 | 값 |\n|---|---|\n| 예시 | 입력 |\n";
    after = "";
    fallback = "";
  }

  const content = selected || fallback;
  const insertText = `${before}${content}${after}`;
  const next = `${textarea.value.slice(0, start)}${insertText}${textarea.value.slice(end)}`;
  textarea.value = next;
  textarea.focus();

  const cursor = start + insertText.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function extractWikiTitles(content) {
  const regex = /\[\[([^\]\n]+)\]\]/g;
  const titles = [];
  let match = regex.exec(content || "");
  while (match) {
    const title = match[1].trim();
    if (title && !titles.includes(title)) {
      titles.push(title);
    }
    match = regex.exec(content || "");
  }
  return titles;
}

function normalizeTitle(value) {
  return (value || "").trim().toLowerCase();
}

function findReportByTitle(title) {
  const needle = normalizeTitle(title);
  return data.reports.find((report) => normalizeTitle(report.title) === needle) || null;
}

function insertWikiLink(title) {
  const textarea = els.editorContent;
  if (!textarea || !title) {
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end).trim();
  const insertText = `[[${selected || title}]]`;
  const next = `${textarea.value.slice(0, start)}${insertText}${textarea.value.slice(end)}`;
  textarea.value = next;
  textarea.focus();
  const cursor = start + insertText.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertMathBlock(latex, position = "cursor") {
  const textarea = els.editorContent;
  if (!textarea) {
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end).trim();
  const body = position === "replace" && selected ? selected : latex;
  const block = `\n$$\n${body}\n$$\n`;

  let next = textarea.value;
  let cursor = 0;

  if (position === "start") {
    next = `${block}${textarea.value}`;
    cursor = block.length;
  } else if (position === "end") {
    next = `${textarea.value}${textarea.value.endsWith("\n") ? "" : "\n"}${block}`;
    cursor = next.length;
  } else {
    next = `${textarea.value.slice(0, start)}${block}${textarea.value.slice(position === "replace" ? end : start)}`;
    cursor = start + block.length;
  }

  textarea.value = next;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureEditableReport() {
  const exists = getSelectedReport();
  if (exists) {
    return exists;
  }

  const report = makeReport();
  data.reports.unshift(report);
  selectedReportId = report.id;
  data.settings.lastReportId = report.id;
  renderAll();
  return report;
}

function getMathTemplate(type) {
  if (type === "matrix2x2") {
    return String.raw`A = \begin{bmatrix}
1 + 2i & 3 - i \\
-2i & 4 + i
\end{bmatrix}`;
  }
  if (type === "matrix3x3") {
    return String.raw`B = \begin{bmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{bmatrix}`;
  }
  if (type === "integral-single") {
    return "I = \\int_{a}^{b} f(x) \\, dx";
  }
  if (type === "integral-double") {
    return "I = \\iint_{D} f(x, y) \\, dx \\, dy";
  }
  if (type === "derivative-single") {
    return "\\frac{d}{dx} f(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h}";
  }
  if (type === "derivative-partial") {
    return "\\frac{\\partial z}{\\partial x} = \\frac{\\partial}{\\partial x} f(x, y)";
  }
  return "";
}

function getSelectedReport() {
  return data.reports.find((item) => item.id === selectedReportId) || null;
}

function getCategoryName(id) {
  return data.categories.find((item) => item.id === id)?.name || "미분류";
}

function findOrCreateCategoryByName(name) {
  const targetName = (name || "미분류").trim();
  const matched = data.categories.find((item) => item.name.toLowerCase() === targetName.toLowerCase());
  if (matched) {
    return matched.id;
  }

  const category = makeCategory(targetName);
  data.categories.push(category);
  return category.id;
}

function setStatus(message) {
  els.syncStatus.textContent = message;
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(value) {
  return (value || "report")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
