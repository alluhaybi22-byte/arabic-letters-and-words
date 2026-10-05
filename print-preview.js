// Local, paginated preview of the same A4 PDF saved by the main process.
(() => {
  const $ = id => document.getElementById(id);
  const status = $('printStatus'), printButton = $('doPrint'), pdfButton = $('savePdf');
  const printer = $('printer'), copies = $('copies'), pages = $('pagePreview');
  let ready = false, busy = false, pdf, pageNumber = 1;
  const browserPreview = !window.printActions?.getDocument;
  function controls() {
    printButton.disabled = busy || !ready || (!browserPreview && !printer.value);
    pdfButton.disabled = busy || !ready;
    printer.disabled = copies.disabled = busy;
    $('retryPreview').disabled = busy;
    $('prevPage').disabled = busy || !pdf || pageNumber <= 1;
    $('nextPage').disabled = busy || !pdf || pageNumber >= pdf.numPages;
  }
  async function renderPage(number) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({scale: 1.5});
    const sheet = document.createElement('figure'); sheet.className = 'pdf-page';
    const caption = document.createElement('figcaption'); caption.textContent = 'صفحة ' + number + ' من ' + pdf.numPages;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    canvas.setAttribute('aria-label', caption.textContent);
    sheet.append(caption, canvas);
    // Keep just one page bitmap in memory, even for long class reports.
    await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
    pages.replaceChildren(sheet);
    pageNumber = number;
    $('pageCount').textContent = caption.textContent;
    pages.dataset.currentPage = String(number);
    page.cleanup();
  }
  async function refreshPrinters() {
    const selected = printer.value;
    const printers = await window.printActions.getPrinters();
    printer.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = printers.length ? 'اختر الطابعة' : 'لا توجد طابعة — يمكنك حفظ PDF';
    printer.append(placeholder);
    for (const item of printers) {
      const option = document.createElement('option');
      option.value = item.name; option.textContent = item.displayName || item.name;
      printer.append(option);
    }
    printer.value = printers.some(item => item.name === selected) ? selected : (printers.find(item => item.isDefault)?.name || '');
    controls();
  }
  async function initialize() {
    busy = true; ready = false; controls();
    status.textContent = 'جارٍ تجهيز صفحات المعاينة...';
    $('retryPreview').hidden = true;
    try {
      if (browserPreview) {
        $('reportSource').classList.add('browser-preview');
        ready = true;
        printButton.disabled = pdfButton.disabled = false;
        status.textContent = 'معاينة التقرير — اختر الطباعة لفتح إعدادات المتصفح.';
        return;
      }
      await document.fonts.ready;
      const bytes = await window.printActions.getDocument();
      const lib = await import('./vendor/pdf.min.mjs');
      lib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', document.baseURI).href;
      await pdf?.destroy();
      pdf = await lib.getDocument({data: new Uint8Array(bytes),isEvalSupported:false}).promise;
      pages.replaceChildren();
      await renderPage(1);
      pages.dataset.pageCount = String(pdf.numPages);
      ready = true;
      try { await refreshPrinters(); }
      catch { $('retryPreview').hidden = false; status.textContent = 'ظهرت الصفحات، لكن تعذر قراءة الطابعات. يمكنك حفظ PDF أو إعادة المحاولة.'; return; }
      status.textContent = 'المعاينة جاهزة: ' + pdf.numPages + ' صفحات. اختر الطابعة ثم اضغط طباعة.';
    } catch (error) {
      status.textContent = 'تعذر تجهيز المعاينة: ' + error.message;
      $('retryPreview').hidden = false;
    } finally { busy = false; controls(); }
  }
  async function runAction(savePdf) {
    if (busy || !ready) return;
    const count = Number(copies.value);
    if (!savePdf && !browserPreview && (!printer.value || !Number.isInteger(count) || count < 1 || count > 99)) {
      status.textContent = 'اختر الطابعة وأدخل عدد نسخ بين 1 و99.'; return;
    }
    busy = true; controls();
    status.textContent = savePdf ? 'جارٍ حفظ PDF...' : 'جارٍ إرسال التقرير إلى الطابعة المحددة...';
    try {
      if (!window.printActions) { window.print(); return; }
      const result = await (savePdf ? window.printActions.savePdf() : window.printActions.print({deviceName: printer.value, copies: count}));
      status.textContent = result.pending ? result.reason : result.saved ? 'حُفظ ملف PDF.' : result.success ? 'أُرسلت المهمة إلى الطابعة.' :
        result.canceled || result.reason === 'Print job canceled' ? 'أُلغي الطلب.' :
        'تعذر إكمال الطلب: ' + (result.error || result.reason || 'تحقق من الطابعة.');
      if (!savePdf && !result.success && !result.pending) await refreshPrinters();
    } catch (error) { status.textContent = 'تعذر إكمال الطلب: ' + error.message; }
    finally { busy = false; controls(); }
  }
  printButton.onclick = () => runAction(false);
  pdfButton.onclick = () => runAction(true);
  printer.onchange = controls;
  $('retryPreview').onclick = initialize;
  async function movePage(step) {
    if (busy || !pdf) return;
    const target = pageNumber + step;
    if (target < 1 || target > pdf.numPages) return;
    busy = true; controls();
    try { await renderPage(target); }
    catch (error) { status.textContent = 'تعذر عرض الصفحة: ' + error.message; }
    finally { busy = false; controls(); }
  }
  $('prevPage').onclick = () => movePage(-1);
  $('nextPage').onclick = () => movePage(1);
  window.addEventListener('beforeunload', () => { pdf?.destroy(); });
  initialize();
})();
