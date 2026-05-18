import { DocumentationContext } from "../../models/types";

interface LangStrings {
  instruction: string;
  sectionGood: string;
  sectionBad: string;
  sectionImprove: string;
  noItems: string;
}

const LANG_STRINGS: Record<string, LangStrings> = {
  Russian: {
    instruction: "Ответ должен быть на русском языке.",
    sectionGood: "## Что сделано хорошо",
    sectionBad: "## Что сделано плохо",
    sectionImprove: "## Что можно улучшить",
    noItems: "- Явных пунктов не обнаружено.",
  },
  English: {
    instruction: "The response must be in English.",
    sectionGood: "## What was done well",
    sectionBad: "## What was done poorly",
    sectionImprove: "## What can be improved",
    noItems: "- No clear points found.",
  },
};

function getLangStrings(responseLanguage: string): LangStrings {
  return LANG_STRINGS[responseLanguage] ?? LANG_STRINGS["Russian"];
}

function buildDocsContextBlock(docsContext: DocumentationContext[]): string {
  if (docsContext.length === 0) {
    return "Контекст документации Context7 не найден или недоступен.";
  }

  return docsContext
    .slice(0, 3)
    .map((doc, index) => {
      const shortContent = doc.content.slice(0, 2500);
      return [
        `### Документация ${index + 1}`,
        `Библиотека: ${doc.libraryName}`,
        `ID: ${doc.libraryId}`,
        "```text",
        shortContent,
        "```",
      ].join("\n");
    })
    .join("\n\n");
}

export function buildDiffOverviewPrompt(
  compactedDiff: string,
  docsContext: DocumentationContext[] = [],
  markdownContext = "",
  responseLanguage = "Russian",
): string {
  const docsBlock = buildDocsContextBlock(docsContext);
  const markdownBlock = markdownContext.trim()
    ? markdownContext
    : "Markdown контекст не был добавлен.";
  const lang = getLangStrings(responseLanguage);

  return `Ты — опытный code reviewer.
Твоя задача: проанализировать git diff и дать краткий, практический обзор изменений.

Входные данные:
- Ниже передан компактный пересказ git diff (staged changes).
- Дополнительно может быть передан контекст актуальной документации из Context7.
- Анализируй только то, что реально видно в компактном diff.
- Не придумывай факты и не делай предположений без оснований в изменениях.
- Если есть контекст Context7, учитывай его как источник актуальных API и best practices.

Требования к ответу:
1) ${lang.instruction}
2) Ответ должен быть в формате Markdown.
3) Ответ должен содержать строго 3 раздела в таком порядке:
   ${lang.sectionGood}
   ${lang.sectionBad}
   ${lang.sectionImprove}
4) В каждом разделе используй маркированный список.
5) Если для раздела нет содержательных пунктов, напиши:
   ${lang.noItems}
6) Пиши конкретно и по делу: отмечай качество кода, читаемость, риски, поддерживаемость, возможные баги.
7) Для рекомендаций давай короткие, применимые шаги.

Компактный diff для анализа:
\`\`\`text
${compactedDiff}
\`\`\`

Контекст Context7:
${docsBlock}

Контекст Markdown файлов:
${markdownBlock}
`;
}

export function buildDiffCompactionPrompt(rawDiff: string): string {
  return buildDiffCompactionPromptWithDocs(rawDiff, []);
}

export function buildDiffCompactionPromptWithDocs(
  rawDiff: string,
  docsContext: DocumentationContext[] = [],
): string {
  const docsBlock = buildDocsContextBlock(docsContext);

  return `Ты — помощник по ревью кода.
Твоя задача: сделать компактное, но точное представление git diff для следующего этапа анализа.

Правила:
1) Никаких домыслов — только факты из diff.
2) Сохраняй технические детали, которые важны для ревью: сигнатуры, условия, обработку ошибок, изменения API, потенциальные риски.
3) Удали шум: длинные неизмененные контексты, повторяющиеся фрагменты, косметические изменения без влияния на поведение.
4) Группируй результат по файлам.
5) Формат строго Markdown:
   ## <file path>
   - Изменения:
   - Риски:
   - Вопросы:
6) Если по файлу нет рисков или вопросов, укажи:
   - Нет явных рисков.
   - Нет открытых вопросов.
7) Держи ответ компактным и практичным.
8) Если дан контекст Context7, учитывай его для корректной интерпретации API и best practices, но не добавляй ничего, чего нет в diff.

Исходный git diff:
\`\`\`diff
${rawDiff}
\`\`\`

Контекст Context7:
${docsBlock}
`;
}
