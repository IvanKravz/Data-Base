// components/divisions/DivisionDetails/sections/CommunicationPosts/exportPostsTreeToSvg.ts
import type { CommunicationPost, Facility } from '../../../../../types';

interface TreeNode extends CommunicationPost {
  children: TreeNode[];
}

interface ExportOptions {
  divisionName?: string;
  facilitiesByPost?: Map<string, Facility[]>;
}

const SVG_W = 1123;  // A4 landscape ~96dpi
const SVG_H = 794;
const PAD = 24;
const GAP = 12;
const COLS = 3;

function esc(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textBlock(
  x: number, y: number, w: number, h: number,
  text: string,
  opts: { size?: number; weight?: number; color?: string; align?: 'start' | 'middle' | 'end' } = {},
): string {
  const { size = 11, weight = 400, color = '#0F172A', align = 'middle' } = opts;
  const tx = align === 'middle' ? x + w / 2 : align === 'end' ? x + w - 4 : x + 4;
  const ty = y + h / 2;
  return `<text x="${tx}" y="${ty}" font-family="Arial, sans-serif" font-size="${size}"
               font-weight="${weight}" fill="${color}" text-anchor="${align}"
               dominant-baseline="central">${esc(text)}</text>`;
}

function rect(
  x: number, y: number, w: number, h: number,
  fill: string = '#ffffff', stroke: string = '#e2e8f0', rx: number = 0,
): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"
                 stroke="${stroke}" stroke-width="1" rx="${rx}" ry="${rx}"/>`;
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                 stroke="#e2e8f0" stroke-width="1"/>`;
}

export function buildSvg(
  facility: Facility | null,
  roots: TreeNode[],
  options: ExportOptions = {},
): string {
  const date = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const safe = esc;

  const getRootFacilities = (rootId: string): Facility[] => {
    if (facility) return [facility];
    return options.facilitiesByPost?.get(rootId) ?? [];
  };

  const contentWidth = SVG_W - PAD * 2;
  const cardW = (contentWidth - (COLS - 1) * GAP) / COLS;

  // Header документа
  const headerH = 76;
  const parts: string[] = [];
  parts.push(rect(0, 0, SVG_W, SVG_H, '#ffffff', '#ffffff', 0));
  parts.push(`<text x="${PAD}" y="${PAD + 16}" font-family="Arial" font-size="20"
                    font-weight="700" fill="#0f172a">Посты связи</text>`);
  let infoY = PAD + 30;
  const infoLine = (txt: string): string => {
    const el = `<text x="${PAD}" y="${infoY}" font-family="Arial" font-size="11"
                      fill="#64748b">${esc(txt)}</text>`;
    infoY += 14;
    return el;
  };
  if (facility) {
    parts.push(infoLine(`Объект: ${facility.name}`));
    if ((facility as any).address) parts.push(infoLine(`Адрес: ${(facility as any).address}`));
    if (facility.division_name) parts.push(infoLine(`Подразделение: ${facility.division_name}`));
  } else if (options.divisionName) {
    parts.push(infoLine(`Подразделение: ${options.divisionName}`));
  }
  parts.push(infoLine(`Сформировано: ${date}`));
  parts.push(line(PAD, PAD + headerH - 20, SVG_W - PAD, PAD + headerH - 20));

  if (roots.length === 0) {
    parts.push(`<text x="${SVG_W / 2}" y="${SVG_H / 2}" font-family="Arial" font-size="14"
                      fill="#94a3b8" font-style="italic" text-anchor="middle">
                  Постов связи нет</text>`);
  } else {
    let cursorX = PAD;
    let cursorY = PAD + headerH;
    let col = 0;
    let rowMaxH = 0;

    for (const root of roots) {
      // Расчёт высоты карточки
      const descriptionH = root.description ? 26 : 0;
      const facilitiesCount = getRootFacilities(String(root.id)).length;
      const facilitiesH = facilitiesCount > 0 ? 22 + (facilitiesCount - 1) * 16 : 18;
      const psCount = Math.max(1, root.children.length);
      const rowH = 26; // высота одной строки ПС/НДР
      const cardH = 30 + facilitiesH + descriptionH + 22 + psCount * rowH + 6;

      const x = cursorX;
      const y = cursorY;
      const w = cardW;
      const h = cardH;

      // Внешняя карточка
      parts.push(rect(x, y, w, h, '#ffffff', '#e2e8f0', 12));

      // Шапка
      parts.push(rect(x, y, w, 30, '#f8fafc', '#e2e8f0', 0));
      parts.push(textBlock(x, y, w, 30, root.name, { size: 12, weight: 700, color: '#0f172a' }));

      // Адрес(а)
      let fY = y + 34;
      const facList = getRootFacilities(String(root.id));
      if (facList.length === 0) {
        parts.push(textBlock(x, fY, w, 16, 'Не привязан к объекту', {
          size: 10, color: '#94a3b8',
        }));
      } else {
        facList.forEach(f => {
          const line = (f as any).address
            ? `📍 ${f.name}: ${(f as any).address}`
            : `📍 ${f.name}: адрес не указан`;
          parts.push(textBlock(x, fY, w, 16, line, { size: 10, color: '#64748b' }));
          fY += 16;
        });
      }

      // Описание
      let descY = fY + 4;
      if (root.description) {
        parts.push(textBlock(x, descY, w, 20, root.description, {
          size: 10, color: '#64748b',
        }));
        descY += 20;
      }

      // Разделитель над колонками
      const colsY = descY + 4;
      parts.push(line(x, colsY, x + w, colsY));

      // Шапка колонок
      const halfW = w / 2;
      parts.push(rect(x, colsY, halfW, 22, '#f8fafc', '#e2e8f0', 0));
      parts.push(rect(x + halfW, colsY, halfW, 22, '#f8fafc', '#e2e8f0', 0));
      parts.push(line(x + halfW, colsY, x + halfW, colsY + 22));
      parts.push(textBlock(x, colsY, halfW, 22, 'Посты связи', {
        size: 9, weight: 700, color: '#121212',
      }));
      parts.push(textBlock(x + halfW, colsY, halfW, 22, 'НДР', {
        size: 9, weight: 700, color: '#121212',
      }));

      // Строки ПС / НДР
      if (root.children.length === 0) {
        parts.push(textBlock(x, colsY + 22, w, 24, 'Постов связи нет', {
          size: 10, color: '#94a3b8',
        }));
      } else {
        root.children.forEach((ps, i) => {
          const rowY = colsY + 22 + i * rowH;
          parts.push(line(x, rowY, x + w, rowY));
          parts.push(textBlock(x, rowY, halfW, rowH, ps.name, {
            size: 11, weight: 600, color: '#0f172a',
          }));
          parts.push(line(x + halfW, rowY, x + halfW, rowY + rowH));

          if (ps.children.length === 0) {
            parts.push(textBlock(x + halfW, rowY, halfW, rowH, '—', {
              size: 11, color: '#94a3b8',
            }));
          } else {
            const ndrText = ps.children.map(n => n.name).join(' · ');
            parts.push(textBlock(x + halfW, rowY, halfW, rowH, ndrText, {
              size: 11, weight: 600, color: '#0f172a',
            }));
          }
        });
      }

      // Переход к следующему слоту
      rowMaxH = Math.max(rowMaxH, h);
      col++;
      if (col >= COLS) {
        col = 0;
        cursorX = PAD;
        cursorY += rowMaxH + GAP;
        rowMaxH = 0;
      } else {
        cursorX += cardW + GAP;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
         width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}">
      <title>Посты связи</title>
      ${parts.join('\n')}
    </svg>`;
}

export function exportPostsTreeToSvg(
  facility: Facility | null,
  roots: TreeNode[],
  options: ExportOptions = {},
): void {
  const svg = buildSvg(facility, roots, options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = facility?.name || options.divisionName || 'division';
  const safeName = baseName.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60);
  a.download = `Посты_связи_${safeName}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}