(function () {
  const { h } = SS, main = document.getElementById('main'), f = { type: 'all', project: 'all', user: 'all' };
  SS.page = function () {
    const sel = (key, label, opts) => { const s = h('select', { 'aria-label': label, onchange: () => { f[key] = s.value; SS.page(); } }, h('option', { value: 'all' }, label), opts.map(([v, l]) => h('option', { value: v, selected: v === f[key] }, l))); return s; };
    const items = SS.activityService.list().filter(a => (f.type === 'all' || a.type === f.type) && (f.project === 'all' || a.projectId === f.project) && (f.user === 'all' || a.actorId === f.user));
    main.replaceChildren(h('div', { class: 'page-head' }, h('div', {}, h('h2', { text: 'Team activity' }), h('p', { class: 'muted', text: 'Recorded from actions in this browser. Live updates for other people need the backend.' }))),
      h('div', { class: 'bar-tools' }, sel('type', 'All types', SS.ACTIVITY_TYPES), sel('project', 'All projects', SS.db.projects.map(p => [p.id, p.name])), sel('user', 'All people', SS.db.users.map(u => [u.id, u.name]))),
      items.length ? SS.card('Newest first', null, h('ul', { class: 'feed' }, items.map(a => { const t = SS.db.tasks.find(x => x.id === a.taskId), p = SS.project(a.projectId);
        return h('li', {}, SS.avatar(a.actorId), h('div', {}, h('p', {}, h('strong', { text: (SS.user(a.actorId) || {}).name || 'Someone' }), ' ' + a.description),
          h('p', { class: 'muted small' }, SS.badge((SS.ACTIVITY_TYPES.find(x => x[0] === a.type) || [0, a.type])[1]), ' ' + (p ? p.name : '') + (t ? ', task: ' + t.title : '') + ', ' + SS.rel(a.createdAt)))); }))) : SS.empty('No activity found', 'Try clearing a filter.'));
  };
  SS.page();
})();
