const md = window.markdownit({
  html: false,
  linkify: true,
  breaks: true
});

export function renderMarkdownAndMath(source, container) {
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

export function reportToMarkdown(report, categoryName) {
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

export function markdownToDraft(text) {
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
