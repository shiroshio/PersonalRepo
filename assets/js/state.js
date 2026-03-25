const UNCATEGORIZED_ID = "cat-uncategorized";

export function normalizeData(rawData) {
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

export function makeCategory(name) {
  return {
    id: `cat-${crypto.randomUUID()}`,
    name: name.trim(),
    createdAt: new Date().toISOString()
  };
}

export function makeReport() {
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

export function getUncategorizedId() {
  return UNCATEGORIZED_ID;
}
