// components/divisions/DivisionDetails/sections/CommunicationPosts/exportPostsTreeToPdf.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { CommunicationPost, Facility } from '../../../../../types';

interface TreeNode extends CommunicationPost {
  children: TreeNode[];
}

interface ExportOptions {
  divisionName?: string;
  facilitiesByPost?: Map<string, Facility[]>;
}

function esc(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(
  facility: Facility | null,
  roots: TreeNode[],
  options: ExportOptions,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const safe = esc;

  const getRootFacilities = (rootId: string): Facility[] => {
    if (facility) return [facility];
    return options.facilitiesByPost?.get(rootId) ?? [];
  };

  const renderFacilities = (rootId: string): string => {
    const list = getRootFacilities(rootId);
    if (list.length === 0) {
      return `<div style="padding:6px 12px 0;font-size:11px;color:#94a3b8;
                          font-style:italic;text-align:center;">Не привязан к объекту</div>`;
    }
    const items = list.map(f => `
      <div style="display:inline-flex;align-items:center;justify-content:center;
                  gap:4px;max-width:100%;flex-wrap:wrap;line-height:1.3;">
        <span style="color:#0891b2;">&#128205;</span>
        ${list.length > 1
          ? `<span style="font-weight:700;color:#0f172a;">${safe(f.name || 'Объект')}:</span>`
          : ''}
        <span style="color:#64748b;">${safe((f as any).address || 'Адрес не указан')}</span>
      </div>
    `).join('');
    return `<div style="padding:6px 12px 0;font-size:11px;color:#475569;
                        text-align:center;display:flex;flex-direction:column;
                        gap:2px;align-items:center;">${items}</div>`;
  };

  const renderNdrList = (ps: TreeNode): string => {
    if (ps.children.length === 0) {
      return `<div style="padding:5px 6px;font-size:11px;color:#94a3b8;
                          font-style:italic;text-align:center;">&mdash;</div>`;
    }
    return ps.children.map(ndr => `
      <div style="padding:5px 6px;font-size:12px;font-weight:600;color:#0f172a;
                  text-align:center;white-space:nowrap;overflow:hidden;
                  text-overflow:ellipsis;" title="${safe(ndr.name)}">${safe(ndr.name)}</div>
    `).join('');
  };

  const renderCard = (root: TreeNode): string => {
    const psRows = root.children.length === 0
      ? `<div style="border-top:1px solid #e2e8f0;padding:14px 12px;
                     font-size:12px;color:#94a3b8;text-align:center;
                     font-style:italic;">Постов связи нет</div>`
      : root.children.map(ps => `
          <div style="display:flex;border-top:1px solid #e2e8f0;min-height:0;">
            <div style="flex:1 1 0;min-width:0;padding:8px 10px;display:flex;
                        flex-direction:column;gap:1px;justify-content:flex-start;">
              <div style="padding:5px 6px;font-size:12px;font-weight:600;color:#0f172a;
                          text-align:center;white-space:nowrap;overflow:hidden;
                          text-overflow:ellipsis;" title="${safe(ps.name)}">${safe(ps.name)}</div>
            </div>
            <div style="flex:1 1 0;min-width:0;padding:8px 10px;
                        border-left:1px solid #e2e8f0;display:flex;
                        flex-direction:column;gap:1px;">
              ${renderNdrList(ps)}
            </div>
          </div>
        `).join('');

    const descriptionHtml = root.description
      ? `<div style="padding:8px 12px 0;font-size:11px;color:#64748b;line-height:1.35;
                     white-space:pre-wrap;word-break:break-word;text-align:center;">
           ${safe(root.description)}</div>`
      : '';

    return `
      <div style="flex:0 0 calc(33.333% - 8px);min-width:0;box-sizing:border-box;
                  background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
                  box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow:hidden;
                  display:flex;flex-direction:column;">
        <div style="padding:10px 12px;background:linear-gradient(180deg,#f8fafc 0%,#ffffff 100%);
                    border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;
                    font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;
                    text-overflow:ellipsis;" title="${safe(root.name)}">${safe(root.name)}</div>
        ${renderFacilities(String(root.id))}
        ${descriptionHtml}
        <div style="display:flex;flex-direction:column;border-top:1px solid #e2e8f0;
                    margin-top:8px;">
          <div style="display:flex;background:linear-gradient(180deg,#f8fafc 0%,#ffffff 100%);">
            <div style="flex:1 1 0;min-width:0;padding:8px 10px;text-align:center;
                        font-size:10px;font-weight:700;letter-spacing:0.04em;
                        text-transform:uppercase;color:#121212;">Посты связи</div>
            <div style="flex:1 1 0;min-width:0;padding:8px 10px;border-left:1px solid #e2e8f0;
                        text-align:center;font-size:10px;font-weight:700;letter-spacing:0.04em;
                        text-transform:uppercase;color:#121212;">НДР</div>
          </div>
          ${psRows}
        </div>
      </div>
    `;
  };

  const body = roots.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;">
         ${roots.map(renderCard).join('')}</div>`
    : `<div style="padding:24px;text-align:center;color:#94a3b8;
                   font-style:italic;">Постов связи нет</div>`;

  const contextLine = facility
    ? `Объект: <b style="color:#0f172a;">${safe(facility.name)}</b>`
    : (options.divisionName
        ? `Подразделение: <b style="color:#0f172a;">${safe(options.divisionName)}</b>`
        : '');
  const addressLine = facility?.address
    ? `<div style="font-size:11px;color:#64748b;">Адрес: ${safe(facility.address)}</div>`
    : '';
  const divisionLine = facility?.division_name
    ? `<div style="font-size:11px;color:#64748b;">Подразделение: ${safe(facility.division_name)}</div>`
    : '';

  return `
    <div style="width:1200px;padding:32px;background:#ffffff;color:#0f172a;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                box-sizing:border-box;">
      <div style="border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;">
        <div style="font-size:20px;font-weight:700;color:#0f172a;">Посты связи</div>
        ${contextLine ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">${contextLine}</div>` : ''}
        ${addressLine}
        ${divisionLine}
        <div style="font-size:11px;color:#94a3b8;margin-top:6px;">Сформировано: ${dateStr}</div>
      </div>
      ${body}
    </div>
  `;
}

function canvasToPdf(canvas: HTMLCanvasElement, filename: string) {
  // ⬇️ ключевое изменение: альбомная ориентация
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgWidth = pageWidth - margin * 2;
  const scale = imgWidth / canvas.width;
  const pageContentHeight = pageHeight - margin * 2;
  const sliceHeightOnCanvas = pageContentHeight / scale;
  const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightOnCanvas));

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage();
    const startY = i * sliceHeightOnCanvas;
    const endY = Math.min(startY + sliceHeightOnCanvas, canvas.height);
    const sliceH = endY - startY;
    if (sliceH <= 0) continue;
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, startY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    const imgData = pageCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, sliceH * scale);
  }
  pdf.save(filename);
}

export async function exportPostsTreeToPdf(
  facility: Facility | null,
  roots: TreeNode[],
  options: ExportOptions = {},
): Promise<void> {
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed', 'left:-99999px', 'top:0', 'background:#ffffff',
    'z-index:-1', 'pointer-events:none',
  ].join(';');
  container.innerHTML = buildHtml(facility, roots, options);
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, {
      scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
    });
    const baseName = facility?.name || options.divisionName || 'division';
    const safeName = baseName.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60);
    canvasToPdf(canvas, `Посты_связи_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}