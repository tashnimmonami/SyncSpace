// Data layer: localStorage + "service" objects + helpers.
// When we add Supabase, replace the bodies of the services below; the UI code stays the same.
(function () {
  SS.defaultPrefs = { name: 'Harshit Tiwari', email: 'harshit@syncspace.dev', theme: 'light', notif: { assign: true, comment: true, deadline: true }, workspace: 'Acme Studio', compact: false, collapsed: false };
  const valid = d => d && typeof d === 'object' && ['users', 'projects', 'tasks', 'comments', 'attachments', 'activities'].every(k => Array.isArray(d[k]));

  SS.save = () => { try { localStorage.setItem(SS.KEYS.db, JSON.stringify(SS.db)); } catch (e) { console.warn('Could not save', e); } };
  SS.resetDb = () => { SS.db = SS.seed(); SS.save(); };
  try { const d = JSON.parse(localStorage.getItem(SS.KEYS.db)); if (valid(d)) SS.db = d; } catch (e) { /* fall through to seed */ }
  if (!SS.db) SS.resetDb(); // seeds only when nothing valid is stored
  SS.db.tasks = SS.db.tasks.filter(t => t && t.id && t.title && t.projectId);

  SS.loadPrefs = () => { let p = {}; try { p = JSON.parse(localStorage.getItem(SS.KEYS.prefs)) || {}; } catch (e) { /* use defaults */ }
    return Object.assign({}, SS.defaultPrefs, p, { notif: Object.assign({}, SS.defaultPrefs.notif, p.notif) }); };
  SS.prefs = SS.loadPrefs();
  SS.savePrefs = () => localStorage.setItem(SS.KEYS.prefs, JSON.stringify(SS.prefs));

  // ---------- helpers ----------
  SS.uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  SS.now = () => new Date().toISOString();
  SS.today = () => new Date().toISOString().slice(0, 10);
  SS.user = id => SS.db.users.find(u => u.id === id);
  SS.project = id => SS.db.projects.find(p => p.id === id);
  SS.isOverdue = t => t.status !== 'done' && !!t.dueDate && t.dueDate < SS.today();
  SS.fmtDate = s => s ? new Date(s.length === 10 ? s + 'T00:00:00' : s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';
  SS.fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  SS.rel = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; if (m < 1440) return Math.round(m / 60) + ' h ago'; if (m < 43200) return Math.round(m / 1440) + ' d ago'; return SS.fmtDate(iso); };
  SS.progress = pid => { const ts = SS.db.tasks.filter(t => t.projectId === pid), done = ts.filter(t => t.status === 'done').length; return { total: ts.length, done, pct: ts.length ? Math.round(done / ts.length * 100) : 0 }; };
  SS.statusCounts = ts => Object.fromEntries(SS.STATUSES.map(([k]) => [k, ts.filter(t => t.status === k).length]));
  SS.health = p => { const od = SS.db.tasks.filter(t => t.projectId === p.id && SS.isOverdue(t)).length, pr = SS.progress(p.id);
    if (pr.total && pr.done === pr.total) return ['Complete', 'ok']; if (od >= 2 || p.deadline < SS.today()) return ['Off track', 'bad']; if (od === 1) return ['At risk', 'warn']; return ['On track', 'ok']; };

  // ---------- services ----------
  SS.activityService = {
    add(projectId, type, description, taskId) { SS.db.activities.unshift({ id: SS.uid('a'), projectId, actorId: SS.ME, taskId: taskId || null, type, description, createdAt: SS.now() }); },
    list() { return SS.db.activities.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  };
  SS.projectService = {
    create(v) { const p = { id: SS.uid('p'), name: v.name, description: v.description, ownerId: v.ownerId, memberIds: [...new Set([v.ownerId, ...v.memberIds])], startDate: v.startDate, deadline: v.deadline, createdAt: SS.now() };
      SS.db.projects.push(p); SS.activityService.add(p.id, 'project_created', 'created project "' + p.name + '"'); SS.save(); return { ok: true, project: p }; }
  };
  SS.taskService = {
    create(v) { const t = Object.assign({ id: SS.uid('t'), version: 1, createdAt: SS.now(), updatedAt: SS.now() }, v);
      SS.db.tasks.push(t); SS.activityService.add(t.projectId, 'task_created', 'created "' + t.title + '"', t.id);
      if (t.assigneeId !== SS.ME) SS.activityService.add(t.projectId, 'task_assigned', 'assigned "' + t.title + '" to ' + SS.user(t.assigneeId).name, t.id);
      SS.save(); return { ok: true, task: t }; },
    // All edits go through here. With Supabase this becomes ONE atomic update "where id = X and version = expected".
    update(id, ch, expected) {
      const t = SS.db.tasks.find(x => x.id === id); if (!t) return { ok: false, error: 'Task not found.' };
      if (expected !== undefined && t.version !== expected) return { ok: false, conflict: true, error: 'This task changed since you opened it. Close it and reopen to see the latest version.' };
      const keys = Object.keys(ch).filter(k => t[k] !== ch[k]); if (!keys.length) return { ok: true, task: t };
      const old = Object.assign({}, t); Object.assign(t, ch); t.version++; t.updatedAt = SS.now();
      const log = (type, text) => SS.activityService.add(t.projectId, type, text, t.id);
      if (keys.includes('status')) log('status_changed', old.status !== 'done' && t.status === 'done' ? 'completed "' + t.title + '"' : 'moved "' + t.title + '" to ' + SS.STATUSES.find(s => s[0] === t.status)[1]);
      if (keys.includes('assigneeId')) log('task_assigned', 'assigned "' + t.title + '" to ' + SS.user(t.assigneeId).name);
      if (keys.includes('dueDate')) log('deadline_changed', 'changed the deadline of "' + t.title + '" to ' + SS.fmtDate(t.dueDate));
      if (keys.some(k => !['status', 'assigneeId', 'dueDate'].includes(k))) log('task_updated', 'updated "' + t.title + '"');
      SS.save(); return { ok: true, task: t };
    },
    remove(id) { const t = SS.db.tasks.find(x => x.id === id); if (!t) return;
      SS.db.tasks = SS.db.tasks.filter(x => x.id !== id); SS.db.comments = SS.db.comments.filter(c => c.taskId !== id); SS.db.attachments = SS.db.attachments.filter(a => a.taskId !== id);
      SS.activityService.add(t.projectId, 'task_updated', 'deleted task "' + t.title + '"'); SS.save(); }
  };
  SS.commentService = {
    forTask: id => SS.db.comments.filter(c => c.taskId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    add(taskId, text) { text = (text || '').trim(); if (!text) return { ok: false, error: 'Write something before posting.' };
      const t = SS.db.tasks.find(x => x.id === taskId); if (!t) return { ok: false, error: 'Task not found.' };
      SS.db.comments.push({ id: SS.uid('c'), taskId, authorId: SS.ME, content: text, createdAt: SS.now() });
      SS.activityService.add(t.projectId, 'comment_added', 'commented on "' + t.title + '"', taskId); SS.save(); return { ok: true }; }
  };
  // Only file METADATA is stored. Supabase Storage will upload the real file later.
  SS.fileService = {
    add(file, { taskId, projectId }) { const t = taskId && SS.db.tasks.find(x => x.id === taskId);
      SS.db.attachments.push({ id: SS.uid('f'), taskId: taskId || null, projectId: t ? t.projectId : projectId, uploadedBy: SS.ME, fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', createdAt: SS.now() });
      SS.activityService.add(t ? t.projectId : projectId, 'attachment_added', 'selected file "' + file.name + '"' + (t ? ' on "' + t.title + '"' : ''), taskId); SS.save(); },
    forProject: pid => SS.db.attachments.filter(a => a.projectId === pid)
  };
})();
