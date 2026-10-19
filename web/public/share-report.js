/* Web-only report sharing; reports stay local until the teacher chooses to share. */
(() => {
  const dialog = document.getElementById('reportShareDialog');
  const status = document.getElementById('shareStatus');
  let payload = null;

  function openShare(sectionId) {
    try {
      let rows;
      let title;
      if (sectionId === 'report') {
        if (!activeRecord) throw new Error('افتح تقرير الطالب أولًا.');
        renderDetails(activeRecord);
        rows = individualRows(activeRecord);
        title = reportTitle(activeRecord) + ' — ' + activeRecord.studentName;
      } else {
        renderAllReport();
        rows = allRows();
        title = historyReportTitle();
      }
      const source = document.getElementById(sectionId).cloneNode(true);
      source.classList.remove('hidden');
      source.querySelectorAll('.no-print').forEach(element => element.remove());
      const text = title + '\n\n' + rows.map(row => row.join(' | ')).join('\n');
      const styles = document.querySelector('head style').textContent;
      const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' +
        esc(title) + '</title><style>' + styles +
        'body{direction:rtl;font-family:Arial,sans-serif;background:white;padding:16px}.hidden{display:none!important}.card{display:block!important;margin:0;box-shadow:none}.no-print{display:none!important}@page{size:A4;margin:12mm}@media print{body{padding:0}tr{break-inside:avoid}thead{display:table-header-group}}</style></head><body>' +
        source.outerHTML + '</body></html>';
      payload = { title, text, html, sectionId };
      document.getElementById('reportShareName').textContent = title;
      document.getElementById('shareReportText').textContent = text;
      status.textContent = typeof navigator.share === 'function'
        ? 'اختر تطبيق المشاركة أو راجع التقرير أولًا.'
        : 'المشاركة المباشرة غير مدعومة في هذا المتصفح. يمكنك استخدام واتساب أو تنزيل التقرير.';
      if (!dialog.open) dialog.showModal();
    } catch (error) {
      document.getElementById('printFeedback').textContent = 'تعذر تجهيز المشاركة: ' + error.message;
    }
  }

  document.getElementById('print').textContent = 'مشاركة التقرير';
  document.getElementById('allPrint').textContent = 'مشاركة تقرير الصف';
  document.getElementById('print').onclick = () => openShare('report');
  document.getElementById('allPrint').onclick = () => openShare('allReport');
  document.getElementById('shareClose').onclick = () => dialog.close();
  function refreshSharedClassReport() {
    if (dialog.open && payload?.sectionId === 'allReport') openShare('allReport');
  }
  window.addEventListener('storage', refreshSharedClassReport);
  window.addEventListener('focus', refreshSharedClassReport);

  document.getElementById('shareNative').onclick = async () => {
    if (!payload) return;
    if (typeof navigator.share !== 'function') {
      status.textContent = 'هذا المتصفح لا يدعم قائمة مشاركة التطبيقات. استخدم واتساب أو تنزيل التقرير وإرفاقه في تطبيقك.';
      return;
    }
    const button = document.getElementById('shareNative');
    button.disabled = true;
    try {
      const file = new File(['\uFEFF', payload.text], 'تقرير-لغتي.txt', { type: 'text/plain' });
      const data = navigator.canShare && navigator.canShare({ files: [file] })
        ? { title: payload.title, files: [file] }
        : { title: payload.title, text: payload.text };
      await navigator.share(data);
      status.textContent = 'أُغلق خيار المشاركة. تحقق من التطبيق الذي اخترته لإتمام الإرسال.';
    } catch (error) {
      status.textContent = error.name === 'AbortError'
        ? 'أُلغيت المشاركة؛ لم تتغير النتيجة المحفوظة.'
        : 'تعذرت المشاركة المباشرة. استخدم واتساب أو نزّل التقرير وأرفقه بنفسك.';
    } finally {
      button.disabled = false;
    }
  };

  document.getElementById('shareWhatsApp').onclick = () => {
    if (!payload) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(payload.text), '_blank', 'noopener,noreferrer');
    status.textContent = 'يفتح واتساب نص التقرير للمراجعة واختيار المستلم. إن لم يفتح، اسمح بفتح الرابط أو نزّل التقرير وأرفقه بنفسك.';
  };

  document.getElementById('shareDownload').onclick = () => {
    if (!payload) return;
    const blob = new Blob(['\uFEFF', payload.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'تقرير-لغتي.html';
    anchor.textContent = 'تنزيل التقرير المنسق مباشرة';
    anchor.className = 'direct-report-download';
    anchor.style.display = 'block';
    anchor.style.padding = '12px 0';
    const previous = status.querySelector('a');
    if (previous) URL.revokeObjectURL(previous.href);
    status.textContent = 'إذا لم يبدأ التنزيل، اضغط الرابط التالي. افتح الملف بالمتصفح للطباعة أو أرفقه في تطبيق المشاركة.';
    status.appendChild(anchor);
    anchor.click();
  };

  document.getElementById('shareBrowserPrint').onclick = () => {
    dialog.close();
    window.print();
  };
})();

