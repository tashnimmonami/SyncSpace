(function () {
  const { h } = SS, main = document.getElementById('main'), pid = new URLSearchParams(location.search).get('id');
  const st = { view: 'grid', q: '', health: 'all', sort: 'deadline', tab: 'overview', tsort: { key: 'dueDate', dir: 1 } };
  if (!pid) SS.onSearch = v => { st.q = v; SS.page(); };

  function list() {
    let ps = SS.db.projects.filter(p => (SS.match(p.name, st.q) || SS.match(p.description, st.q)) && (st.health === 'all' || SS.health(p)[0] === st.health));
    ps.sort((a, b) => st.sort === 'name' ? a.name.localeCompare(b.name) : st.sort === 'progress' ? SS.progress(b.id).pct - SS.progress(a.id).pct : a.deadline.localeCompare(b.deadline));
    const sel = (key, opts, label) => { const s = h('select', { 'aria-label': label, onchange: () => { st[key] = s.value; SS.page(); } }, opts.map(([v, l]) => h('option', { value: v, selected: v === st[key] }, l))); return s; };
    const vb = (v, l) => h('button', { class: 'btn', type: 'button', 'aria-pressed': String(st.view === v), onclick: () => { st.view = v; SS.page(); } }, l);
    main.replaceChildren(h('div', { class: 'page-head' }, h('div', {}, h('h2', { text: 'Projects' }), h('p', { class: 'muted', text: SS.db.projects.length + ' in this workspace' })),
      h('div', { class: 'bar-tools' }, vb('grid', 'Grid'), vb('list', 'List'), sel('health', [['all', 'All health'], ['On track', 'On track'], ['At risk', 'At risk'], ['Off track', 'Off track'], ['Complete', 'Complete']], 'Filter by health'),
        sel('sort', [['deadline', 'Sort: deadline'], ['name', 'Sort: name'], ['progress', 'Sort: progress']], 'Sort projects'))),
      ps.length ? h('div', { class: 'pgrid ' + st.view }, ps.map(SS.projectCard)) : SS.empty(SS.db.projects.length ? 'No matching projects' : 'No projects yet', SS.db.projects.length ? 'Try a different search or filter.' : 'Create a project to start planning work.', SS.db.projects.length ? null : h('button', { class: 'btn primary', type: 'button', onclick: SS.openProject }, 'Create project')));
  }

  function workspace() {
    const p = SS.project(pid);
    if (!p) { main.replaceChildren(SS.empty('Project not found', 'It may have been removed.', h('a', { class: 'btn', href: 'projects.html' }, 'Back to projects'))); return; }
    SS.setTitle(p.name);
    const ts = SS.db.tasks.filter(t => t.projectId === pid), pr = SS.progress(pid), hl = SS.health(p), counts = SS.statusCounts(ts), own = SS.user(p.ownerId);
    const acts = SS.activityService.list().filter(a => a.projectId === pid);
    const tabs = [['overview', 'Overview'], ['board', 'Board'], ['list', 'List'], ['activity', 'Activity'], ['files', 'Files']];
    const panels = {
      overview: () => h('div', { class: 'cols' }, h('div', { class: 'stack' },
        SS.card('Status breakdown', null, SS.STATUSES.map(([k, l]) => h('div', { class: 'brk' }, h('span', { text: l }), h('div', { class: 'bar' }, h('i', { style: 'width:' + (ts.length ? counts[k] / ts.length * 100 : 0) + '%' })), h('span', { text: counts[k] })))),
        SS.card('Recent activity', null, acts.length ? SS.feedList(acts, 5) : h('p', { class: 'muted', text: 'No activity yet.' }))),
        h('div', { class: 'stack' }, SS.card('Team', null, p.memberIds.map(id => h('div', { class: 'dl' }, h('span', { class: 'who' }, SS.avatar(id), (SS.user(id) || {}).name), h('span', { class: 'muted small', text: (SS.user(id) || {}).role })))),
          SS.card('Upcoming deadlines', null, ts.filter(t => t.status !== 'done').sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5).map(t => h('div', { class: 'dl' }, h('button', { class: 'link', type: 'button', onclick: () => SS.openTask(t.id), text: t.title }), h('span', { class: SS.isOverdue(t) ? 'overdue small' : 'muted small', text: SS.fmtDate(t.dueDate) })))))),
      board: () => ts.length ? SS.board(ts) : SS.empty('No tasks yet', 'Add the first task to this project.'),
      list: () => SS.taskTable(ts, { sort: st.tsort, onSort: k => { st.tsort = { key: k, dir: st.tsort.key === k ? -st.tsort.dir : 1 }; SS.page(); } }),
      activity: () => acts.length ? SS.card('Project activity', null, SS.feedList(acts)) : SS.empty('No activity yet', 'Actions in this project will appear here.'),
      files: () => { const fs = SS.fileService.forProject(pid);
        const inp = h('input', { type: 'file', multiple: true, 'aria-label': 'Select files', onchange: () => { [...inp.files].forEach(f => SS.fileService.add(f, { projectId: pid })); SS.toast('File details saved (not uploaded)', 'ok'); SS.page(); } });
        return SS.card('Files', null, h('p', { class: 'muted small', text: 'Only file names, sizes and types are stored in this browser. Real uploads need Supabase Storage.' }), inp,
          fs.length ? h('ul', { class: 'feed', style: 'margin-top:12px' }, fs.map(a => h('li', {}, h('span', { text: a.fileName }), h('span', { class: 'muted small', text: SS.fmtSize(a.fileSize) + ', ' + a.fileType + ', by ' + ((SS.user(a.uploadedBy) || {}).name || 'Unknown') })))) : h('p', { class: 'muted', style: 'margin-top:12px', text: 'No files selected yet.' })); }
    };
    main.replaceChildren(
      h('div', { class: 'page-head' }, h('div', {}, h('h2', { text: p.name }), h('p', { class: 'muted', text: p.description }), h('p', { class: 'small muted', text: 'Owner: ' + (own ? own.name : 'Unknown') + ', due ' + SS.fmtDate(p.deadline) })),
        h('div', { class: 'bar-tools' }, SS.badge(hl[0], hl[1]), h('button', { class: 'btn primary', type: 'button', onclick: () => SS.openTask(null, { projectId: pid }) }, 'Create task'))),
      h('div', { class: 'card' }, h('div', { class: 'row small muted' }, h('span', { text: pr.done + ' of ' + pr.total + ' tasks complete' }), h('span', { text: pr.pct + '%' })), h('div', { class: 'bar', style: 'margin-top:8px' }, h('i', { style: 'width:' + pr.pct + '%' }))),
      h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([k, l]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(st.tab === k), onclick: () => { st.tab = k; SS.page(); } }, l))), panels[st.tab]());
  }
  SS.page = () => pid ? workspace() : list();
  SS.page();
})();
