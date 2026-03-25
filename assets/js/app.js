import { loadData, saveData, exportJson, importJson } from "./storage.js";
import { normalizeData, makeCategory, makeReport, getUncategorizedId } from "./state.js";
import { renderMarkdownAndMath, reportToMarkdown, markdownToDraft } from "./markdown.js";

let data = normalizeData(loadData());
let currentView = "dashboard";
let selectedReportId = data.reports[0]?.id || null;
let debounceTimer = null;

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
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.viewTarget;
      const titleLabel = button.textContent.replace(/[^가-힣a-zA-Z\s\/]/g, '').trim();
      document.getElementById('current-view-title').textContent = titleLabel;
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
    els.preview.innerHTML = "<p class='muted'>리포트를 선택하거나 새로 생성해 주세요.</p>";
    return;
  }

  els.editorTitle.value = report.title;
  els.editorCategory.value = report.categoryId;
  els.editorTags.value = report.tags.join(", ");
  els.editorContent.value = report.content;
  updateEditorMeta(report);
  renderPreview(report.content);
}

function updateEditorMeta(report) {
  els.editorUpdated.textContent = `최근 수정: ${new Date(report.updatedAt).toLocaleString("ko-KR")}`;
}

function renderPreview(content) {
  renderMarkdownAndMath(content, els.preview);
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
