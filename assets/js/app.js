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

function renderMarkdownAndMath(source, container) {
  const html = md.render(source || "");
  const clean = window.DOMPurify.sanitize(html);
  container.innerHTML = clean;

  if (window.renderMathInElement) {
    window.renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
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

let data = normalizeData(loadData());
let currentView = "dashboard";
let selectedReportId = data.reports[0]?.id || null;
let debounceTimer = null;
let isPreviewOpen = true;
let isFocusMode = false;

const els = {
  navButtons: Array.from(document.querySelectorAll("[data-view-target]")),
  views: Array.from(document.querySelectorAll(".main-view")),
  syncStatus: document.getElementById("sync-status"),
  statsCategories: document.getElementById("stats-categories"),
  statsReports: document.getElementById("stats-reports"),
  statsUpdated: document.getElementById("stats-updated"),
  recentList: document.getElementById("recent-list"),
  categoryInput: document.getElementById("category-input"),
  categoryAddBtn: document.getElementById("category-add-btn"),
  categoryList: document.getElementById("category-list"),
  reportSearch: document.getElementById("report-search"),
  reportCategoryFilter: document.getElementById("report-category-filter"),
  reportList: document.getElementById("report-list"),
  reportCreateBtn: document.getElementById("report-create-btn"),
  editorTitle: document.getElementById("editor-title"),
  editorCategory: document.getElementById("editor-category"),
  editorTags: document.getElementById("editor-tags"),
  editorContent: document.getElementById("editor-content"),
  editorUpdated: document.getElementById("editor-updated"),
  editorSaveBtn: document.getElementById("editor-save-btn"),
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
  preview: document.getElementById("preview"),
  backupExportBtn: document.getElementById("backup-export-btn"),
  backupImportInput: document.getElementById("backup-import-input"),
  backupMessage: document.getElementById("backup-message")
};

init();

function init() {
  bindNav();
  bindCategoryActions();
  bindReportListActions();
  bindEditorActions();
  bindBackupActions();

  if (!selectedReportId && data.reports.length > 0) {
    selectedReportId = data.reports[0].id;
  }

  renderAll();
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
      saveAndRender("카테고리 삭제 완료");
    }
  });
}

function bindReportListActions() {
  els.reportCreateBtn.addEventListener("click", () => {
    const report = makeReport();
    data.reports.unshift(report);
    selectedReportId = report.id;
    currentView = "editor";
    saveAndRender("리포트 생성 완료");
  });

  els.reportSearch.addEventListener("input", () => renderReportList());
  els.reportCategoryFilter.addEventListener("change", () => renderReportList());

  els.reportList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const reportId = target.dataset.reportId || target.closest("[data-report-id]")?.dataset.reportId;
    if (!reportId) {
      return;
    }

    selectedReportId = reportId;
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

  els.editorSaveBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) {
      return;
    }

    report.updatedAt = new Date().toISOString();
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
    event.target.value = "";
    saveAndRender("Markdown 가져오기 완료");
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
    const stamp = new Date().toISOString().slice(0, 10);
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
      data = normalizeData(importJson(text));
      selectedReportId = data.reports[0]?.id || null;
      saveData(data);
      renderAll();
      els.backupMessage.textContent = "복원 완료: 데이터가 반영되었습니다.";
      setStatus("백업 복원 완료");
    } catch (error) {
      els.backupMessage.textContent = `복원 실패: ${error.message}`;
    } finally {
      event.target.value = "";
    }
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
  els.categoryList.innerHTML = data.categories
    .map((category) => {
      const linkedCount = data.reports.filter((r) => r.categoryId === category.id).length;
      const isFixed = category.id === getUncategorizedId();
      return `
        <div class="list-item">
          <strong>${escapeHtml(category.name)}</strong>
          <span class="badge">리포트 ${linkedCount}개</span>
          <div class="list-actions">
            <button class="ghost" data-action="edit-category" data-category-id="${category.id}" ${isFixed ? "disabled" : ""}>이름 변경</button>
            <button class="danger" data-action="delete-category" data-category-id="${category.id}" ${isFixed ? "disabled" : ""}>삭제</button>
          </div>
        </div>
      `;
    })
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
  const categoryFilter = els.reportCategoryFilter.value || "all";

  const filtered = data.reports
    .filter((report) => {
      const passCategory = categoryFilter === "all" || report.categoryId === categoryFilter;
      const hay = `${report.title}\n${report.content}`.toLowerCase();
      const passKeyword = !keyword || hay.includes(keyword);
      return passCategory && passKeyword;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
          <span class="muted">${escapeHtml(getCategoryName(report.categoryId))}</span>
          <span class="muted">${new Date(report.updatedAt).toLocaleString("ko-KR")}</span>
          <div class="list-actions">
            <button class="ghost" data-report-id="${report.id}">편집</button>
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
      els.editorStats.textContent = "0자 · 0단어 · 0분";
    }
    els.preview.innerHTML = "<p class='muted'>리포트를 선택하거나 새로 생성해 주세요.</p>";
    return;
  }

  els.editorTitle.value = report.title;
  els.editorCategory.value = report.categoryId;
  els.editorTags.value = report.tags.join(", ");
  els.editorContent.value = report.content;
  updateEditorMeta(report);
  renderPreview(report.content);
  renderEditorStats(report.content);
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
  const wordCount = text ? text.split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 220));
  els.editorStats.textContent = `${charCount}자 · ${wordCount}단어 · ${readMinutes}분`;
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
    before = "$$\n";
    after = "\n$$";
    fallback = "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}";
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
