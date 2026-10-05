
    const L = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
    const LEVEL_ONE_LETTERS = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ','و','ي'];
    const H = ['َ','ُ','ِ'];
    const P = ['initial','final','middle'];
    const WORDS = [
      {word:'بَابٌ', difficulty:'سهل', tanween:'ضم'},
      {word:'قَلَمٌ', difficulty:'سهل', tanween:'ضم'},
      {word:'بَيْتٌ', difficulty:'سهل', tanween:'ضم'},
      {word:'وَلَدٌ', difficulty:'سهل', tanween:'ضم'},
      {word:'دَارًا', difficulty:'سهل', tanween:'فتح'},
      {word:'جَبَلًا', difficulty:'سهل', tanween:'فتح'},
      {word:'سَمَكًا', difficulty:'سهل', tanween:'فتح'},
      {word:'أَسَدٍ', difficulty:'سهل', tanween:'كسر'},
      {word:'شَمْسٍ', difficulty:'سهل', tanween:'كسر'},
      {word:'بِنْتٍ', difficulty:'سهل', tanween:'كسر'},
      {word:'كِتَابٌ', difficulty:'متوسط', tanween:'ضم'},
      {word:'حِصَانٌ', difficulty:'متوسط', tanween:'ضم'},
      {word:'مَدْرَسَةٌ', difficulty:'متوسط', tanween:'ضم'},
      {word:'مِفْتَاحًا', difficulty:'متوسط', tanween:'فتح'},
      {word:'حَدِيقَةً', difficulty:'متوسط', tanween:'فتح'},
      {word:'عَمُودًا', difficulty:'متوسط', tanween:'فتح'},
      {word:'نَافِذَةً', difficulty:'متوسط', tanween:'فتح'},
      {word:'فِرَاشٍ', difficulty:'متوسط', tanween:'كسر'},
      {word:'رَسُولٍ', difficulty:'متوسط', tanween:'كسر'},
      {word:'طَائِرٍ', difficulty:'متوسط', tanween:'كسر'},
      {word:'عُصْفُورٌ', difficulty:'صعب', tanween:'ضم'},
      {word:'بُرْتُقَالٌ', difficulty:'صعب', tanween:'ضم'},
      {word:'سُلَحْفَاةٌ', difficulty:'صعب', tanween:'ضم'},
      {word:'مُهَنْدِسًا', difficulty:'صعب', tanween:'فتح'},
      {word:'مَكْتَبَةً', difficulty:'صعب', tanween:'فتح'},
      {word:'تِلْمِيذًا', difficulty:'صعب', tanween:'فتح'},
      {word:'مِظَلَّةٍ', difficulty:'صعب', tanween:'كسر'},
      {word:'مُعَلِّمٍ', difficulty:'صعب', tanween:'كسر'},
      {word:'مِصْبَاحٍ', difficulty:'صعب', tanween:'كسر'},
      {word:'اِسْتِرَاحَةٍ', difficulty:'صعب', tanween:'كسر'}
    ];
    // الكلمات التالية مطابقة حرفيًا لنصوص القراءة المرفقة، 3–4 حروف أصلية.
    const FATHA_WORDS = ['سَأَلَ','طَلَبَ','حَدَثَ','شَكَرَ','جَلَسَ','بَدَأَ','قَالَ','عَادَ','دَعَا','عَاشَ','كَانَ','وَسَطَ'];
    const VOCALIZED_WORDS = ['بَدْرٌ','عَصًا','قَمْحٍ','عَامٍ','اسْمٌ','جَمِيلٌ','نُورَةُ','طَارِقٌ','صِلَةُ','مُذِيعٍ','يَوْمًا','شَيْئًا'];
    // جملتان قصيرتان من كل نص قرائي أو قصة إثرائية في «نصوص القراءة».
    const SENTENCE_GROUPS = [
      {source:'صِلَةُ الرَّحِمِ', sentences:['إِنَّهُ رَأْيٌ جَمِيلٌ.', 'أَنَا مُتَشَوِّقَةٌ لِهَذَا الْيَوْمِ.']},
      {source:'عُذْرًا يَا جَدِّي', sentences:['رَأَى الْمُعَلِّمُ فَوَّازًا يَجْلِسُ حَزِينًا.', 'لَيْتَ جَدِّي يُسَامِحُنِي!']},
      {source:'الصَّدِيقَانِ', sentences:['نَدِمَ عَمَّارٌ عَلَى تَسَرُّعِهِ.', 'اعْتَذَرَ عَمَّارٌ إِلَى خَالِدٍ.']},
      {source:'الْجَارُ الصَّغِيرُ', sentences:['اتَّصَلَ فَوَّازٌ بِالدِّفَاعِ الْمَدَنِيِّ.', 'شَكَرَ الْجَارُ فَوَّازًا عَلَى حُسْنِ تَصَرُّفِهِ.']},
      {source:'مَدِينَتَانِ مُقَدَّسَتَانِ', sentences:['فِي وَطَنِي الْحَبِيبِ مَدِينَتَانِ مُقَدَّسَتَانِ.', 'فِي مَكَّةَ الْمُكَرَّمَةِ الْمَسْجِدُ الْحَرَامُ.']},
      {source:'عَلَمُ بِلَادِي', sentences:['عَلَمُ بِلَادِي لَوْنُهُ أَخْضَرُ.', 'أَنَا أُحِبُّ عَلَمَ بِلَادِي وَأَعْتَزُّ بِهِ.']},
      {source:'رِحْلَةُ حَبَّةِ قَمْحٍ', sentences:['أَنَا حَبَّةُ قَمْحٍ صَفْرَاءُ.', 'يَسْقِينِي بِالْمَاءِ فَتَنْمُو جُذُورِي.']},
      {source:'مَنْ أَنَا؟', sentences:['ثِمَارِي لَذِيذَةُ الطَّعْمِ.', 'جِذْعِي سَمِيكٌ.']},
      {source:'الْفَتَى الشُجَاعُ', sentences:['فَخَرَجَ النَّاسُ فَرِحِينَ.', 'انْطَلَقَ عَبْدُالْعَزِيزِ مَعَ رِجَالِهِ إِلَى الرِّيَاضِ.']},
      {source:'الْحَمَامَتَانِ', sentences:['كَانَ هُنَاكَ حَمَامَةٌ لَطِيفَةٌ.', 'سَقَطَتْ حَبَّةُ الْقَمْحِ مِنْ فَمِهَا.']},
      {source:'آدَابُ الِاسْتِئْذَانِ', sentences:['هَذَا خَطَأٌ مِنِّي.', 'سَأَعْتَذِرُ إِلَيْهِ.']}
    ];
    const STORAGE_KEY = 'lughaty-oral-diagnostic.records';
    const STORAGE_VERSION = 2;
    const TEACHER_STORAGE_KEY = 'lughaty-oral-diagnostic.teacher-name';
    const PRINCIPAL_STORAGE_KEY = 'lughaty-oral-diagnostic.principal-name';
    const SCHOOL_STORAGE_KEY = 'lughaty-oral-diagnostic.school-info';
    const DRAFT_KEY = 'lughaty-oral-diagnostic.draft';
    const ROSTER_STORAGE_KEY = 'lughaty-oral-diagnostic.roster';
    const ROSTER_VERSION = 3;
    const TEST_SESSIONS_KEY = 'lughaty-oral-diagnostic.test-sessions';
    let currentTestSession = null;
    let historyClassKey = null, historyTestKey = null, historyAll = false;
    let q = [], pos = 0, res = [], activeRecord = null, assessmentStartedAt = 0, timerId = null, pendingRosterImport = null, assessmentDuration = 0;
    let activeRosterImport = null;
    const $ = x => document.getElementById(x);
    const show = x => $(x).classList.remove('hidden');
    const hide = x => $(x).classList.add('hidden');
    function goHome() {
      activeRosterImport?.abort(RosterImport.abortError());
      stopTimer();
      ['test','report','history','schoolPage','allReport','studentProfile','importReview'].forEach(hide);
      show('setup');
      hide('homeButton');
      updateRosterMessage();
      setActiveNav('navRoster');
    }
    function shuffle(items) {
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const makeId = prefix => prefix + '-' + (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));
    const levelName = value => ({one:'المستوى الأول — الحروف بلا حركات',two:'المستوى الثاني — مواضع الحروف',three:'المستوى الثالث — عشوائي موسّع',fatha:'كلمات نصوص القراءة — بالفتحة فقط',vocalized:'كلمات نصوص القراءة — بالحركات والتنوين',four:'المستوى الرابع — الكلمات بالحركات والتنوين والمدود',five:'المستوى الخامس — جمل قصيرة مشكولة'})[value] || value;

    function formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    }

    function elapsedSeconds() {
      return assessmentStartedAt ? Math.floor((Date.now() - assessmentStartedAt) / 1000) : 0;
    }

    function updateTimer() {
      $('timer').textContent = formatDuration(elapsedSeconds());
    }

    function startTimer() {
      if (assessmentStartedAt) return;
      assessmentStartedAt = Date.now();
      updateTimer();
      timerId = window.setInterval(updateTimer, 1000);
    }

    function stopTimer() {
      if (timerId !== null) window.clearInterval(timerId);
      timerId = null;
    }

    function getTestSessions() {
      try { const stored = JSON.parse(localStorage.getItem(TEST_SESSIONS_KEY) || '{}'); return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}; } catch { return {}; }
    }
    function saveTestSession(session) {
      const sessions = getTestSessions(); sessions[session.id] = session;
      localStorage.setItem(TEST_SESSIONS_KEY,JSON.stringify(sessions));
    }
    function prepareTestSession(continueSession, reference) {
      const roster = getRoster(), student = currentStudent(roster);
      const selected = student && student.name === $('student').value.trim() ? roster : null;
      const classId = selected?.id || null;
      const saved = reference?.testSessionId ? getTestSessions()[reference.testSessionId] : currentTestSession;
      if (continueSession && saved && saved.rosterId === classId && saved.level === $('level').value && saved.wordSession === $('wordSession').value) {
        currentTestSession = saved;
      } else {
        const startedAt = new Date().toISOString();
        const number = Object.values(getTestSessions()).filter(session => session.rosterId === classId && testDateKey(session.startedAt) === testDateKey(startedAt)).length + 1;
        currentTestSession = {id:makeId('test'),number,startedAt,rosterId:classId,rosterName:selected?.name || '',level:$('level').value,wordSession:$('wordSession').value,absentStudentIds:{}};
      }
      saveTestSession(currentTestSession);
    }

    function saveDraft() {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({q,pos,res,assessmentStartedAt,testSession:currentTestSession,studentId:currentStudent()?.id || null,student:$('student').value.trim(),guardian:$('guardian').value.trim(),level:$('level').value,wordSession:$('wordSession').value,rosterId:getRoster()?.id || null, savedAt:Date.now()}));
      updateDraftBanner();
    }
    function clearDraft() { localStorage.removeItem(DRAFT_KEY); updateDraftBanner(); }
    function readDraft() { try { const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)); return draft && Array.isArray(draft.q) && Array.isArray(draft.res) && draft.q.length ? draft : null; } catch { return null; } }
    function updateDraftBanner() { $('draftBanner').classList.toggle('hidden', !readDraft()); }
    function resumeDraft() {
      const draft = readDraft(); if (!draft) return;
      if (draft.rosterId) {
        const store = getRosterStore();
        const roster = store.rosters.find(item => item.id === draft.rosterId);
        if (roster) {
          store.activeRosterId = roster.id;
          const index = roster.students.findIndex(student => draft.studentId ? student.id === draft.studentId : student.name === draft.student);
          if (index >= 0) roster.currentIndex = index;
          saveRosterStore(store);
        }
      }
      currentTestSession = draft.testSession || {id:makeId('test'),startedAt:new Date(draft.savedAt || Date.now()).toISOString(),rosterId:draft.rosterId || null,rosterName:getRoster()?.name || '',level:draft.level,wordSession:draft.wordSession || 'full',absentStudentIds:{}};
      saveTestSession(currentTestSession);
      ({q,pos,res,assessmentStartedAt} = draft);
      $('student').value = draft.student; $('guardian').value = draft.guardian || '';
      $('level').value = draft.level; $('wordSession').value = draft.wordSession || 'full';
      $('wordSessionWrap').classList.toggle('hidden', draft.level !== 'four');
      syncLevelChoices();
      activeRecord = null; stopTimer();
      if (assessmentStartedAt) timerId = window.setInterval(updateTimer, 1000);
      hide('setup'); show('test'); show('homeButton');
      $('studentName').textContent = 'الطالب: ' + draft.student;
      $('testLevel').textContent = levelName(draft.level);
      render(); updateTimer();
    }

    function form(l, p, h) {
      return p === 'initial' ? l + h + 'ـ' : p === 'middle' ? 'ـ' + l + h + 'ـ' : p === 'final' ? 'ـ' + l + h : l + h;
    }

    function getStore() {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (stored && Array.isArray(stored.records)) {
          const migrated = {...stored, version:STORAGE_VERSION, records:stored.records.map(record => ({...record, studentId:record.studentId || null}))};
          if (stored.version !== STORAGE_VERSION) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      } catch (error) {
        console.error('Unable to read assessment history.', error);
      }
      return { version: STORAGE_VERSION, records: [] };
    }

    function saveStore(store) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }

    function restoreTeacherName() {
      $('teacher').value = localStorage.getItem(TEACHER_STORAGE_KEY) || '';
      $('principal').value = localStorage.getItem(PRINCIPAL_STORAGE_KEY) || '';
      try {
        const saved = JSON.parse(localStorage.getItem(SCHOOL_STORAGE_KEY) || '{}');
        $('schoolName').value = saved.name || '';
      } catch { /* البيانات القديمة للمعلم والمدير تبقى قابلة للقراءة */ }
      updateSchoolPreview();
    }

    function saveTeacherName() {
      localStorage.setItem(TEACHER_STORAGE_KEY, $('teacher').value.trim());
      localStorage.setItem(PRINCIPAL_STORAGE_KEY, $('principal').value.trim());
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(SCHOOL_STORAGE_KEY) || '{}'); } catch {}
      localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify({...saved,name:$('schoolName').value.trim()}));
      updateSchoolPreview();
    }

    function updateSchoolPreview() {
      $('schoolPreviewName').textContent = $('schoolName').value.trim() || '—';
      $('schoolPreviewPrincipal').textContent = 'مدير المدرسة: ' + ($('principal').value.trim() || '—');
    }

    function setActiveNav(id) {
      ['navRoster','navHistory','navSettings'].forEach(item => $(item).classList.toggle('is-active', item === id));
    }

    function showSchoolPage() {
      stopTimer();
      ['setup','test','report','history','allReport','studentProfile','importReview'].forEach(hide);
      show('schoolPage'); show('homeButton'); setActiveNav('navSettings');
      updateSchoolPreview();
    }

    function updateStartSummary() {
      $('startSummary').textContent = 'الطالب: ' + ($('student').value.trim() || '—') + ' · المستوى: ' + levelName($('level').value);
    }

    function saveGuardianName() {
      const roster = getRoster();
      const student = currentStudent(roster);
      if (student && student.name === $('student').value.trim()) {
        student.guardianName = $('guardian').value.trim();
        saveRoster(roster);
      }
    }

    function getRosterStore() {
      try {
        const stored = JSON.parse(localStorage.getItem(ROSTER_STORAGE_KEY));
        if (stored && Array.isArray(stored.rosters)) {
          const migratedStore = {...stored, version:ROSTER_VERSION, rosters:stored.rosters.map(normalizeRoster)};
          if (stored.version !== ROSTER_VERSION || JSON.stringify(stored.rosters) !== JSON.stringify(migratedStore.rosters)) localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(migratedStore));
          return migratedStore;
        }
        if (stored && stored.version === 1 && Array.isArray(stored.names)) {
          const migratedRoster = normalizeRoster({...stored, id:makeId('roster'), name:stored.sourceName ? stored.sourceName.replace(/\.[^.]+$/, '') : 'الصف السابق', sourceType:'docx'});
          const migratedStore = {version:ROSTER_VERSION, activeRosterId:migratedRoster.id, rosters:[migratedRoster]};
          localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(migratedStore));
          return migratedStore;
        }
      } catch (error) {
        console.error('Unable to read student rosters.', error);
      }
      return {version:ROSTER_VERSION, activeRosterId:null, rosters:[]};
    }

    function saveRosterStore(store) {
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(store));
    }

    function getRoster() {
      const store = getRosterStore();
      const roster = store.rosters.find(item => item.id === store.activeRosterId) || null;
      if (roster) {
        roster.absentStudentIds = roster.absentStudentIds || {};
        roster.currentIndex = Math.max(0, Math.min(Number.isInteger(roster.currentIndex) ? roster.currentIndex : 0, Math.max(0, roster.names.length - 1)));
      }
      return roster;
    }

    function normalizeRoster(roster) {
      const students = Array.isArray(roster.students) && roster.students.length
        ? roster.students.map(student => ({id:student.id || makeId('student'), name:cleanRosterName(student.name || ''), guardianName:student.guardianName || ''})).filter(student => student.name)
        : (roster.names || []).map(name => ({id:makeId('student'), name:cleanRosterName(name)})).filter(student => student.name);
      const legacyAbsences = roster.absentNames || {};
      return {...roster, students, names:students.map(student => student.name), absentStudentIds:roster.absentStudentIds || Object.fromEntries(students.filter(student => legacyAbsences[student.name]).map(student => [student.id, true]))};
    }

    function currentStudent(roster = getRoster()) {
      return roster && roster.students ? roster.students[roster.currentIndex] || null : null;
    }

    function saveRoster(roster) {
      const store = getRosterStore();
      const index = store.rosters.findIndex(item => item.id === roster.id);
      if (index === -1) store.rosters.push(roster);
      else store.rosters[index] = roster;
      store.activeRosterId = roster.id;
      saveRosterStore(store);
    }

    function updateRosterSelector() {
      const store = getRosterStore();
      $('savedRosters').innerHTML = store.rosters.length
        ? store.rosters.map(roster => '<option value="' + esc(roster.id) + '"' + (roster.id === store.activeRosterId ? ' selected' : '') + '>' + esc(roster.name) + ' (' + roster.students.length + ' طالبًا)</option>').join('')
        : '<option value="">لا يوجد صف محفوظ</option>';
    }

    function updateRosterMessage() {
      updateRosterSelector();
      const roster = getRoster();
      if (!roster || !roster.students.length) {
        $('rosterMessage').textContent = 'سمِّ الصف ثم ارفع ملف Word أو Excel أو PDF؛ راجع الأسماء وأولياء الأمور قبل الحفظ.';
        $('rosterPickerWrap').classList.add('hidden');
        updateStartSummary();
        return;
      }
      const currentIndex = roster.currentIndex;
      const selectedStudent = currentStudent(roster);
      $('student').value = selectedStudent.name;
      $('guardian').value = selectedStudent.guardianName || '';
      $('rosterName').value = roster.name;
      $('rosterPickerWrap').classList.remove('hidden');
      $('rosterStudent').innerHTML = roster.students.map((student, index) => '<option value="' + index + '"' + (index === currentIndex ? ' selected' : '') + '>' + (index + 1) + ' — ' + esc(student.name) + (roster.absentStudentIds[student.id] ? ' (غائب)' : '') + '</option>').join('');
      $('rosterMessage').textContent = 'الصف النشط: ' + roster.name + ' — ' + roster.students.length + ' طالبًا. الطالب الحالي: ' + (currentIndex + 1) + ' من ' + roster.students.length + ' — ' + selectedStudent.name + '.';
      updateStartSummary();
    }

    function cleanRosterName(value) {
      return String(value ?? '').normalize('NFKC').replace(/[\u00a0\u200e\u200f\u200b\u200c\u200d\ufeff]/g, ' ')
        .replace(/ـ/g, '').replace(/^\s*[0-9٠-٩۰-۹]+\s*[.)،\-–—]?\s*/, '').replace(/\s+/g, ' ').trim();
    }
    const studentHeader = value => /^(?:اسم\s*(?:الطالب|الطالبة|التلميذ|التلميذة)(?:\s*\/\s*\S+)?(?:\s*(?:الكامل|رباعيا|الرباعي))?|أسماء\s*(?:الطلاب|الطالبات)|الاسم(?:\s*(?:الكامل|رباعي|الرباعي))?(?:\s*لل(?:طالب|طالبة))?)$/.test(cleanRosterName(value).replace(/[\u064B-\u065F:：]/g,''));
    const guardianHeader = value => /(?:ولي\s*الأمر|اسم\s*(?:الأب|الوالد))/.test(cleanRosterName(value));
    function isStudentName(value) {
      const name = cleanRosterName(value);
      if (name.length < 3 || name.length > 160 || !/^[\p{Script=Arabic}\p{M}\s]+$/u.test(name) || /[٠-٩۰-۹]/.test(name)) return false;
      if (studentHeader(name) || guardianHeader(name)) return false;
      if (/^اسم\s*(?:المعلم|المعلمة|المدير|المديرة|المدرسة)(?:\s|$)/.test(name)) return false;
      // Reject headings as complete words; names such as عبدالمجيد والعامري remain valid.
      if (/(?:^|\s)(?:وزارة|إدارة|مدرسة|المملكة|السعودية|الصف|الفصل|الدراسي|كشف|صف|رصد|نتيجة|المادة|المجموع|الدرجة|الرقم|التوقيع|غياب|حضور|الاختبار|تقويم|مشاركة|واجبات|متقن|ممتاز|ضعيف|جيد|ناجح|راسب|المدير)(?:\s|$)/.test(name)) return false;
      return !/^(?:رقم|م|الطالب|الطالبة|التلميذ|التلميذة|اسم|الحالة|ملاحظات|العام الدراسي)$/.test(name);
    }
    function namesFromText(text) {
      return String(text).split(/\r?\n/).flatMap(line => line.split(/[\t|،؛]+|\s{3,}|\s+[0-9٠-٩۰-۹]+\s+/)
        .map(cleanRosterName).filter(isStudentName));
    }
    function parseReviewRows(text) {
      return text.split(/\r?\n/).filter(line => line.trim()).map(line => {
        const [name, guardianName = ''] = line.split('\t');
        return {name:cleanRosterName(name), guardianName:cleanRosterName(guardianName)};
      }).filter(student => isStudentName(student.name));
    }
    function updateImportCount() {
      const lines = $('reviewNames').value.split(/\r?\n/).filter(line => line.trim());
      const rows = parseReviewRows($('reviewNames').value);
      const invalid = lines.length - rows.length;
      $('importCount').textContent = 'عدد الطلاب: ' + rows.length + '. ' + (invalid ? 'يوجد ' + invalid + ' سطر غير صالح؛ صححه قبل الاعتماد. ' : '') +
        'قارن العدد بالصف الأصلي. يحتفظ البرنامج بالأسماء المتطابقة كطلاب مستقلين.';
    }
    function studentsFromRows(rows) {
      const result = [];
      let columns = [], guardians = [];
      for (const cells of rows) {
        const headers = cells.map((cell,index) => studentHeader(cell) ? index : -1).filter(index => index >= 0);
        if (headers.length) {
          columns = headers;
          guardians = cells.map((cell,index) => guardianHeader(cell) ? index : -1).filter(index => index >= 0);
          continue;
        }
        if (columns.length) {
          columns.forEach((column, index) => {
            const names = namesFromText(cells[column] || '');
            const guardian = guardians.length === columns.length ? cleanRosterName(cells[guardians[index]] || '') : '';
            names.forEach(name => result.push({name,guardianName:guardian}));
          });
        } else {
          // Tables without headers can have several student lists side by side.
          cells.forEach(cell => namesFromText(cell || '').forEach(name => result.push({name,guardianName:''})));
        }
      }
      return result;
    }

    const xmlText = value => String(value).replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (_,number,entity) => {
      if (number) return String.fromCodePoint(number[0].toLowerCase() === 'x' ? parseInt(number.slice(1),16) : Number(number));
      return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[entity.toLowerCase()];
    });
    async function unzipOffice(file,signal) {
      return RosterImport.unzipOffice(file,signal);
    }
    const wordCells = xml => [...xml.matchAll(/<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g)].map(cell =>
      [...cell[1].matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].map(p =>
        xmlText([...p[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m => m[1]).join(''))).join('\n'));
    async function importDocxRoster(file,signal) {
      const xml=(await unzipOffice(file,signal)).get('word/document.xml');
      if(!xml) throw new Error('لا يوجد محتوى Word في الأرشيف.');
      const fromTable = [...xml.matchAll(/<w:tbl(?:\s[^>]*)?>([\s\S]*?)<\/w:tbl>/g)].flatMap(table => {
        const rows = [...table[1].matchAll(/<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g)].map(row => wordCells(row[1]));
        return studentsFromRows(rows);
      });
      const outside=xml.replace(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g,'');
      const fromParagraph=[...outside.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].flatMap(p => namesFromText(xmlText([...p[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>m[1]).join(''))).map(name => ({name,guardianName:''})));
      return [...fromTable,...fromParagraph];
    }

    async function importXlsxRoster(file,signal) {
      const entries=await unzipOffice(file,signal);
      const shared=[...(entries.get('xl/sharedStrings.xml') || '').matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(si => xmlText([...si[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(t=>t[1]).join('')));
      return [...entries.entries()].filter(([name])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name)).flatMap(([,xml]) => {
        const rows=[...xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].map(row => {
          const cells=[];
          for(const match of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
            const ref=match[1].match(/\br="([A-Z]+)\d+"/)?.[1];if(!ref)continue;
            let index=0;for(const ch of ref)index=index*26+ch.charCodeAt(0)-64;index--;
            if(!Number.isSafeInteger(index) || index<0 || index>=RosterImport.LIMITS.spreadsheetColumns) throw RosterImport.limitError();
            const raw=match[2] || '', value=raw.match(/<v>([\s\S]*?)<\/v>/)?.[1] || '';
            cells[index]=/\bt="s"/.test(match[1]) ? shared[Number(value)] || '' : /\bt="inlineStr"/.test(match[1]) ? xmlText([...raw.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(t=>t[1]).join('')) : xmlText(value);
          }
          return cells;
        });
        return studentsFromRows(rows);
      });
    }

    async function loadPdfLibrary() {
      if (!globalThis.pdfjsLib) {
        globalThis.pdfjsLib = await import('./vendor/pdf.min.mjs');
        globalThis.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', document.baseURI).href;
      }
      return globalThis.pdfjsLib;
    }

    function pdfRosterPage(items, previousLayout = null) {
      const rows = RosterImport.groupPdfRows(items);
      let layout = previousLayout;
      const names = [];
      let expected = 0;
      rows.sort((a,b) => b.y-a.y).forEach(row => {
        const blocks = [];
        row.items.sort((a,b) => b.x-a.x).forEach(item => {
          const previous = blocks[blocks.length-1];
          const numeric = /^[0-9٠-٩۰-۹]+[.)،]?$/.test(item.text.trim());
          if (!previous || numeric || previous.numeric || previous.left-(item.x+item.width) > 20) {
            blocks.push({text:item.text,left:item.x,right:item.x+item.width,numeric});
          } else {
            previous.text += ' ' + item.text;
            previous.left = item.x;
          }
        });
        const headers = blocks.filter(block => studentHeader(block.text));
        if (headers.length) {
          if(blocks.length>RosterImport.LIMITS.pdfColumns) throw RosterImport.limitError();
          layout = blocks.map(block => ({center:(block.left+block.right)/2,student:studentHeader(block.text)}));
          return;
        }
        if (blocks.some(block => block.numeric)) expected++;
        if (layout) {
          const cells = layout.map(() => []);
          blocks.filter(block => !block.numeric).forEach(block => {
            const center = (block.left+block.right)/2;
            const distances = layout.map(header => Math.abs(header.center-center));
            cells[distances.indexOf(Math.min(...distances))].push(block.text);
          });
          layout.forEach((header,index) => {
            if (header.student) names.push(...namesFromText(cells[index].join(' ')));
          });
        } else {
          blocks.filter(block => !block.numeric).forEach(block => names.push(...namesFromText(block.text)));
        }
      });
      return {names,expected,layout};
    }

    async function importPdfRoster(file, signal) {
      const budget=new AbortController();
      const cancel=()=>budget.abort(signal.reason || RosterImport.abortError());
      if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
      const timer=setTimeout(()=>{
        const error=new Error('انتهت مهلة استيراد PDF. قسّم الكشف إلى ملفات أصغر ثم أعد المحاولة.');
        error.code='PDF_TIMEOUT';budget.abort(error);
      },RosterImport.LIMITS.pdfTimeoutMs);
      const run=task=>RosterImport.withAbort(task,budget.signal);
      let loadingTask,pdf,worker,renderTask;
      const stop=()=>{
        loadingTask?.destroy().catch(()=>{});
        worker?.terminate().catch(()=>{});
        renderTask?.cancel();
      };
      budget.signal.addEventListener('abort',stop,{once:true});
      try {
      const pdfjsLib = await run(loadPdfLibrary);
      const data=await run(()=>RosterImport.readFile(file));
      loadingTask=pdfjsLib.getDocument({data,isEvalSupported:false});
      pdf=await run(()=>loadingTask.promise);
      if(pdf.numPages>RosterImport.LIMITS.pdfPages) throw RosterImport.limitError();
      const extractedByPage = [], expectedByPage = [];
      let layout = null,totalItems=0,totalCharacters=0;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page=await run(()=>pdf.getPage(pageNumber));
        const items=await RosterImport.pdfTextItems(page,budget.signal);
        totalItems+=items.length;
        totalCharacters+=items.reduce((sum,item)=>sum+(typeof item.str==='string'?item.str.length:0),0);
        if(totalItems>RosterImport.LIMITS.pdfItemsTotal)throw RosterImport.limitError();
        if(totalCharacters>RosterImport.LIMITS.pdfCharsTotal)throw RosterImport.limitError();
        const result = pdfRosterPage(items,layout);
        layout = result.layout;
        extractedByPage.push(result.names);
        expectedByPage.push(result.expected);
        page.cleanup();
        await run(()=>new Promise(resolve=>setTimeout(resolve,0)));
      }
      const textNames = extractedByPage.flat();
      const needsOcr = extractedByPage.map((names, index) => !names.length || expectedByPage[index] > names.length);
      if (!needsOcr.some(Boolean)) return textNames;
      if (!window.Tesseract) return textNames;
      const creation=Tesseract.createWorker('ara', 1, {
        workerPath:'./vendor/worker.min.js',
        corePath:'./vendor',
        langPath:'./vendor'
      });
      creation.then(created=>{if(budget.signal.aborted)created.terminate().catch(()=>{});}).catch(()=>{});
      worker=await run(()=>creation);
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (!needsOcr[pageNumber - 1]) continue;
          $('rosterMessage').textContent = 'جارٍ تحويل صفحة ' + pageNumber + ' من ' + pdf.numPages + ' إلى نص؛ قد يستغرق ذلك قليلًا للكشوف المصوّرة...';
          const page = await run(()=>pdf.getPage(pageNumber));
          const viewport = page.getViewport({scale:2});
          if(!Number.isFinite(viewport.width*viewport.height) || viewport.width<=0 || viewport.height<=0 || Math.ceil(viewport.width)*Math.ceil(viewport.height)>RosterImport.LIMITS.canvasPixels) throw RosterImport.limitError();
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          renderTask=page.render({canvasContext:canvas.getContext('2d'), viewport});
          await run(()=>renderTask.promise);
          renderTask=null;
          const result = await run(()=>worker.recognize(canvas));
          const recognized = namesFromText(result.data.text);
          if (recognized.length > extractedByPage[pageNumber - 1].length) extractedByPage[pageNumber - 1] = recognized;
          canvas.width=canvas.height=0;page.cleanup();
          await run(()=>new Promise(resolve=>setTimeout(resolve,0)));
        }
      return extractedByPage.flat();
      } finally {
        clearTimeout(timer);signal?.removeEventListener('abort',cancel);
        budget.signal.removeEventListener('abort',stop);
        renderTask?.cancel();
        worker?.terminate().catch(()=>{});
        loadingTask?.destroy().catch(()=>{});
      }
    }

    function classNameKey(value) {
      return String(value ?? '').normalize('NFKC').replace(/[\u00a0\u200e\u200f\u200b\u200c\u200d\ufeff]/g,' ').replace(/ـ/g,'').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآٱ]/g,'ا')
        .replace(/[٠-٩]/g,char => String(char.charCodeAt(0)-1632)).replace(/[–—_\-]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
    }
    function importClassName(file) { return $('rosterName').value.trim() || file.name.replace(/\.[^.]+$/,''); }
    function classNameCollision(name,file) {
      const matches = getRosterStore().rosters.filter(roster => classNameKey(roster.name) === classNameKey(name));
      if (matches.length === 1 && matches[0].sourceName === file?.name) return null;
      return matches[0] || null;
    }
    function updateClassNameHint() {
      const file = pendingRosterImport?.file || $('rosterFile').files?.[0];
      const name = pendingRosterImport ? $('reviewClassName').value : $('rosterName').value;
      const duplicate = getRosterStore().rosters.some(roster => classNameKey(roster.name) === classNameKey(name));
      const invalid = Boolean(name.trim() && classNameCollision(name,file));
      const hint = pendingRosterImport ? $('reviewClassHint') : $('classNameHint');
      hint.textContent = duplicate ? 'اسم الصف مسجل مسبقًا. أعد رفع ملفه نفسه لتحديثه، أو استخدم اسم صف مختلف.' : 'استخدم اسمًا مميزًا لكل صف وفصل، مثل الصف الثاني — أ.';
      hint.classList.toggle('invalid',invalid);
    }

    function saveImportedRoster(file, rows) {
      const name = importClassName(file);
      if (classNameCollision(name,file)) throw new Error('اسم الصف «' + name + '» مستخدم مسبقًا. اختر اسمًا مختلفًا، أو أعد رفع الملف الأصلي لتحديث الصف نفسه.');
      const store = getRosterStore();
      const existing = store.rosters.find(roster => classNameKey(roster.name) === classNameKey(name) && roster.sourceName === file.name);
      const previous = new Map();
      (existing?.students || []).forEach(student => {
        const key = studentNameKey(student.name);
        if (!previous.has(key)) previous.set(key, []);
        previous.get(key).push(student);
      });
      const students = rows.map(student => {
        const prior = previous.get(studentNameKey(student.name))?.shift();
        return {id:prior?.id || makeId('student'),name:student.name,guardianName:student.guardianName || prior?.guardianName || ''};
      });
      const roster = {...(existing || {}),id:existing?.id || makeId('roster'),name,sourceName:file.name,
        sourceType:file.name.toLowerCase().split('.').pop(),students,names:students.map(student => student.name),
        currentIndex:existing?.currentIndex || 0,absentStudentIds:existing?.absentStudentIds || {},createdAt:existing?.createdAt || new Date().toISOString()};
      if (existing) store.rosters[store.rosters.indexOf(existing)] = roster;
      else store.rosters.push(roster);
      store.activeRosterId=roster.id; saveRosterStore(store); updateRosterMessage();
    }

    async function importRoster(file) {
      if (!file) return;
      if(activeRosterImport)return;
      if (classNameCollision(importClassName(file),file)) {
        $('rosterMessage').textContent = 'اسم الصف مستخدم مسبقًا. اختر اسمًا مختلفًا أو أعد رفع الملف الأصلي لتحديثه.';
        $('rosterFile').value = '';
        $('rosterName').focus(); updateClassNameHint(); return;
      }
      $('rosterMessage').textContent = 'جارٍ قراءة الصف واستخراج أسماء الطلاب...';
      const controller=new AbortController();activeRosterImport=controller;
      const startWasDisabled=$('start').disabled;
      $('importRoster').disabled=$('rosterFile').disabled=$('start').disabled=true;
      $('cancelRosterImport').classList.remove('hidden');
      try {
        const extension = file.name.toLowerCase().split('.').pop();
        if(!['pdf','xlsx','docx'].includes(extension)) throw new Error('استخدم ملف Word أو Excel أو PDF مدعومًا.');
        const rows = await RosterImport.withAbort(async()=>extension === 'pdf' ? (await importPdfRoster(file,controller.signal)).map(name => ({name,guardianName:''})) : extension === 'xlsx' ? await importXlsxRoster(file,controller.signal) : await importDocxRoster(file,controller.signal),controller.signal);
        if (!rows.length) {
          $('rosterMessage').textContent = file.name.toLowerCase().endsWith('.pdf')
            ? 'لم يتم العثور على أسماء نصية في ملف PDF. استخدم صفًا قابلًا لتحديد النص أو حوّله إلى Word.'
            : 'لم يتم العثور على أسماء في الصف. تأكد من أن الملف بصيغة DOCX وأن كل اسم في سطر أو خلية مستقلة.';
          return;
        }
        pendingRosterImport = {file, rows};
        $('reviewClassName').value = importClassName(file); updateClassNameHint();
        $('reviewNames').value = rows.map(student => student.name + (student.guardianName ? '\t' + student.guardianName : '')).join('\n');
        updateImportCount();
        hide('setup');
        show('importReview'); show('homeButton');
      } catch (error) {
        if(error.name==='AbortError' || error.code==='PDF_TIMEOUT') {
          $('rosterMessage').textContent=error.message;
          return;
        }
        console.error('Unable to import student roster.', error);
        if(error.message?.includes('حدود الأمان')) {
          $('rosterMessage').textContent=error.message;
          return;
        }
        $('rosterMessage').textContent = file.name.toLowerCase().endsWith('.pdf')
          ? 'تعذر قراءة صف PDF. تأكد من أن الملف غير محمي ويحتوي على نص قابل للنسخ.'
          : 'تعذر قراءة الصف. استخدم ملف Word أو Excel غير محمي.';
      } finally {
        activeRosterImport=null;
        $('importRoster').disabled=$('rosterFile').disabled=false;
        $('start').disabled=startWasDisabled;
        $('cancelRosterImport').classList.add('hidden');
      }
    }

    function shortWordSelection() {
      // Five words at each difficulty and five of each tanween type.
      const quotas = {
        'سهل': { 'ضم': 2, 'فتح': 2, 'كسر': 1 },
        'متوسط': { 'ضم': 1, 'فتح': 2, 'كسر': 2 },
        'صعب': { 'ضم': 2, 'فتح': 1, 'كسر': 2 }
      };
      return Object.entries(quotas).flatMap(([difficulty, types]) =>
        Object.entries(types).flatMap(([tanween, count]) =>
          shuffle(WORDS.filter(entry => entry.difficulty === difficulty && entry.tanween === tanween)).slice(0, count)
        )
      );
    }

    function build() {
      const level = $('level').value, letters = shuffle(L);
      if (level === 'one') return shuffle(LEVEL_ONE_LETTERS).map(l => ({letter:l, position:'isolated', diacritic:''}));
      if (level === 'two') return letters.map((l, i) => ({letter:l, position:P[i % P.length], diacritic:H[Math.floor(Math.random() * H.length)]}));
      if (level === 'three') return shuffle([...L, ...L]).map(l => ({letter:l, position:P[Math.floor(Math.random() * P.length)], diacritic:H[Math.floor(Math.random() * H.length)]}));
      if (level === 'fatha' || level === 'vocalized') return shuffle(level === 'fatha' ? FATHA_WORDS : VOCALIZED_WORDS).map(word => ({word,item:word}));
      if (level === 'four') {
        const words = $('wordSession').value === 'short' ? shortWordSelection() : WORDS;
        return shuffle(words).map(({word, difficulty, tanween}) => ({word, item:word, difficulty, tanween}));
      }
      if (level === 'five') return SENTENCE_GROUPS.flatMap(({source, sentences}) => sentences.map(sentence => ({sentence, source, item:sentence})));
      return [];
    }

    function begin(continueSession = false) {
      if (!$('student').value.trim()) return $('student').focus();
      if (readDraft() && $('test').classList.contains('hidden') && !window.confirm('يوجد اختبار محفوظ لم يكتمل. بدء اختبار جديد سيستبدل المسودة. هل تريد المتابعة؟')) return;
      prepareTestSession(continueSession === true,activeRecord);
      saveTeacherName();
      saveGuardianName();
      q = build(); pos = 0; res = Array(q.length).fill(null); activeRecord = null; assessmentStartedAt = 0; assessmentDuration = 0; stopTimer();
      hide('setup'); hide('report'); hide('history'); hide('schoolPage'); hide('allReport'); hide('studentProfile'); show('test'); show('homeButton');
      const roster = getRoster();
      const selectedStudent = currentStudent(roster);
      const rosterPosition = selectedStudent && selectedStudent.name === $('student').value.trim() ? ' — ' + (roster.currentIndex + 1) + ' من ' + roster.students.length : '';
      $('studentName').textContent = 'الطالب: ' + $('student').value.trim() + rosterPosition;
      $('testLevel').textContent = levelName($('level').value);
      saveDraft();
      render(); updateTimer();
    }

    function render() {
      const item = q[pos];
      $('counter').textContent = 'البند ' + (pos + 1) + ' من ' + q.length;
      $('previousItem').disabled = pos === 0;
      $('nextItem').disabled = pos === q.length - 1;
      $('letter').textContent = item.sentence || item.word || form(item.letter, item.position, item.diacritic);
      $('letter').classList.toggle('word-item', Boolean(item.word));
      $('letter').classList.toggle('sentence-item', Boolean(item.sentence));
      $('sentenceSource').textContent = item.source ? 'من نص: ' + item.source : '';
      $('sentenceSource').classList.toggle('hidden', !item.source);
      $('progress').style.width = (res.filter(Boolean).length / q.length * 100) + '%';
      $('last').textContent = res[pos] ? 'تقييم هذا البند: ' + res[pos].score + ' — يمكنك تغييره.' : 'هذا البند لم يُقيّم بعد. تم تقييم ' + res.filter(Boolean).length + ' من ' + q.length + '.';
    }

    function mark(score) {
      if ($('test').classList.contains('hidden') || pos >= q.length || !['✓','✕','↻'].includes(score)) return;
      if (!assessmentStartedAt) startTimer();
      const item=q[pos];
      res[pos]={letter:item.letter || '',word:item.word || '',sentence:item.sentence || '',source:item.source || '',position:item.position || '',diacritic:item.diacritic || '',difficulty:item.difficulty || '',tanween:item.tanween || '',errorType:'',item:item.sentence || item.word || form(item.letter,item.position,item.diacritic),score};
      if (res.every(Boolean)) return completeAssessment();
      const next=res.findIndex((entry,index) => index>pos && !entry);
      pos=next>=0 ? next : res.findIndex(entry => !entry);
      saveDraft(); render();
    }
    function previousItem() { if (pos>0) {pos--;saveDraft();render();} }
    function nextItem() { if (pos<q.length-1) {pos++;saveDraft();render();} }

    function advanceRoster() {
      const roster = getRoster();
      if (!roster || roster.currentIndex >= roster.students.length - 1) return false;
      roster.currentIndex++;
      saveRoster(roster);
      $('student').value = currentStudent(roster).name;
      $('guardian').value = currentStudent(roster).guardianName || '';
      return true;
    }

    function skipAbsentStudent() {
      const roster = getRoster();
      const selectedStudent = currentStudent(roster);
      if (!roster || !selectedStudent || selectedStudent.name !== $('student').value.trim()) {
        alert('يمكن تخطي الغائب عند اختبار طالب محدد من صف الأسماء.');
        return;
      }
      if (currentTestSession) {
        currentTestSession.absentStudentIds ||= {};
        currentTestSession.absentStudentIds[selectedStudent.id] = true;
        saveTestSession(currentTestSession);
      }
      roster.absentStudentIds[selectedStudent.id] = true;
      saveRoster(roster);
      stopTimer();
      clearDraft();
      if (advanceRoster()) {
        begin(true);
      } else {
        hide('test');
        show('setup');
        updateRosterMessage();
        alert('تم تسجيل غياب الطالب. اكتمل صف الأسماء.');
      }
    }

    function createRecord() {
      const assessed = res.filter(Boolean);
      const correct = assessed.filter(x => x.score === '✓').length;
      const incorrect = assessed.filter(x => x.score === '✕');
      const retries = assessed.filter(x => x.score === '↻').length;
      const occurrence = {};
      const incorrectLetters = incorrect.filter(x => x.letter).map(x => {
        occurrence[x.letter] = (occurrence[x.letter] || 0) + 1;
        return {letter:x.letter, occurrence:occurrence[x.letter]};
      });
      const incorrectWords = incorrect.filter(x => x.word).map(x => x.word);
      const roster = getRoster();
      return {
        id: globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2),
        studentName: $('student').value.trim(),
        studentId: currentStudent(roster) && currentStudent(roster).name === $('student').value.trim() ? currentStudent(roster).id : makeId('student'),
        teacherName: $('teacher').value.trim(),
        principalName: $('principal').value.trim(),
        schoolName: $('schoolName').value.trim(),
        guardianName: $('guardian').value.trim(),
        rosterId: roster && currentStudent(roster) && currentStudent(roster).name === $('student').value.trim() ? roster.id : null,
        rosterName: roster && currentStudent(roster) && currentStudent(roster).name === $('student').value.trim() ? roster.name : '',
        testSessionId:currentTestSession?.id || null,
        testSessionStartedAt:currentTestSession?.startedAt || null,
        completedAt: new Date().toISOString(),
        level: $('level').value,
        levelLabel: levelName($('level').value) + ($('level').value === 'four' ? ($('wordSession').value === 'short' ? ' — قصير (15 كلمة)' : ' — كامل (30 كلمة)') : '') + (assessed.length < q.length ? ' — تقييم جزئي (' + assessed.length + ' من ' + q.length + ')' : ''),
        plannedTotal: q.length,
        items: assessed.map(x => ({...x})),
        summary: { total:assessed.length, correct, incorrect:incorrect.length, retries, percentage:assessed.length ? Math.round(correct / assessed.length * 100) : 0 },
        durationSeconds: assessmentDuration,
        incorrectLetters,
        incorrectWords
      };
    }

    function completeAssessment() {
      if (!res.some(Boolean) || activeRecord) return;
      assessmentDuration = elapsedSeconds(); stopTimer();
      const record = createRecord();
      const store = getStore();
      store.records.unshift(record);
      saveStore(store); clearDraft();
      renderReport(record);
    }

    function formatDate(value) {
      return new Intl.DateTimeFormat('ar', {dateStyle:'medium', timeStyle:'short'}).format(new Date(value));
    }

    function wrongText(record) {
      if (record.level === 'five') return record.items.filter(x => x.sentence && x.score === '✕').map(x => x.sentence).join('، ') || 'لا توجد جمل تحتاج إلى تدريب.';
      if (record.incorrectWords && record.incorrectWords.length) return record.incorrectWords.join('، ');
      if (['four','fatha','vocalized'].includes(record.level)) return 'لا توجد كلمات تحتاج إلى تدريب.';
      return record.incorrectLetters.length ? record.incorrectLetters.map(x => x.letter + (x.occurrence > 1 ? ' (تكرار ' + x.occurrence + ')' : '')).join('، ') : 'لا توجد حروف مخطأ بها.';
    }

    function wordScoreSummary(record, field, labels) {
      return labels.map(label => {
        const items = record.items.filter(item => item[field] === label);
        return items.length ? label + ': ' + items.filter(item => item.score === '✓').length + '/' + items.length : '';
      }).filter(Boolean).join('، ');
    }

    function wordErrorSummary(record) {
      const errors = record.items.filter(item => item.word && item.score === '✕');
      if (!errors.length) return 'لم تُسجَّل أخطاء قراءة.';
      const categories = ['التنوين', 'المد', 'الشدة', 'الحركات', 'الحروف', 'الهمزة', 'أخرى'];
      const labeled = categories.map(category => {
        const count = errors.filter(item => item.errorType === category).length;
        return count ? category + ': ' + count : '';
      }).filter(Boolean);
      const unspecified = errors.filter(item => !item.errorType).length;
      if (unspecified) labeled.push('لم يُحدَّد النوع: ' + unspecified);
      return labeled.join('، ');
    }

    function retryWordsText(record) {
      return record.items.filter(item => item.word && item.score === '↻').map(item => item.word).join('، ');
    }

    function assessmentStatus(record) {
      return record.plannedTotal > record.summary.total
        ? 'تقييم جزئي (' + record.summary.total + ' من ' + record.plannedTotal + ')'
        : 'تم الاختبار';
    }

    function reportTitle(record) {
      return record.level === 'five' ? 'تقرير تشخيص قراءة الجمل' : ['four','fatha','vocalized'].includes(record.level) ? 'تقرير تشخيص قراءة الكلمات' : 'تقرير الاختبار التشخيصي الشفوي';
    }

    function wordBreakdownHtml(record) {
      if (record.level !== 'four' || !record.items.some(item => item.difficulty)) return '';
      return '<div class="result"><strong>القراءة حسب الصعوبة:</strong> ' +
        esc(wordScoreSummary(record, 'difficulty', ['سهل', 'متوسط', 'صعب'])) +
        '<br><strong>القراءة حسب التنوين:</strong> ' +
        esc(wordScoreSummary(record, 'tanween', ['ضم', 'فتح', 'كسر'])) +
        '<br><strong>أنواع أخطاء القراءة:</strong> ' + esc(wordErrorSummary(record)) +
        (retryWordsText(record) ? '<br><strong>كلمات مؤجلة لإعادة التقييم:</strong> ' + esc(retryWordsText(record)) : '') + '</div>';
    }

    function mistakeLabel(record) {
      return record.level === 'five' ? 'الجمل التي تحتاج إلى تدريب' : ['four','fatha','vocalized'].includes(record.level) ? 'الكلمات التي تحتاج إلى تدريب' : 'الحروف التي تحتاج إلى تدريب';
    }

    function renderDetails(record) {
      const format = $('printFormat').value;
      const summary = record.summary;
      $('details').innerHTML = format === 'brief'
        ? '<strong>ملخص التقييم:</strong> عدد البنود: ' + esc(summary.total) + ' &nbsp; ✓ ' + esc(summary.correct) + ' &nbsp; ✕ ' + esc(summary.incorrect) + ' &nbsp; ↻ ' + summary.retries
        : '<strong>تفصيل التقييم:</strong><table class="detail-table"><thead><tr><th>البند</th><th>النتيجة</th><th>الملاحظة</th></tr></thead><tbody>' + record.items.map(item => {
          const outcome = item.score === '✓' ? 'متقن' : item.score === '✕' ? 'يحتاج تدريبًا' : 'إعادة لاحقًا';
          const note = item.score === '✓' ? 'أداء جيد' : item.score === '✕' ? 'يحتاج إلى تدريب ومتابعة' : 'يعاد التقييم لاحقًا';
          return '<tr><td>' + esc(item.item) + '</td><td>' + esc(item.score) + ' ' + outcome + '</td><td>' + note + (item.source ? ' — ' + esc(item.source) : '') + (item.difficulty ? ' — ' + esc(item.difficulty) + '، تنوين ' + esc(item.tanween) : '') + (item.errorType ? ' — نوع الصعوبة: ' + esc(item.errorType) : '') + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function renderReport(record) {
      activeRecord = record;
      stopTimer();
      hide('test'); hide('setup'); hide('history'); hide('schoolPage'); hide('allReport'); hide('studentProfile'); show('report'); show('homeButton');
      const s = record.summary;
      $('reportScore').textContent = s.percentage + '%';
      document.querySelector('#report .report-banner h2').textContent = reportTitle(record);
      document.querySelector('#report .report-score span').textContent = record.plannedTotal > s.total ? 'نتيجة البنود المقيمة' : 'النتيجة النهائية';
      $('summary').innerHTML = (record.schoolName || $('schoolName').value.trim() ? '<div class="report-school"><strong>' + esc(record.schoolName || $('schoolName').value.trim()) + '</strong>' + '</div>' : '') + '<section class="report-info"><div><span class="report-label">اسم الطالب</span>' + esc(record.studentName) + '</div><div><span class="report-label">تاريخ التقييم</span>' + esc(formatDate(record.completedAt)) + '</div></section>' +
        '<section class="report-stats"><div class="report-stat good"><span>متقن</span><b>' + esc(s.correct) + '</b></div><div class="report-stat bad"><span>يحتاج تدريبًا</span><b>' + esc(s.incorrect) + '</b></div><div class="report-stat wait"><span>إعادة لاحقًا</span><b>' + esc(s.retries) + '</b></div><div class="report-stat time"><span>المدة · الصحيح/دقيقة</span><b>' + formatDuration(record.durationSeconds || 0) + ' · ' + (record.durationSeconds ? (s.correct * 60 / record.durationSeconds).toFixed(1) : '—') + '</b></div></section>' +
        '<div class="result"><strong>المستوى:</strong> ' + esc(record.levelLabel) + ' &nbsp; | &nbsp; <strong>عدد البنود:</strong> ' + esc(s.total) + (record.rosterName ? ' &nbsp; | &nbsp; <strong>الصف:</strong> ' + esc(record.rosterName) : '') + '</div>' + wordBreakdownHtml(record);
      $('signatures').innerHTML = [['المعلم',record.teacherName],['مدير المدرسة',record.principalName],['ولي الأمر',record.guardianName]].map(([title,name]) => '<div><strong>' + title + '</strong><span>' + esc(name || '________________') + '</span><small>التوقيع: ________________</small></div>').join('');
      $('wrongLetters').innerHTML = '<strong>' + mistakeLabel(record) + ':</strong> ' + esc(wrongText(record));
      const roster = getRoster();
      const selectedStudent = currentStudent(roster);
      const hasNextStudent = roster && roster.currentIndex < roster.students.length - 1 && selectedStudent && selectedStudent.id === record.studentId;
      const hasPreviousStudent = roster && roster.currentIndex > 0 && selectedStudent && selectedStudent.id === record.studentId;
      $('previousStudent').classList.toggle('hidden', !hasPreviousStudent);
      $('nextStudent').classList.toggle('hidden', !hasNextStudent);
      renderDetails(record);
    }

    async function saveDoc(rows, name, title) {
      const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>@page{size:A4;margin:12mm}body,table{font-family:Arial,sans-serif;direction:rtl}h1{text-align:center;color:#123b5d}table{border-collapse:collapse;width:100%}td{border:1px solid #aaa;padding:7px;vertical-align:top}tr{page-break-inside:avoid}</style></head><body><h1>'+esc(title)+'</h1><table>'+rows.map(cells=>'<tr>'+cells.map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</table></body></html>';
      const blob=new Blob(['\ufeff',html],{type:'application/msword;charset=utf-8'});
      const anchor=globalThis.document.createElement('a');
      anchor.href=URL.createObjectURL(blob);anchor.download=name.replace(/\.docx$/,'.doc');anchor.click();
      window.setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);
    }

    function individualRows(record) {
      return [
        ['الطالب', record.studentName],
        ['المدرسة', record.schoolName || $('schoolName').value.trim() || 'غير محددة'],
        ['الصف', record.rosterName || 'غير محدد'],
        ['وقت التقييم', formatDate(record.completedAt)],
        ['مدة الاختبار', formatDuration(record.durationSeconds || 0)],
        ['المستوى', record.levelLabel],
        ['حالة التقييم', assessmentStatus(record)],
        ['البنود المقيمة', record.summary.total + ' من ' + (record.plannedTotal || record.summary.total)],
        ['النتيجة', record.summary.percentage + '%'],
        ['متقن', record.summary.correct],
        ['يحتاج تدريبًا', record.summary.incorrect],
        ['إعادة لاحقًا', record.summary.retries],
        [mistakeLabel(record), wrongText(record)],
        ...(record.level === 'four' && record.items.some(item => item.difficulty) ? [
          ['القراءة حسب الصعوبة', wordScoreSummary(record, 'difficulty', ['سهل', 'متوسط', 'صعب'])],
          ['القراءة حسب التنوين', wordScoreSummary(record, 'tanween', ['ضم', 'فتح', 'كسر'])],
          ['أنواع أخطاء القراءة', wordErrorSummary(record)]
        ] : []),
        ...(record.level === 'four' && retryWordsText(record) ? [['كلمات مؤجلة لإعادة التقييم', retryWordsText(record)]] : []),
        ['البند', 'التقييم'],
        ...record.items.map(x => [x.item + (x.source ? ' (' + x.source + ')' : '') + (x.difficulty ? ' (' + x.difficulty + '، تنوين ' + x.tanween + ')' : ''), x.score + (x.errorType ? ' — ' + x.errorType : '')]),
        ['توقيع المعلم', record.teacherName || '________________'],
        ['توقيع مدير المدرسة', record.principalName || '________________'],
        ['توقيع ولي الأمر', record.guardianName || '________________']
      ];
    }

    function historyClassFor(item) {
      if (item.rosterId) return 'class:' + item.rosterId;
      const rosters = getRosterStore().rosters;
      if (item.rosterName) {
        const matches = rosters.filter(roster => classNameKey(roster.name) === classNameKey(item.rosterName));
        return matches.length === 1 ? 'class:' + matches[0].id : 'archive:' + classNameKey(item.rosterName);
      }
      if (item.studentName) {
        const matches = rosters.filter(roster => recordStudentId(item,roster));
        if (matches.length === 1) return 'class:' + matches[0].id;
      }
      if (item.id && !item.studentName) {
        const keys = [...new Set(getStore().records.filter(record => record.testSessionId === item.id).map(record => historyClassFor(record)))];
        if (keys.length === 1) return keys[0];
      }
      return 'unassigned';
    }
    function testDateKey(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 'unknown' : new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
    }
    function historyTestFor(record) {
      return record.testSessionId || 'legacy:' + testDateKey(record.completedAt) + ':' + record.level + ':' + (record.plannedTotal || '');
    }
    function folderDate(value,withTime = false) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'تاريخ غير محدد';
      return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{timeZone:'Asia/Riyadh',dateStyle:'medium',...(withTime ? {timeStyle:'medium'} : {})}).format(date);
    }
    function historyClasses() {
      const classes = new Map();
      getRosterStore().rosters.forEach(roster => classes.set('class:'+roster.id,{key:'class:'+roster.id,name:roster.name,roster,records:[],sessions:[]}));
      const add = item => {
        const key = historyClassFor(item);
        if (!classes.has(key)) classes.set(key,{key,name:item.rosterName || (key === 'unassigned' ? 'نتائج دون صف' : 'صف مؤرشف'),roster:null,records:[],sessions:[]});
        return classes.get(key);
      };
      getStore().records.forEach(record => add(record).records.push(record));
      Object.values(getTestSessions()).forEach(session => { if (session?.id) add(session).sessions.push(session); });
      return [...classes.values()].sort((a,b) => a.name.localeCompare(b.name,'ar'));
    }
    function historyTests(group) {
      if (!group) return [];
      const tests = new Map();
      group.sessions.forEach(session => tests.set(session.id,{key:session.id,startedAt:session.startedAt,level:session.level,wordSession:session.wordSession,number:session.number,legacy:false,records:[],session}));
      group.records.forEach(record => {
        const key = historyTestFor(record);
        if (!tests.has(key)) tests.set(key,{key,startedAt:record.testSessionStartedAt || record.completedAt,level:record.level,wordSession:record.level === 'four' && (record.plannedTotal === 15 || record.levelLabel?.includes('قصير')) ? 'short' : 'full',legacy:!record.testSessionId,records:[]});
        const test = tests.get(key); test.records.push(record);
        if (test.legacy && record.completedAt < test.startedAt) test.startedAt = record.completedAt;
      });
      return [...tests.values()].sort((a,b) => (new Date(b.startedAt).getTime() || 0) - (new Date(a.startedAt).getTime() || 0));
    }
    function historyScope() {
      const group = historyClasses().find(item => item.key === historyClassKey);
      const test = historyTests(group).find(item => item.key === historyTestKey);
      return {group,test,records:historyAll || !group ? getStore().records : test ? test.records : group.records};
    }
    function openHistoryClass(key) { historyClassKey=key;historyTestKey=null;historyAll=false;showHistory(); }
    function openHistoryTest(key) { historyTestKey=key;historyAll=false;showHistory(); }
    function historyTestTitle(test) {
      return (test.legacy ? 'اختبار سابق' : 'اختبار' + (test.number ? ' '+test.number : '')) + ' — ' + folderDate(test.startedAt,!test.legacy);
    }
    function showHistory(reset = false) {
      if (reset === true) { historyClassKey=null;historyTestKey=null;historyAll=false; }
      hide('setup');hide('test');hide('report');hide('schoolPage');hide('allReport');hide('studentProfile');hide('importReview');show('history');show('homeButton');setActiveNav('navHistory');
      const scope = historyScope();
      if (historyClassKey && !scope.group) { historyClassKey=null;historyTestKey=null; }
      if (historyTestKey && !scope.test) historyTestKey=null;
      $('historyLevel').innerHTML='<option value="all">جميع المستويات</option>'+[...new Set(scope.records.map(record=>record.level))].map(level=>'<option value="'+esc(level)+'">'+esc(levelName(level))+'</option>').join('');
      $('historyLevel').value='all';$('historySearch').value='';renderHistoryRows();
    }
    function renderHistoryRows() {
      const {group,test,records:scopeRecords} = historyScope();
      const query = classNameKey($('historySearch').value.trim());
      const level = $('historyLevel').value || 'all';
      const matches = record => (level === 'all' || record.level === level) && (!query || studentNameKey(record.studentName).includes(query));
      const records = scopeRecords.filter(matches);
      const pct = scopeRecords.length ? Math.round(scopeRecords.reduce((sum,r)=>sum+r.summary.percentage,0)/scopeRecords.length) : 0;
      $('historyStats').innerHTML=[['إجمالي المحاولات',scopeRecords.length],['متوسط النتائج',pct+'%'],['بنود متقنة',scopeRecords.reduce((sum,r)=>sum+r.summary.correct,0)],['تحتاج تدريبًا',scopeRecords.reduce((sum,r)=>sum+r.summary.incorrect,0)]].map(([label,value])=>'<div class="history-stat"><span>'+label+'</span><b>'+esc(value)+'</b></div>').join('');
      $('historyPath').innerHTML='<button class="secondary" id="historyRoot" type="button">مجلدات الصفوف</button>'+(group ? '<span aria-hidden="true">/</span><button class="secondary" id="historyClassParent" type="button">'+esc(group.name)+'</button>' : '')+(test ? '<span aria-hidden="true">/</span><span>'+esc(historyTestTitle(test))+'</span>' : '')+(historyAll ? '<span>/ جميع النتائج</span>' : '<button class="secondary" id="historyShowAll" type="button">جميع النتائج</button>');
      $('historyRoot').onclick=()=>showHistory(true);
      if (group) $('historyClassParent').onclick=()=>openHistoryClass(group.key);
      if (!historyAll) $('historyShowAll').onclick=()=>{historyAll=true;historyClassKey=null;historyTestKey=null;showHistory();};
      $('historyReportActions').classList.toggle('hidden',!group && !historyAll);
      if (!group && !historyAll) {
        const classes=historyClasses().filter(item => (!query && level==='all') || (level==='all' && classNameKey(item.name).includes(query)) || item.records.some(matches));
        $('historyCount').textContent=classes.length+' صفوف';
        $('historyList').innerHTML=classes.length ? '<div class="history-folders">'+classes.map(item=>'<button class="history-folder" data-history-class="'+esc(item.key)+'" type="button"><span class="history-folder-icon" aria-hidden="true">▤</span><strong>'+esc(item.name)+'</strong><small>'+historyTests(item).length+' اختبارات · '+item.records.length+' نتائج'+(item.roster ? ' · '+item.roster.students.length+' طالبًا' : ' · أرشيف')+'</small></button>').join('')+'</div>' : '<div class="history-empty">لا توجد صفوف تطابق البحث.</div>';
        document.querySelectorAll('[data-history-class]').forEach(button=>button.onclick=()=>openHistoryClass(button.dataset.historyClass));
        return;
      }
      if (group && !test && !historyAll) {
        const tests=historyTests(group).filter(item=>(level==='all'||item.level===level)&&(!query||item.records.some(matches)));
        $('historyCount').textContent=tests.length+' اختبارات';
        $('historyList').innerHTML=tests.length ? '<div class="history-folders">'+tests.map(item=>'<button class="history-folder" data-history-test="'+esc(item.key)+'" type="button"><span class="history-folder-icon" aria-hidden="true">◷</span><strong>'+esc(historyTestTitle(item))+'</strong><small>'+esc(levelName(item.level))+(item.level==='four' ? ' · '+(item.wordSession==='short'?'قصير':'كامل'):'')+'</small><small>'+item.records.length+' نتائج محفوظة'+(item.legacy?' · أرشيف النسخة السابقة':'')+'</small></button>').join('')+'</div>' : '<div class="history-empty">لا توجد اختبارات تطابق البحث في هذا الصف.</div>';
        document.querySelectorAll('[data-history-test]').forEach(button=>button.onclick=()=>openHistoryTest(button.dataset.historyTest));
        return;
      }
      $('historyCount').textContent=records.length+' نتيجة';
      $('historyList').innerHTML = records.length ? '<div class="history-table"><table><thead><tr><th>اسم الطالب</th><th>المستوى</th><th>النتيجة</th><th>البنود التي تحتاج إلى تدريب</th><th>الإجراءات</th></tr></thead><tbody>' + records.map(record => '<tr><td><span class="history-name">' + esc(record.studentName) + '</span><div class="history-meta">' + esc(formatDate(record.completedAt)) + (record.rosterName ? ' · ' + esc(record.rosterName) : '') + '</div></td><td>' + esc(record.levelLabel) + '</td><td><span class="history-percent">' + esc(record.summary.percentage) + '%</span><div class="history-meta">' + esc(record.summary.correct) + '/' + esc(record.summary.total) + ' متقن</div></td><td><span class="wrong">' + esc(wrongText(record)) + '</span></td><td><div class="history-actions no-print"><button class="secondary" data-record="' + esc(record.id) + '">التقرير</button><button class="secondary" data-profile="' + esc(record.id) + '">ملف الطالب</button><button class="absent" data-delete-record="' + esc(record.id) + '">حذف</button></div></td></tr>').join('') + '</tbody></table></div>' : '<div class="history-empty">لا توجد نتائج تطابق البحث.</div>';
      document.querySelectorAll('[data-record]').forEach(button => button.onclick = () => {
        const record = getStore().records.find(x => x.id === button.dataset.record);
        if (record) renderReport(record);
      });
      document.querySelectorAll('[data-delete-record]').forEach(button => button.onclick = () => {
        const store = getStore();
        const record = store.records.find(x => x.id === button.dataset.deleteRecord);
        if (!record || !window.confirm('هل تريد حذف تقرير الطالب «' + record.studentName + '» نهائيًا؟')) return;
        store.records = store.records.filter(x => x.id !== record.id);
        saveStore(store);
        showHistory();
      });
      document.querySelectorAll('[data-profile]').forEach(button => button.onclick = () => {
        const record = getStore().records.find(x => x.id === button.dataset.profile);
        if (record) showStudentProfile(record);
      });
    }

    function studentNameKey(name) {
      return cleanRosterName(name).replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/\s+/g, ' ');
    }
    function recordStudentId(record, roster) {
      if (record.rosterId && record.rosterId !== roster.id) return null;
      const byId = roster.students.find(student => student.id === record.studentId);
      if (byId) return byId.id;
      const candidates = roster.students.filter(student => studentNameKey(student.name) === studentNameKey(record.studentName));
      // An unlinked manual attempt can belong to only one saved class by name.
      if (!record.rosterId) {
        const matching = getRosterStore().rosters.flatMap(item => item.students.filter(student => studentNameKey(student.name) === studentNameKey(record.studentName)));
        if (matching.length !== 1) return null;
      }
      return candidates.length === 1 ? candidates[0].id : null;
    }
    function sameStudent(record, reference) {
      const rosters = getRosterStore().rosters;
      const roster = rosters.find(item => item.id === reference.rosterId) || rosters.find(item => recordStudentId(reference,item));
      if (roster) {
        const referenceId = recordStudentId(reference,roster);
        if (referenceId) return recordStudentId(record,roster) === referenceId;
      }
      if (record.rosterId !== reference.rosterId) return false;
      if (record.studentId && record.studentId === reference.studentId) return true;
      if (record.rosterId) return false; // Do not combine ambiguous classmates.
      return studentNameKey(record.studentName) === studentNameKey(reference.studentName);
    }

    function showStudentProfile(reference) {
      const records = getStore().records.filter(record => sameStudent(record, reference)).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      $('profileTitle').textContent = 'ملف الطالب: ' + reference.studentName;
      $('profileMeta').textContent = (reference.rosterName ? 'الصف: ' + reference.rosterName + ' — ' : '') + records.length + ' تقييمات محفوظة';
      const sameLevel=records.filter(record => record.level===reference.level);
      const chronological=[...sameLevel].reverse();
      const comparison='<div class="result"><strong>مقارنة المستوى نفسه:</strong> أول محاولة ' + esc(chronological[0]?.summary.percentage ?? '—') + '% · آخر محاولة ' + esc(sameLevel[0]?.summary.percentage ?? '—') + '% · أفضل محاولة ' + (sameLevel.length ? Math.max(...sameLevel.map(record => record.summary.percentage)) : '—') + '%</div>';
      $('profileContent').innerHTML = comparison + records.map(record => '<article class="history-item"><div class="history-head"><div><strong>' + esc(record.levelLabel) + '</strong><div class="history-meta">' + esc(formatDate(record.completedAt)) + ' — النتيجة: ' + esc(record.summary.percentage) + '%</div></div><button class="secondary no-print" data-profile-report="' + esc(record.id) + '">عرض التفاصيل</button></div><div class="result"><strong>المتقن:</strong> ' + esc(record.items.filter(item => item.score === '✓').map(item => item.item).join('، ') || '—') + '<br><strong>' + mistakeLabel(record) + ':</strong> ' + esc(wrongText(record)) + '</div></article>').join('') || '<div class="history-empty">لا توجد تقييمات محفوظة لهذا الطالب.</div>';
      document.querySelectorAll('[data-profile-report]').forEach(button => button.onclick = () => {
        const record = getStore().records.find(x => x.id === button.dataset.profileReport);
        if (record) renderReport(record);
      });
      hide('history'); hide('report'); hide('setup'); hide('allReport'); show('studentProfile'); show('homeButton');
    }

    function historyReportRoster() {
      if (historyAll) return null;
      if (historyClassKey) return historyScope().group?.roster || null;
      return getRoster();
    }
    function historyReportTitle() {
      const {group,test} = historyScope();
      return 'تقرير نتائج الصف' + (group ? ' — '+group.name : '') + (test ? ' — '+historyTestTitle(test)+' — '+levelName(test.level) : '');
    }

    function renderAllReport() {
      const rows = classRows();
      const roster = historyReportRoster();
      $('allReportContent').innerHTML = '<p><strong>'+esc(historyReportTitle())+'</strong></p>' + (roster ? '<p><strong>الصف:</strong> ' + esc(roster.name) + '</p>' : '') + (rows.length ? '<table class="class-table"><thead><tr><th>الطالب</th><th>الحالة</th><th>النتيجة</th><th>البنود التي تحتاج إلى تدريب</th></tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(cell => '<td>' + esc(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' : 'لا توجد نتائج محفوظة بعد.');
      hide('history'); hide('report'); hide('setup'); hide('studentProfile'); show('allReport'); show('homeButton');
    }

    function classRows() {
      const records = [...(historyClassKey || historyAll ? historyScope().records : getStore().records)].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
      const roster = historyReportRoster();
      const resultRow = (name,record) => [name,assessmentStatus(record),record.summary.percentage + '%',wrongText(record)];
      if (!roster || !roster.students.length) return records.map(record => resultRow(record.studentName,record));
      const latestRecords = new Map();
      records.forEach(record => {
        const id = recordStudentId(record,roster);
        if (id && !latestRecords.has(id)) latestRecords.set(id,record);
      });
      return roster.students.map(student => {
        const record = latestRecords.get(student.id);
        if (record) return resultRow(student.name,record);
        const test = historyScope().test;
        const absent = test ? test.session?.absentStudentIds?.[student.id] : roster.absentStudentIds[student.id];
        return [student.name,absent ? 'غائب' : 'لم يُختبر بعد','—','—'];
      });
    }
    function allRows() {
      return [['الطالب','الحالة','النتيجة','البنود التي تحتاج إلى تدريب'], ...classRows()];
    }

    async function runPrintWithFreshLayout(prepare, sectionId) {
      const feedback = $('printFeedback');
      const button = $(sectionId === 'report' ? 'print' : 'allPrint');
      if (button.disabled) return;
      button.disabled = true;
      feedback.textContent = 'جارٍ فتح معاينة الطباعة...';
      try {
      if (typeof prepare === 'function') prepare();
      const source = $(sectionId);
      if (!source) throw new Error('تعذر تجهيز التقرير للطباعة.');
      const clone = source.cloneNode(true);
      clone.classList.remove('hidden');
      clone.querySelectorAll('.no-print').forEach(element => element.remove());
      const css = document.querySelector('head style').textContent;
      const title = sectionId === 'report' ? 'تقرير الطالب' : 'تقرير نتائج الصف';
      const previewCss = `
        @page { size: A4; margin: 12mm; }
        html,body { direction:rtl; font-family:Arial,sans-serif; background:var(--ui-canvas); }
        body { margin:0; }
        .print-toolbar { position:sticky; top:0; z-index:5; display:flex; gap:10px;
          padding:12px 20px; background:var(--ui-primary); color:#fff; align-items:center; }
        .print-toolbar button { cursor:pointer; padding:8px 16px; }
        #printStatus { font-size:14px; }
        .preview-sheet { width:min(210mm, calc(100% - 24px)); min-height:297mm; margin:20px auto;
          background:#fff; padding:12mm; box-shadow:0 8px 30px #25243a30; }
        .preview-sheet .card { margin:0; }
        .hidden { display:none!important; }
        .no-print { display:none!important; }
        .print-toolbar { display:flex!important; flex-wrap:wrap; position:sticky; }
        .print-toolbar label { display:flex; align-items:center; gap:8px; color:#fff; font-size:15px; }
        .print-toolbar select { width:min(360px,70vw); font-size:16px; padding:8px; }
        .print-toolbar input { width:70px; padding:8px; font-size:16px; }
        #reportSource { display:none; }
        #reportSource.browser-preview { display:block; }
        #pagePreview { display:grid!important; gap:20px; padding:20px 12px; }
        .pdf-page { width:min(794px,100%); margin:0 auto; }
        .pdf-page figcaption { color:var(--ui-ink); text-align:center; padding:6px; }
        .pdf-page canvas { display:block; width:100%; height:auto; background:white; box-shadow:0 5px 24px #25243a30; }
        #printFeedback:empty { display:none; }
        .report-info { grid-template-columns:repeat(2,1fr); }
        .class-table { table-layout:fixed; font-size:12px; }
        .class-table th,.class-table td { overflow-wrap:anywhere; padding:6px; }
        .class-table th:first-child,.class-table td:first-child { width:28%; }
        .class-table th:nth-child(2) { width:18%; }
        .class-table th:nth-child(3) { width:12%; }
        .preview-sheet .result { overflow:visible; }
        .preview-sheet .report-banner h2 { font-size:20px; }
        .preview-sheet .report-label { font-size:13px; }
        thead { display:table-header-group; }
        tr,.report-stat,.report-info div,.wrong { break-inside:avoid; page-break-inside:avoid; }
        @media print {
          html,body { background:#fff!important; font-size:13px; print-color-adjust:exact; }
          .print-toolbar,#pagePreview { display:none!important; }
          #reportSource { display:block!important; }
          .preview-sheet { width:auto; min-height:0; margin:0; padding:0; box-shadow:none; }
          .report-banner { padding:10px 12px; background:#fff!important; color:#123b5d!important; border-bottom:2px solid #555; }
          .report-banner h2,.report-banner p,.report-score { color:#123b5d!important; }
          .report-info div,.report-stat,.wrong,.result { background:#fff!important; border-color:#999!important; }
          .signatures { break-inside:avoid; }
          .report-body { padding:9px 0; }
          .report-card { overflow:visible!important; }
          .report-stats { margin:8px 0; }
          .report-stat { padding:5px; }
          .detail-table { font-size:12px; }
          .detail-table th,.detail-table td { padding:5px; overflow-wrap:anywhere; }
          #allReport { display:block!important; }
          #report { display:block!important; }
        }`;
      const base = new URL('./', document.baseURI).href;
      const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><base href="' + esc(base) + '"><title>' + title +
        '</title><style>' + css + previewCss + '</style></head><body><nav class="print-toolbar no-print"><label>الطابعة <select id="printer"><option value="">جارٍ قراءة الطابعات...</option></select></label><label>النسخ <input id="copies" type="number" min="1" max="99" value="1"></label><button id="doPrint" disabled>طباعة</button><button id="savePdf" disabled>حفظ PDF</button><button id="prevPage" disabled>الصفحة السابقة</button><span id="pageCount"></span><button id="nextPage" disabled>الصفحة التالية</button><button id="retryPreview" hidden>إعادة المحاولة</button><span id="printStatus" role="status" aria-live="polite">جارٍ تجهيز المعاينة...</span></nav><section id="pagePreview" class="no-print" aria-label="صفحات معاينة الطباعة"></section><main id="reportSource" class="preview-sheet">' + clone.outerHTML + '</main><script src="print-preview.js"><\/script></body></html>';
        if (window.printActions?.openPreview) {
          const result = await window.printActions.openPreview(html);
          if (!result?.opened) throw new Error('لم تفتح نافذة المعاينة. أعد المحاولة.');
        } else {
          const preview = window.open('about:blank', '_blank');
          if (!preview) throw new Error('تعذر فتح نافذة المعاينة.');
          preview.document.open(); preview.document.write(html); preview.document.close();
        }
        feedback.textContent = 'فتحت معاينة الصفحات في نافذة مستقلة؛ اختر الطابعة منها.';
      } catch (error) {
        feedback.textContent = 'تعذر فتح معاينة الطباعة: ' + error.message;
        alert(feedback.textContent);
      } finally { button.disabled = false; }
    }

    $('start').onclick = begin;
    function syncLevelChoices() {
      document.querySelectorAll('[data-select-level]').forEach(button => {
        button.setAttribute('aria-pressed', button.dataset.selectLevel === $('level').value ? 'true' : 'false');
      });
    }
    document.querySelectorAll('[data-select-level]').forEach(button => button.onclick = () => {
      $('level').value = button.dataset.selectLevel;
      $('level').dispatchEvent(new Event('change', {bubbles:true}));
    });
    $('level').addEventListener('change', () => {
      $('wordSessionWrap').classList.toggle('hidden', $('level').value !== 'four');
      syncLevelChoices();
      updateStartSummary();
    });
    $('wordSessionWrap').classList.toggle('hidden', $('level').value !== 'four');
    syncLevelChoices();
    $('teacher').addEventListener('change', saveTeacherName);
    $('teacher').addEventListener('blur', saveTeacherName);
    $('principal').addEventListener('change', saveTeacherName);
    $('principal').addEventListener('blur', saveTeacherName);
    $('guardian').addEventListener('change', saveGuardianName);
    $('guardian').addEventListener('blur', saveGuardianName);
    $('student').addEventListener('change', () => {
      const student = getRoster()?.students.find(item => item.name === $('student').value.trim());
      $('guardian').value = student?.guardianName || '';
      updateStartSummary();
    });
    $('student').addEventListener('input', updateStartSummary);
    $('historySearch').addEventListener('input', renderHistoryRows);
    $('historyLevel').addEventListener('change', renderHistoryRows);
    ['schoolName','principal'].forEach(id => $(id).addEventListener('input', updateSchoolPreview));
    $('saveSchool').onclick = () => { saveTeacherName(); $('schoolSaved').textContent = '✓ تم الحفظ بنجاح'; window.setTimeout(() => $('schoolSaved').textContent = '', 2500); };
    let latestUpdateState;
    function renderUpdateState(state) {
      latestUpdateState=state;
      $('appVersion').textContent=state.currentVersion || '—';
      $('updateStatus').textContent=state.message+(state.version?' — '+state.version:'');
      $('checkUpdate').disabled=['checking','downloading','downloaded','installing','unsupported'].includes(state.status);
      $('downloadUpdate').classList.toggle('hidden',state.status!=='available');
      $('installUpdate').classList.toggle('hidden',state.status!=='downloaded');
      $('downloadUpdate').disabled=state.status!=='available';
      $('installUpdate').disabled=state.status!=='downloaded';
      $('updateProgress').classList.toggle('hidden',state.status!=='downloading');
      $('updateProgress').value=state.percent || 0;
    }
    for(const [id,action] of [['checkUpdate','check'],['downloadUpdate','download'],['installUpdate','install']]) {
      $(id).onclick=async()=>{
        $(id).disabled=true;
        try {renderUpdateState(await window.updateActions[action]());}
        catch {renderUpdateState({...latestUpdateState,status:'error',message:'تعذر تنفيذ طلب التحديث. أعد المحاولة.'});}
        finally {if(latestUpdateState)renderUpdateState(latestUpdateState);}
      };
    }
    if(window.updateActions) {
      window.updateActions.onState(renderUpdateState);
      window.updateActions.getState().then(renderUpdateState).catch(()=>renderUpdateState({status:'unsupported',message:'تعذر تجهيز خدمة التحديث.'}));
    } else renderUpdateState({status:'unsupported',message:'التحديث متاح في نسخة Windows المثبتة.'});
    $('reviewNames').addEventListener('input', updateImportCount);
    $('importRoster').onclick = () => $('rosterFile').click();
    $('cancelRosterImport').onclick=()=>activeRosterImport?.abort(RosterImport.abortError());
    $('rosterName').addEventListener('input',updateClassNameHint);
    $('reviewClassName').addEventListener('input',updateClassNameHint);
    $('rosterFile').onchange = event => {
      const file = event.target.files[0];
      if (file && !$('rosterName').value.trim()) $('rosterName').value = file.name.replace(/\.[^.]+$/, '');
      importRoster(file);
    };
    $('savedRosters').onchange = event => {
      const store = getRosterStore();
      if (!event.target.value || !store.rosters.some(roster => roster.id === event.target.value)) return;
      store.activeRosterId = event.target.value;
      saveRosterStore(store);
      updateRosterMessage();
    };
    $('rosterStudent').onchange = event => {
      const roster = getRoster();
      if (!roster) return;
      roster.currentIndex = Number(event.target.value);
      delete roster.absentStudentIds[currentStudent(roster).id];
      saveRoster(roster);
      updateRosterMessage();
    };
    $('clearRoster').onclick = () => {
      const roster = getRoster();
      if (!roster || !window.confirm('هل تريد حذف الصف النشط «' + roster.name + '»؟ لن تُحذف تقارير الطلاب المحفوظة.')) return;
      const store = getRosterStore();
      store.rosters = store.rosters.filter(item => item.id !== roster.id);
      store.activeRosterId = store.rosters.length ? store.rosters[0].id : null;
      saveRosterStore(store);
      $('rosterFile').value = '';
      $('student').value = '';
      $('guardian').value = '';
      updateRosterMessage();
    };
    document.querySelectorAll('[data-score]').forEach(button => button.onclick = () => mark(button.dataset.score));
    $('previousItem').onclick = previousItem;
    $('nextItem').onclick = nextItem;
    document.addEventListener('keydown', event => {
      if ($('test').classList.contains('hidden') || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      if (event.target.closest?.('input, select, textarea, [contenteditable]:not([contenteditable="false"])')) return;
      const focusedButton = event.target.closest?.('button');
      if (focusedButton && !focusedButton.matches('button[data-score]')) return;
      const score = event.key === 'Enter' ? '✓' : event.code === 'Space' ? '✕' : event.key.toLowerCase() === 'r' ? '↻' : null;
      if (!score) return;
      event.preventDefault();
      if (event.repeat) return;
      mark(score);
    });
    $('finish').onclick = () => { if (res.some(Boolean) && (res.every(Boolean) || window.confirm('هناك بنود لم تُقيّم. هل تريد حفظ تقرير جزئي؟'))) completeAssessment(); };
    $('returnHome').onclick = () => {
      stopTimer(); goHome();
    };
    $('skipAbsent').onclick = skipAbsentStudent;
    $('printFormat').onchange = () => activeRecord && renderDetails(activeRecord);
    $('print').onclick = () => runPrintWithFreshLayout(() => { if (!activeRecord) throw new Error('افتح تقرير الطالب أولًا.'); renderDetails(activeRecord); }, 'report');
    $('word').onclick = () => activeRecord && saveDoc(individualRows(activeRecord), 'تقرير-' + activeRecord.studentName + '.docx', reportTitle(activeRecord) + ' للطالب ' + activeRecord.studentName);
    $('nextStudent').onclick = () => {
      if (advanceRoster()) begin(true);
    };
    $('previousStudent').onclick = () => {
      const roster = getRoster();
      if (!roster || roster.currentIndex <= 0) return;
      roster.currentIndex--;
      delete roster.absentStudentIds[currentStudent(roster).id];
      saveRoster(roster);
      $('student').value = currentStudent(roster).name;
      $('guardian').value = currentStudent(roster).guardianName || '';
      begin(true);
    };
    $('again').onclick = () => { goHome(); $('student').value = ''; $('guardian').value = ''; updateRosterMessage(); };
    $('showHistory').onclick = () => showHistory(true);
    $('reportHistory').onclick = () => { if (activeRecord) {historyClassKey=historyClassFor(activeRecord);historyTestKey=historyTestFor(activeRecord);historyAll=false;} showHistory(); };
    $('closeHistory').onclick = goHome;
    $('allWord').onclick = () => {
      saveDoc(allRows(), 'نتائج-الصف.docx', historyReportTitle());
    };
    $('allPrint').onclick = () => runPrintWithFreshLayout(renderAllReport, 'allReport');
    $('closeAllReport').onclick = showHistory;
    $('homeButton').onclick = () => {
      stopTimer(); goHome();
    };
    $('navRoster').onclick = () => { goHome(); $('savedRosters').focus(); };
    $('navHistory').onclick = () => showHistory(true);
    $('navSettings').onclick = showSchoolPage;
    $('rosterSchoolLink').onclick = showSchoolPage;
    $('approveRoster').onclick = () => {
      if (!pendingRosterImport) return goHome();
      const rows = parseReviewRows($('reviewNames').value);
      if (!rows.length) return alert('أدخل اسم طالب واحد على الأقل، كل اسم في سطر مستقل.');
      if (rows.length !== $('reviewNames').value.split(/\r?\n/).filter(line => line.trim()).length) return alert('يوجد سطر غير صالح في الأسماء. صححه قبل الاعتماد حتى لا يُحذف أي طالب.');
      $('rosterName').value = $('reviewClassName').value.trim();
      if (!$('rosterName').value) return alert('أدخل اسم الصف.');
      try { saveImportedRoster(pendingRosterImport.file, rows); } catch (error) { alert(error.message); updateClassNameHint(); return; }
      pendingRosterImport = null;
      $('rosterFile').value = '';
      goHome();
    };
    $('cancelRosterReview').onclick = () => { pendingRosterImport = null; $('rosterFile').value = ''; goHome(); };
    $('resumeDraft').onclick = resumeDraft;
    $('discardDraft').onclick = () => {if (window.confirm('حذف الاختبار غير المكتمل؟')) clearDraft();};
    // Load only this installation's saved data; never auto-import legacy records.
    restoreTeacherName();
    updateRosterMessage(); updateDraftBanner();
  
