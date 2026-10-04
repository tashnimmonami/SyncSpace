(function () {
  const { h } = SS, main = document.getElementById('main');
  SS.page = function () {
    const d = SS.db, ts = d.tasks, hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    const stats = [['Total projects', d.projects.length], ['My tasks', ts.filter(t => t.assigneeId === SS.ME && t.status !== 'done').length], ['Completed tasks', ts.filter(t => t.status === 'done').length], ['Overdue tasks', ts.filter(SS.isOverdue).length]];
    const recent = d.projects.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
    const upcoming = ts.filter(t => t.status !== 'done' && !SS.isOverdue(t)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
    main.replaceChildren(
      h('div', { class: 'page-head' }, h('div', {}, h('h2', { text: greet + ', ' + SS.user(SS.ME).name.split(' ')[0] }), h('p', { class: 'muted', text: "Here's what's happening across your workspace." })),
        h('button', { class: 'btn primary', type: 'button', onclick: SS.openProject }, 'Create project')),
      h('div', { class: 'stats' }, stats.map(([l, v], i) => h('div', { class: 'card stat' + (i === 3 && v ? ' bad' : '') }, h('span', { class: 'muted', text: l }), h('strong', { text: v })))),
      h('div', { class: 'cols' },
        h('div', { class: 'stack' },
          SS.card('Recent projects', h('a', { class: 'link', href: 'projects.html', text: 'View all' }), recent.length ? h('div', { class: 'pgrid' }, recent.map(SS.projectCard)) : SS.empty('No projects yet', 'Create your first project to get started.')),
          SS.card('Recent tasks', h('a', { class: 'link', href: 'tasks.html', text: 'View all' }), SS.taskTable(ts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)))),
        h('div', { class: 'stack' },
          SS.card('Activity', h('a', { class: 'link', href: 'activity.html', text: 'View all' }), SS.feedList(SS.activityService.list(), 6)),
          SS.card('Upcoming deadlines', null, upcoming.length ? upcoming.map(t => h('div', { class: 'dl' }, h('button', { class: 'link', type: 'button', onclick: () => SS.openTask(t.id), text: t.title }), h('span', { class: 'muted small', text: SS.fmtDate(t.dueDate) }))) : h('p', { class: 'muted', text: 'Nothing due soon.' })))));
  };
  SS.page();
})();
