// Shared constants. Everything lives on one global object: SS (SyncSpace).
const SS = {
  KEYS: { db: 'syncspace_db_v1', prefs: 'syncspace_prefs_v1' }, // same keys on every page
  ME: 'u1', // demo "current user" (Harshit). Supabase auth will replace this later.
  STATUSES: [['todo', 'To Do'], ['progress', 'In Progress'], ['review', 'In Review'], ['done', 'Done']],
  PRIORITIES: ['low', 'medium', 'high'],
  ACTIVITY_TYPES: [['project_created', 'Project created'], ['task_created', 'Task created'], ['task_assigned', 'Task assigned'], ['status_changed', 'Status changed'], ['deadline_changed', 'Deadline changed'], ['task_updated', 'Task updated'], ['comment_added', 'Comment added'], ['attachment_added', 'Attachment selected']]
};
