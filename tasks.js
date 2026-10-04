(function () {
  const { h } = SS, main = document.getElementById('main'), qs = new URLSearchParams(location.search);
  const f = { q: (qs.get('q') || '').toLowerCase(), status: 'all', priority: 'all', project: 'all', assignee: qs.get('mine') ? SS.ME : 'all', dir: 1, view: 'list' };
  SS.onSearch = v => { f.q = v; SS.page(); };
  const q0 = document.querySelector('.search input'); if (q0 && qs.get('q')) q0.value = qs.get('q');
  SS.page = function () {
    const sel = (key, label, opts) => { const s = h('select', { 'aria-label': label, onchange: () => { f[key] = s.value; SS.page(); } }, h('option', { value: 'all' }, label), opts.map(([v, l]) => h('option', { value: v, selected: v === f[key] }, l))); s.value = f[key]; return s; };
    const ts = SS.db.tasks.filter(t => (SS.match(t.title, f.q) || SS.match(t.description, f.q)) && (f.status === 'all' || t.status === f.status) && (f.priority === 'all' || t.priority === f.priority) && (f.project === 'all' || t.projectId === f.project) && (f.assignee === 'all' || t.assigneeId === f.assignee))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) * f.dir);
    const sort = h('select', { 'aria-label': 'Sort by deadline', onchange: () => { f.dir = +sort.value; SS.page(); } }, h('option', { value: '1', selected: f.dir === 1 }, 'Deadline: soonest'), h('option', { value: '-1', selected: f.dir === -1 }, 'Deadline: latest'));
    const vb = (v, l) => h('button', { class: 'btn', type: 'button', 'aria-pressed': String(f.view === v), onclick: () => { f.view = v; SS.page(); } }, l);
    main.replaceChildren(h('div', { class: 'page-head' }, h('div', {}, h('h2', { text: 'Tasks' }), h('p', { class: 'muted', text: ts.length + ' of ' + SS.db.tasks.length + ' tasks shown' })), h('div', { class: 'bar-tools' }, vb('list', 'List'), vb('board', 'Board'))),
      h('div', { class: 'bar-tools' }, sel('status', 'All statuses', SS.STATUSES), sel('priority', 'All priorities', SS.PRIORITIES.map(p => [p, SS.cap(p)])), sel('project', 'All projects', SS.db.projects.map(p => [p.id, p.name])), sel('assignee', 'All assignees', SS.db.users.map(u => [u.id, u.name])), sort),
      f.view === 'list' ? SS.taskTable(ts) : (ts.length ? SS.board(ts) : SS.empty('No tasks found', 'Try changing your filters or create a new task.', h('button', { class: 'btn primary', type: 'button', onclick: () => SS.openTask(null) }, 'Create task'))));
  };
  SS.page();
})();
