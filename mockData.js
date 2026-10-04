// Demo data, used only on first launch (or after "Reset demo data").
SS.seed = function () {
  const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }; // date n days from today
  const T = hrs => new Date(Date.now() - hrs * 36e5).toISOString(); // timestamp hrs ago
  const users = [['u1', 'Harshit Tiwari', 'Admin'], ['u2', 'Rahul Verma', 'Developer'], ['u3', 'Priya Sharma', 'Designer'], ['u4', 'Aman Gupta', 'Developer'], ['u5', 'Sneha Iyer', 'Marketer']]
    .map(([id, name, role]) => ({ id, name, role, email: name.split(' ')[0].toLowerCase() + '@syncspace.dev', avatar: name.split(' ').map(w => w[0]).join('') }));
  const projects = [
    ['p1', 'Website Redesign', 'Refresh the marketing site with a faster, more accessible design.', 'u1', ['u1', 'u2', 'u3'], -30, 14],
    ['p2', 'Mobile App Development', 'Ship the first version of the companion app for iOS and Android.', 'u2', ['u2', 'u1', 'u4', 'u5'], -45, 40],
    ['p3', 'Marketing Campaign', 'Plan and run the product launch campaign across channels.', 'u3', ['u3', 'u5', 'u1'], -20, 7],
    ['p4', 'Developer Portfolio', 'Showcase open-source work and case studies in one portfolio site.', 'u1', ['u1', 'u4'], -25, 21],
    ['p5', 'Customer Dashboard', 'Give customers a live view of usage, billing and support activity.', 'u4', ['u4', 'u2', 'u3'], -15, 60]
  ].map(([id, name, description, ownerId, memberIds, s, e]) => ({ id, name, description, ownerId, memberIds, startDate: D(s), deadline: D(e), createdAt: T(-s * 24) }));
  // [project, title, assignee, status, priority, due-in-days]
  const tasks = [
    ['p1', 'Audit existing site navigation', 'u3', 'done', 'high', -10], ['p1', 'Design new homepage wireframes', 'u3', 'review', 'high', 2],
    ['p1', 'Build responsive hero section', 'u1', 'progress', 'high', 5], ['p1', 'Migrate blog content', 'u2', 'todo', 'medium', 10],
    ['p2', 'Set up authentication flow', 'u2', 'done', 'high', -6], ['p2', 'Implement push notifications', 'u4', 'progress', 'medium', 12],
    ['p2', 'Offline sync for tasks', 'u2', 'todo', 'high', -1], ['p3', 'Draft launch announcement', 'u3', 'progress', 'medium', 3],
    ['p3', 'Schedule social posts', 'u5', 'todo', 'low', 6], ['p3', 'Collect customer testimonials', 'u5', 'done', 'low', -4],
    ['p4', 'Write case study for first project', 'u1', 'todo', 'medium', -2], ['p4', 'Deploy portfolio to hosting', 'u4', 'progress', 'high', 9],
    ['p5', 'Define dashboard metrics', 'u4', 'done', 'medium', -8], ['p5', 'Build chart components', 'u2', 'progress', 'high', 18],
    ['p5', 'Review accessibility of filters', 'u3', 'review', 'medium', 8], ['p5', 'Write API integration notes', 'u1', 'todo', 'low', 25]
  ].map(([projectId, title, assigneeId, status, priority, due], i) => ({
    id: 't' + (i + 1), projectId, title, assigneeId, status, priority, dueDate: D(due),
    description: 'Track progress, blockers and handoffs for this task here.', version: 1, createdAt: T(240), updatedAt: T(i * 5 + 2)
  }));
  const comments = [['t2', 'u1', 'Can we share the first draft by Friday?', 20], ['t2', 'u3', 'Yes, sending the design link tomorrow.', 18], ['t3', 'u2', 'Hero looks good on tablet, checking mobile next.', 5], ['t8', 'u3', 'Draft is ready for review.', 30], ['t7', 'u1', 'Blocked on the sync API, flagging this.', 3]]
    .map(([taskId, authorId, content, hrs], i) => ({ id: 'c' + (i + 1), taskId, authorId, content, createdAt: T(hrs) }));
  const attachments = [['t2', 'u3', 'homepage-wireframes.pdf', 482000, 'application/pdf', 22], ['t8', 'u3', 'launch-copy.docx', 36000, 'application/msword', 31]]
    .map(([taskId, uploadedBy, fileName, fileSize, fileType, hrs], i) => ({ id: 'f' + (i + 1), taskId, projectId: tasks.find(t => t.id === taskId).projectId, uploadedBy, fileName, fileSize, fileType, createdAt: T(hrs) }));
  // [project, actor, task, type, description, hours ago]
  const activities = [
    ['p1', 'u1', null, 'project_created', 'created project "Website Redesign"', 700], ['p3', 'u5', 't10', 'status_changed', 'completed "Collect customer testimonials"', 96],
    ['p2', 'u2', 't7', 'task_updated', 'updated "Offline sync for tasks"', 12], ['p1', 'u3', 't2', 'comment_added', 'commented on "Design new homepage wireframes"', 18],
    ['p5', 'u4', 't13', 'status_changed', 'completed "Define dashboard metrics"', 60], ['p3', 'u3', 't8', 'comment_added', 'commented on "Draft launch announcement"', 30],
    ['p2', 'u1', 't7', 'comment_added', 'commented on "Offline sync for tasks"', 3], ['p4', 'u1', 't11', 'deadline_changed', 'changed the deadline of "Write case study for first project"', 50]
  ].map(([projectId, actorId, taskId, type, description, hrs], i) => ({ id: 'a' + (i + 1), projectId, actorId, taskId, type, description, createdAt: T(hrs) }));
  return { users, projects, tasks, comments, attachments, activities };
};
