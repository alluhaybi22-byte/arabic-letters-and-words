(() => {
  const byId = id => document.getElementById(id);
  const home = byId('classHome');
  const manage = byId('rosterPage');
  const form = byId('setup');
  const originalPicker = byId('savedRosters');
  byId('homeClassField').appendChild(originalPicker.parentElement); byId('homeClassField').before(byId('draftBanner'));
  const toolbar = byId('rosterToolbar');
  ['uploadRoster', 'uploadRosterHint', 'newRoster', 'rosterMessage', 'cancelRosterImport'].forEach(id => toolbar.appendChild(byId(id)));
  const controls = document.querySelector('.setup-aside');
  controls.open = true;
  byId('rosterControls').appendChild(controls);
  byId('rosterPickerWrap').before(byId('selectedClassLabel'));
  byId('level').classList.remove('sr-only');
  document.querySelector('label[for="level"]').classList.remove('sr-only');
  byId('emptyRosterNotice').hidden = true;

  function hideCustomScreens() {
    home.classList.add('hidden');
    manage.classList.add('hidden');
  }

  function sync() {
    const roster = getRoster();
    byId('toStudent').disabled = !roster?.students.length;
    byId('homeEmpty').classList.toggle('hidden', Boolean(roster?.students.length));
    byId('selectedClassLabel').textContent = roster?.name || 'اختر صفًا أولًا';
    byId('homeClassInfo').textContent = roster ? roster.students.length + ' طالبًا في الصف' : '';
    const picker = byId('manageClassPicker');
    picker.innerHTML = originalPicker.innerHTML;
    picker.value = originalPicker.value;
    const list = byId('rosterList');
    list.replaceChildren();
    for (const entry of getRosterStore().rosters) {
      const row = document.createElement('div');
      row.className = 'tibyan-roster-row';
      const title = document.createElement('strong');
      title.textContent = entry.name;
      const count = document.createElement('span');
      count.textContent = entry.students.length + ' طالبًا';
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'secondary';
      select.textContent = 'اختيار الصف';
      select.addEventListener('click', () => {
        originalPicker.value = entry.id;
        originalPicker.dispatchEvent(new Event('change', { bubbles: true }));
        showStudent();
      });
      row.append(title, count, select);
      list.appendChild(row);
    }
    if (!list.children.length) {
      const message = document.createElement('p');
      message.textContent = 'لم تضف كشفًا بعد. ارفع ملف Excel أو Word أو أدخل الأسماء يدويًا.';
      list.appendChild(message);
    }
  }

  function showHome() {
    hideCustomScreens();
    form.classList.add('hidden');
    home.classList.remove('hidden');
    sync();
  }

  function showStudent() {
    if (!getRoster()?.students.length) return showRosters();
    goHome();
    hideCustomScreens();
    form.classList.remove('hidden');
    byId('studentStepTitle').textContent = getRoster().name;
    byId('rosterStudent').focus();
  }

  function showRosters() {
    goHome();
    form.classList.add('hidden');
    setActiveNav('navKashf');
    manage.classList.remove('hidden');
    sync();
  }

  window.tibyanUI = { showHome, sync, hideCustomScreens };
  byId('toStudent').onclick = showStudent;
  byId('studentBack').onclick = goHome;
  byId('navKashf').onclick = showRosters;
  byId('homeManage').onclick = showRosters;
  byId('navRoster').onclick = goHome;
  byId('manageClassPicker').onchange = event => {
    originalPicker.value = event.target.value;
    originalPicker.dispatchEvent(new Event('change', { bubbles: true }));
    sync();
  };
  new MutationObserver(sync).observe(originalPicker, { childList: true });
  window.addEventListener('focus', sync);
  const savedLevel = localStorage.getItem('lughaty-web.local.preferred-level');
  if (savedLevel && Array.from(byId('level').options).some(option => option.value === savedLevel)) {
    byId('level').value = savedLevel;
    byId('level').dispatchEvent(new Event('change', { bubbles: true }));
  }
  byId('level').addEventListener('change', () => {
    localStorage.setItem('lughaty-web.local.preferred-level', byId('level').value);
    window.dispatchEvent(new Event('tibyan:data-changed'));
  });
  showHome();
})();

