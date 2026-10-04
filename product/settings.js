(function () {
  const { h } = SS, main = document.getElementById('main'), P = SS.prefs;
  SS.page = function () {
    const fld = (l, el, err) => h('label', { class: 'fld' }, h('span', { text: l }), el, err || null);
    const name = h('input', { type: 'text', value: P.name, maxlength: '60' }), email = h('input', { type: 'email', value: P.email, maxlength: '100' }), ws = h('input', { type: 'text', value: P.workspace, maxlength: '50' });
    const ne = h('p', { class: 'error', role: 'alert' }), ee = h('p', { class: 'error', role: 'alert' }), we = h('p', { class: 'error', role: 'alert' });
    const ini = h('span', { class: 'av', style: 'width:44px;height:44px;font-size:15px;background:#5b4be1', text: '' });
    const initials = () => (name.value.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || '?').toUpperCase(); ini.textContent = initials(); name.addEventListener('input', () => { ini.textContent = initials(); });
    const chk = (key, label) => { const c = h('input', { type: 'checkbox', checked: P.notif[key], onchange: () => { P.notif[key] = c.checked; SS.savePrefs(); SS.toast('Preference saved', 'ok'); } }); return h('label', {}, c, label); };
    const radio = (v, l) => h('label', {}, h('input', { type: 'radio', name: 'theme', value: v, checked: P.theme === v, onchange: () => { SS.setTheme(v); SS.toast(l + ' theme applied', 'ok'); } }), l);
    const dens = h('input', { type: 'checkbox', checked: P.compact, onchange: () => { P.compact = dens.checked; document.body.classList.toggle('compact', P.compact); SS.savePrefs(); } });
    main.replaceChildren(h('div', { class: 'page-head' }, h('div', {}, h('h2', { text: 'Settings' }), h('p', { class: 'muted', text: 'Saved in this browser only. Real account management comes with Supabase.' }))),
      h('div', { class: 'settings' },
        SS.card('Profile', null, h('div', { class: 'row', style: 'justify-content:flex-start' }, ini, h('span', { class: 'muted small', text: 'Avatar initials come from your name.' })), fld('Name', name, ne), fld('Email', email, ee),
          h('p', {}, h('button', { class: 'btn primary', type: 'button', onclick: () => { ne.textContent = ee.textContent = '';
            if (name.value.trim().length < 2) { ne.textContent = 'Enter your name (at least 2 characters).'; return; } if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) { ee.textContent = 'Enter a valid email address.'; return; }
            P.name = name.value.trim(); P.email = email.value.trim(); const u = SS.user(SS.ME); u.name = P.name; u.email = P.email; u.avatar = initials(); SS.save(); SS.savePrefs(); SS.toast('Profile saved in this browser', 'ok'); } }, 'Save profile'))),
        SS.card('Appearance', null, h('div', { class: 'radios' }, radio('light', 'Light'), radio('dark', 'Dark')), h('label', { class: 'checks' }, dens, 'Compact tables and spacing')),
        SS.card('Notifications', null, h('p', { class: 'muted small', text: 'Stored as preferences. Delivery needs the backend.' }), h('div', { class: 'checks' }, chk('assign', 'Task assignment'), chk('comment', 'Comments'), chk('deadline', 'Deadline reminders'))),
        h('div', { id: 'workspace' }, SS.card('Workspace', null, fld('Workspace name', ws, we), h('p', {}, h('button', { class: 'btn primary', type: 'button', onclick: () => { we.textContent = ''; if (ws.value.trim().length < 2) { we.textContent = 'Workspace name needs at least 2 characters.'; return; }
          P.workspace = ws.value.trim(); SS.savePrefs(); document.querySelector('.ws').lastChild.textContent = P.workspace; SS.toast('Workspace name saved', 'ok'); } }, 'Save workspace')))),
        SS.card('Demo data', null, h('p', { class: 'muted', text: 'Restore the original projects, tasks, comments and activity. Your changes will be lost.' }), h('p', {}, h('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm('Reset all demo data? This removes your changes.')) { SS.resetDb(); SS.toast('Demo data restored', 'ok'); SS.page(); } } }, 'Reset demo data')))));
  };
  SS.page();
})();
