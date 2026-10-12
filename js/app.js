(function () {
  const STORE_KEY = 'dailyTaskTracker.v1';
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const PRESETS = [
    ['💧', 'Drink water'], ['🏃', 'Exercise'], ['🧘', 'Meditate'], ['😴', 'Sleep 8 hours'],
    ['🚶', 'Walk 10k steps'], ['📖', 'Read'], ['💊', 'Take vitamins'], ['🥗', 'Eat healthy'],
    ['🍎', 'Eat fruit'], ['🤸', 'Stretch'], ['🌞', 'Morning sunlight'], ['📝', 'Journal'],
    ['🙏', 'Gratitude'], ['🦷', 'Floss'], ['🧴', 'Skincare'], ['🍬', 'No sugar'],
    ['🚭', 'No smoking'], ['📵', 'Screen-free hour'], ['🧹', 'Tidy up'], ['🎸', 'Practice a skill']
  ];
  const CUSTOM_ICONS = ['⭐', '🎯', '❤️', '🔥', '🌱', '🧠', '💪', '🚴', '🏊', '🥤', '☕', '🎨', '🎵', '💻', '💰', '🐶', '🛏️', '📚'];
  const $ = id => document.getElementById(id);

  // state.tasks:    { 'YYYY-MM-DD': [{ id, title, minutes, done }] }
  // state.habits:   [{ id, name, icon, remind: 'HH:MM' or '', created: 'YYYY-MM-DD' }]  (a habit counts from its created day on)
  // state.habitLog: { 'YYYY-MM-DD': { habitId: true } }
  // state.notified: { habitId: 'YYYY-MM-DD' }  (last day a reminder was shown)
  let state = { tasks: {}, habits: [], habitLog: {}, notified: {}, theme: null, mode: 'count', page: 'tasks' };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && typeof saved.tasks === 'object') state = Object.assign(state, saved);
  } catch (e) { /* start fresh */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  function keyOf(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function mondayOf(d) { const x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); }
  function fmtTime(min) {
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + 'h ' + m + 'm';
    return h ? h + 'h' : m + 'm';
  }
  function relative(diff) {
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    return diff < 0 ? -diff + ' days ago' : 'In ' + diff + ' days';
  }
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pctText = p => p === null ? '–' : p + '%';

  let selected = startOfDay(new Date());
  let todayKey = keyOf(selected);
  let popId = null;

  // Totals for a list of tasks, plus the percentage under the current measure.
  function taskStats(list) {
    const s = { total: list.length, done: 0, minutes: 0, doneMinutes: 0 };
    for (const t of list) {
      s.minutes += t.minutes;
      if (t.done) { s.done++; s.doneMinutes += t.minutes; }
    }
    const num = state.mode === 'time' ? s.doneMinutes : s.done;
    const den = state.mode === 'time' ? s.minutes : s.total;
    s.pct = den ? Math.round(num / den * 100) : null;
    return s;
  }
  function habitStats(dayKeys) {
    const s = { total: 0, done: 0 };
    for (const k of dayKeys) {
      const log = state.habitLog[k];
      // Days still to come don't count against the percentage until something is ticked on them
      if (k > todayKey && !log) continue;
      for (const h of state.habits) {
        if (h.created > k) continue;
        s.total++;
        if (log && log[h.id]) s.done++;
      }
    }
    s.pct = s.total ? Math.round(s.done / s.total * 100) : null;
    return s;
  }

  function render() {
    const habitsPage = state.page === 'habits';
    const unit = habitsPage ? 'habits' : 'tasks';
    const selKey = keyOf(selected);
    const isToday = selKey === todayKey;
    const diff = Math.round((selected - startOfDay(new Date())) / 864e5);
    const monday = mondayOf(selected);
    const week = DOW.map((_, i) => addDays(monday, i));
    const weekKeys = week.map(keyOf);
    const inThisWeek = weekKeys.includes(todayKey);

    const dayLists = weekKeys.map(k => state.tasks[k] || []);
    const dayStats = habitsPage ? weekKeys.map(k => habitStats([k])) : dayLists.map(taskStats);
    const weekStats = habitsPage ? habitStats(weekKeys) : taskStats([].concat(...dayLists));
    const sel = dayStats[weekKeys.indexOf(selKey)];
    const doneOf = s => s.total ? s.done + ' of ' + s.total + ' ' + unit + ' done'
      : habitsPage && state.habits.length ? 'Nothing ticked yet' : 'No ' + unit + ' yet';

    $('tabTasks').className = habitsPage ? '' : 'active';
    $('tabHabits').className = habitsPage ? 'active' : '';
    $('pageTasks').hidden = habitsPage;
    $('pageHabits').hidden = !habitsPage;
    $('modeWrap').hidden = habitsPage;

    const short = { month: 'short', day: 'numeric' };
    const longDate = selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const weekName = inThisWeek ? 'This week' : 'Week of ' + monday.toLocaleDateString(undefined, short);
    $('range').textContent = monday.toLocaleDateString(undefined, short) + ' – ' + week[6].toLocaleDateString(undefined, short);

    // Summary tiles
    $('dayStatLabel').textContent = isToday ? 'Today' : selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    $('dayPct').textContent = pctText(sel.pct);
    $('daySub').textContent = doneOf(sel);
    $('weekLabel').textContent = weekName;
    $('weekPct').textContent = pctText(weekStats.pct);
    $('weekSub').textContent = doneOf(weekStats);
    if (habitsPage) {
      $('tile3Label').textContent = 'Habits tracked';
      $('tile3Value').textContent = state.habits.length;
      $('tile3Sub').textContent = 'repeat every day';
    } else {
      $('tile3Label').textContent = 'Time completed, ' + weekName.toLowerCase();
      $('tile3Value').textContent = fmtTime(weekStats.doneMinutes);
      $('tile3Sub').textContent = 'of ' + fmtTime(weekStats.minutes) + ' planned';
    }

    // Day picker
    const days = $('days');
    days.textContent = '';
    week.forEach((d, i) => {
      const b = document.createElement('button');
      const k = weekKeys[i];
      b.className = 'day' + (k === selKey ? ' selected' : '') + (k === todayKey ? ' today' : '') + (dayStats[i].total ? ' has' : '');
      if (k === selKey) b.setAttribute('aria-current', 'date');
      b.innerHTML = '<div class="dow"></div><div class="num"></div><div class="pct"></div>';
      b.children[0].textContent = k === todayKey ? 'Today' : DOW[i];
      b.children[1].textContent = d.getDate();
      b.children[2].textContent = pctText(dayStats[i].pct);
      b.onclick = () => { selected = d; render(); };
      days.appendChild(b);
    });

    // Warning when the day being edited is not today
    $('notice').hidden = isToday;
    $('noticeText').textContent = 'You are viewing ' + longDate + ' (' + relative(diff).toLowerCase() + '), not today. Changes here apply to that day.';
    for (const id of ['dayBadge', 'habitBadge']) {
      $(id).textContent = relative(diff);
      $(id).className = 'badge' + (isToday ? ' today' : '');
    }

    if (habitsPage) renderHabits(selKey, weekKeys, sel, longDate);
    else renderTasks(selKey, sel, longDate, isToday);

    // Bar chart: one bar per day of the week
    $('chartTitle').textContent = (habitsPage ? 'Habit' : 'Task') + ' completion';
    const bars = $('bars');
    bars.textContent = '';
    week.forEach((d, i) => {
      const s = dayStats[i];
      const col = document.createElement('div');
      col.className = 'barcol' + (weekKeys[i] === todayKey ? ' today' : '') + (s.pct === null ? ' none' : '');
      col.title = DOW[i] + ': ' + doneOf(s) + (!habitsPage && s.total ? ', ' + fmtTime(s.doneMinutes) + ' of ' + fmtTime(s.minutes) : '');
      col.innerHTML = '<div class="val"></div><div class="track"><div class="fill"></div></div><div class="lab"></div>';
      col.children[0].textContent = pctText(s.pct);
      col.children[1].firstChild.style.height = (s.pct || 0) + '%';
      col.children[2].textContent = weekKeys[i] === todayKey ? 'Today' : DOW[i];
      bars.appendChild(col);
    });

    // Donut: the week as a whole
    const C = 2 * Math.PI * 46;
    const p = weekStats.pct || 0;
    $('donutArc').setAttribute('stroke-dasharray', (C * p / 100) + ' ' + C);
    $('donutPct').textContent = pctText(weekStats.pct);
    $('donutSub').textContent = inThisWeek ? 'this week' : 'that week';
    $('legDone').textContent = 'Completed ' + p + '%';
    $('legRest').textContent = 'Remaining ' + (weekStats.pct === null ? 0 : 100 - p) + '%';

    popId = null;
  }

  function renderTasks(selKey, sel, longDate, isToday) {
    const list = state.tasks[selKey] || [];
    $('dayTitle').textContent = longDate;
    $('dayMeta').textContent = sel.total
      ? pctText(sel.pct) + ' complete · ' + fmtTime(sel.doneMinutes) + ' of ' + fmtTime(sel.minutes)
      : '';
    $('dayBar').style.width = (sel.pct || 0) + '%';
    $('addBtn').textContent = isToday ? 'Add to today' : 'Add to ' + selected.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const ul = $('tasks');
    ul.textContent = '';
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nothing planned for this day. Add a task above.';
      ul.appendChild(li);
    }
    list.forEach(t => {
      const li = document.createElement('li');
      if (t.done) li.className = 'done';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = t.done; cb.id = 't' + t.id;
      cb.onchange = () => { t.done = cb.checked; save(); render(); };
      const name = document.createElement('label');
      name.className = 'name'; name.htmlFor = cb.id; name.textContent = t.title;
      const time = document.createElement('span');
      time.className = 'time'; time.textContent = fmtTime(t.minutes);
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '×'; del.title = 'Delete task';
      del.setAttribute('aria-label', 'Delete ' + t.title);
      del.onclick = () => {
        state.tasks[selKey] = list.filter(x => x !== t);
        if (!state.tasks[selKey].length) delete state.tasks[selKey];
        save(); render();
      };
      li.append(cb, name, time, del);
      ul.appendChild(li);
    });
  }

  function icon(ico) {
    const s = document.createElement('span');
    s.className = 'ico'; s.textContent = ico; s.setAttribute('aria-hidden', 'true');
    return s;
  }

  function addHabit(name, ico) {
    if (state.habits.some(h => h.name.toLowerCase() === name.toLowerCase())) return;
    // Created on the earlier of today and the viewed day, so it shows up on the day being viewed
    const selKey = keyOf(selected);
    state.habits.push({ id: newId(), name, icon: ico, remind: '', created: selKey < todayKey ? selKey : todayKey });
    save(); render();
  }

  function renderHabits(selKey, weekKeys, sel, longDate) {
    $('habitTitle').textContent = longDate;
    $('habitMeta').textContent = sel.total ? pctText(sel.pct) + ' complete · ' + sel.done + ' of ' + sel.total : '';
    $('habitBar').style.width = (sel.pct || 0) + '%';

    // Scrollable preset options; rebuilt in place so the scroll position is kept
    const picker = $('picker');
    const scroll = picker.scrollLeft;
    picker.textContent = '';
    PRESETS.forEach(([ico, name]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.disabled = state.habits.some(h => h.name.toLowerCase() === name.toLowerCase());
      b.append(icon(ico), document.createTextNode(b.disabled ? name + ' ✓' : name));
      b.onclick = () => addHabit(name, ico);
      picker.appendChild(b);
    });
    const other = document.createElement('button');
    other.type = 'button'; other.className = 'chip other';
    other.append(icon('➕'), document.createTextNode('Other'));
    other.onclick = () => { $('customForm').hidden = false; $('customName').focus(); };
    picker.appendChild(other);
    picker.scrollLeft = scroll;

    const ul = $('habits');
    ul.textContent = '';
    const active = state.habits.filter(h => h.created <= selKey);
    if (!active.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = state.habits.length
        ? 'No habits were being tracked yet on this day.'
        : 'No habits yet. Pick one above, or tap Other to add your own.';
      ul.appendChild(li);
    }
    const log = state.habitLog[selKey] || {};
    active.forEach(h => {
      const done = !!log[h.id];
      const li = document.createElement('li');
      li.className = (done ? 'done' : '') + (popId === h.id ? ' pop' : '');
      const name = document.createElement('span');
      name.className = 'name'; name.textContent = h.name;
      const dots = document.createElement('span');
      dots.className = 'dots';
      dots.title = 'This week, Mon–Sun';
      weekKeys.forEach(k => {
        const d = document.createElement('i');
        d.className = (h.created > k ? 'na' : (state.habitLog[k] || {})[h.id] ? 'on' : '') + (k === selKey ? ' sel' : '');
        dots.appendChild(d);
      });
      const remind = document.createElement('label');
      remind.className = 'remind' + (h.remind ? ' set' : '');
      remind.title = 'Daily reminder time';
      const time = document.createElement('input');
      time.type = 'time'; time.value = h.remind || '';
      time.setAttribute('aria-label', 'Reminder time for ' + h.name);
      time.onchange = () => {
        h.remind = time.value;
        delete state.notified[h.id];
        save(); render();
        if (h.remind) askPermission();
      };
      remind.append('🔔', time);
      const check = document.createElement('button');
      check.className = 'check'; check.textContent = '✓';
      check.setAttribute('role', 'checkbox');
      check.setAttribute('aria-checked', done);
      check.setAttribute('aria-label', h.name);
      check.onclick = () => {
        const l = state.habitLog[selKey] = state.habitLog[selKey] || {};
        if (done) delete l[h.id]; else { l[h.id] = true; popId = h.id; }
        if (!Object.keys(l).length) delete state.habitLog[selKey];
        save(); render();
      };
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '×'; del.title = 'Remove habit (and its history)';
      del.setAttribute('aria-label', 'Remove ' + h.name);
      del.onclick = () => {
        if (!confirm('Remove "' + h.name + '" and its history from every day?')) return;
        state.habits = state.habits.filter(x => x !== h);
        delete state.notified[h.id];
        for (const k of Object.keys(state.habitLog)) {
          delete state.habitLog[k][h.id];
          if (!Object.keys(state.habitLog[k]).length) delete state.habitLog[k];
        }
        save(); render();
      };
      li.append(icon(h.icon), name, dots, remind, check, del);
      ul.appendChild(li);
    });
    renderRemindNote();
  }

  function permission() { return 'Notification' in window ? Notification.permission : 'unsupported'; }
  function askPermission() {
    if (permission() !== 'default') return;
    Promise.resolve(Notification.requestPermission()).then(render, render);
  }
  function renderRemindNote() {
    const any = state.habits.some(h => h.remind);
    $('remindNote').hidden = !any;
    const p = permission();
    $('remindEnable').hidden = p !== 'default';
    $('remindText').textContent = {
      granted: '🔔 Reminders show as system notifications while this page is open in a browser tab, unless the habit is already ticked.',
      default: '🔔 Reminders need permission to show notifications.',
      denied: '🔕 Notifications are blocked for this page. Allow them in your browser\'s site settings to get reminders.',
      unsupported: '🔕 This browser cannot show notifications from this page.'
    }[p];
  }
  $('remindEnable').onclick = askPermission;

  // Fires each reminder once per day, up to 10 minutes late so a sleeping tab still catches it
  function checkReminders(now) {
    if (permission() !== 'granted') return;
    const mins = now.getHours() * 60 + now.getMinutes();
    const log = state.habitLog[todayKey] || {};
    for (const h of state.habits) {
      if (!h.remind || log[h.id] || state.notified[h.id] === todayKey) continue;
      const parts = h.remind.split(':');
      const late = mins - (parts[0] * 60 + +parts[1]);
      if (late < 0 || late > 10) continue;
      state.notified[h.id] = todayKey;
      save();
      try {
        const n = new Notification(h.icon + ' ' + h.name, { body: 'Reminder: time for this habit. Tick it off when you are done.', tag: 'habit-' + h.id });
        n.onclick = () => { window.focus(); n.close(); };
      } catch (e) { /* notifications unavailable */ }
    }
  }

  $('addForm').onsubmit = e => {
    e.preventDefault();
    const title = $('title').value.trim();
    if (!title) return;
    const h = parseInt($('hours').value, 10) || 0;
    const mRaw = $('mins').value;
    // Blank hours and minutes fall back to the 30-minute placeholder
    const m = mRaw === '' && !h ? 30 : (parseInt(mRaw, 10) || 0);
    const minutes = Math.max(1, h * 60 + m);
    const k = keyOf(selected);
    (state.tasks[k] = state.tasks[k] || []).push({ id: newId(), title, minutes, done: false });
    save();
    $('title').value = ''; $('hours').value = ''; $('mins').value = '';
    $('title').focus();
    render();
  };

  CUSTOM_ICONS.forEach((ico, i) => {
    const l = document.createElement('label');
    const r = document.createElement('input');
    r.type = 'radio'; r.name = 'customIcon'; r.value = ico; r.checked = i === 0;
    r.setAttribute('aria-label', ico);
    const s = document.createElement('span');
    s.textContent = ico;
    l.append(r, s);
    $('emojis').appendChild(l);
  });
  $('customForm').onsubmit = e => {
    e.preventDefault();
    const name = $('customName').value.trim();
    if (!name) return;
    const ico = document.querySelector('input[name=customIcon]:checked').value;
    $('customName').value = '';
    $('customForm').hidden = true;
    addHabit(name, ico);
  };
  $('customCancel').onclick = () => { $('customForm').hidden = true; };

  // Follows the system setting until the user picks a theme with the switch
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const dark = state.theme ? state.theme === 'dark' : systemDark.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('themeBtn').textContent = dark ? '☀️' : '🌙';
    $('themeBtn').title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    $('themeBtn').setAttribute('aria-label', $('themeBtn').title);
  }
  $('themeBtn').onclick = () => {
    state.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    save(); applyTheme();
  };
  systemDark.addEventListener('change', applyTheme);
  applyTheme();

  // Backup: export everything to a JSON file, import replaces everything from one
  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify({ app: STORE_KEY, exported: new Date().toISOString(), data: state }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'task-tracker-backup-' + todayKey + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $('backupMsg').textContent = 'Exported ' + a.download + ' to your downloads.';
  };

  // Keeps only well-formed records so a damaged or foreign file cannot break the tracker
  function cleanImport(d) {
    const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
    const isDay = k => /^\d{4}-\d{2}-\d{2}$/.test(k);
    if (!isObj(d) || !isObj(d.tasks)) return null;
    const out = { tasks: {}, habits: [], habitLog: {}, notified: {} };
    for (const k of Object.keys(d.tasks)) {
      if (!isDay(k) || !Array.isArray(d.tasks[k])) continue;
      const list = d.tasks[k].filter(t => isObj(t) && typeof t.title === 'string' && t.minutes > 0)
        .map(t => ({ id: String(t.id || newId()), title: t.title.slice(0, 200), minutes: Math.round(t.minutes), done: !!t.done }));
      if (list.length) out.tasks[k] = list;
    }
    const ids = {};
    for (const h of Array.isArray(d.habits) ? d.habits : []) {
      if (!isObj(h) || typeof h.name !== 'string' || !h.id || ids[h.id]) continue;
      ids[h.id] = true;
      out.habits.push({
        id: String(h.id), name: h.name.slice(0, 80), icon: typeof h.icon === 'string' ? h.icon : '⭐',
        remind: /^\d{2}:\d{2}$/.test(h.remind) ? h.remind : '', created: isDay(h.created) ? h.created : todayKey
      });
    }
    if (isObj(d.habitLog)) for (const k of Object.keys(d.habitLog)) {
      if (!isDay(k) || !isObj(d.habitLog[k])) continue;
      const log = {};
      for (const id of Object.keys(d.habitLog[k])) if (ids[id] && d.habitLog[k][id]) log[id] = true;
      if (Object.keys(log).length) out.habitLog[k] = log;
    }
    if (isObj(d.notified)) for (const id of Object.keys(d.notified)) if (ids[id] && isDay(d.notified[id])) out.notified[id] = d.notified[id];
    out.mode = d.mode === 'time' ? 'time' : 'count';
    out.page = d.page === 'habits' ? 'habits' : 'tasks';
    out.theme = d.theme === 'dark' || d.theme === 'light' ? d.theme : null;
    return out;
  }

  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = () => {
    const file = $('importFile').files[0];
    $('importFile').value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => { $('backupMsg').textContent = 'Could not read that file.'; };
    reader.onload = () => {
      let parsed = null;
      try { parsed = JSON.parse(reader.result); } catch (e) { /* handled below */ }
      const data = cleanImport(parsed && parsed.data ? parsed.data : parsed);
      if (!data) { $('backupMsg').textContent = 'That file is not a tracker backup. Nothing was changed.'; return; }
      const summary = Object.keys(data.tasks).length + ' day(s) of tasks and ' + data.habits.length + ' habit(s)';
      if (!confirm('Replace everything in this tracker with the backup (' + summary + ')? This cannot be undone.')) return;
      state = data;
      save();
      $('mode').value = state.mode;
      applyTheme();
      render();
      $('backupMsg').textContent = 'Imported ' + summary + ' from ' + file.name + '.';
    };
    reader.readAsText(file);
  };

  function goToday() { selected = startOfDay(new Date()); render(); }
  $('prev').onclick = () => { selected = addDays(selected, -7); render(); };
  $('next').onclick = () => { selected = addDays(selected, 7); render(); };
  $('today').onclick = goToday;
  $('noticeBack').onclick = goToday;
  $('tabTasks').onclick = () => { state.page = 'tasks'; save(); render(); };
  $('tabHabits').onclick = () => { state.page = 'habits'; save(); render(); };
  $('mode').value = state.mode;
  $('mode').onchange = () => { state.mode = $('mode').value; save(); render(); };

  // Live clock. At midnight "today" moves on; follow it if the user was on today.
  function tick() {
    const now = new Date();
    $('clockTime').textContent = now.toLocaleTimeString();
    $('clockDate').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const k = keyOf(now);
    if (k !== todayKey) {
      const wasOnToday = keyOf(selected) === todayKey;
      todayKey = k;
      if (wasOnToday) selected = startOfDay(now);
      render();
    }
    checkReminders(now);
  }
  tick();
  setInterval(tick, 1000);

  render();
})();
