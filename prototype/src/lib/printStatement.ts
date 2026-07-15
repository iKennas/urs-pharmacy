export function printHtml(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=800,height=600");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head>
    <meta charset="UTF-8"><title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 24px; color: #14231b; }
      h1 { font-size: 20px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      th, td { border: 1px solid #e4e9e6; padding: 8px; text-align: right; }
      th { background: #f5f7f6; }
      .summary { margin-top: 16px; font-weight: bold; }
    </style>
  </head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
