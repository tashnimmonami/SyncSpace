(function () {

  SS.defaultPrefs = {
    name: "Your Name",
    email: "example@gmail.com",
    theme: "light",
    notif: {
      assign: true,
      comment: true,
      deadline: true
    },
    workspace: "Acme Studio",
    compact: false,
    collapsed: false
  };


  const valid = d =>
    d &&
    typeof d === "object" &&
    [
      "users",
      "projects",
      "tasks",
      "comments",
      "attachments",
      "activities"
    ].every(k => Array.isArray(d[k]));

  SS.save = () => {
    try {
      localStorage.setItem(
        SS.KEYS.db,
        JSON.stringify(SS.db)
      );
    } catch (e) {
      console.warn("Could not save local data:", e);
    }
  };

  SS.resetDb = () => {
    SS.db = SS.seed();
    SS.save();
  };

  try {
    const stored = JSON.parse(
      localStorage.getItem(SS.KEYS.db)
    );

    if (valid(stored)) {
      SS.db = stored;
    }
  } catch (e) {
    
  }

  if (!SS.db) {
    SS.resetDb();
  }

  SS.db.tasks = SS.db.tasks.filter(
    t => t && t.id && t.title && t.projectId
  );

  

  SS.loadPrefs = () => {
    let p = {};

    try {
      p =
        JSON.parse(
          localStorage.getItem(SS.KEYS.prefs)
        ) || {};
    } catch (e) {
      
    }

    return Object.assign(
      {},
      SS.defaultPrefs,
      p,
      {
        notif: Object.assign(
          {},
          SS.defaultPrefs.notif,
          p.notif
        )
      }
    );
  };

  SS.prefs = SS.loadPrefs();

  SS.savePrefs = () => {
    localStorage.setItem(
      SS.KEYS.prefs,
      JSON.stringify(SS.prefs)
    );
  };

  

  SS.uid = p =>
    p +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);

  SS.now = () => new Date().toISOString();

  SS.today = () => new Date().toISOString().slice(0, 10);

  SS.user = id =>
    SS.db.users.find(u => u.id === id);

  SS.project = id =>
    SS.db.projects.find(p => p.id === id);

  SS.isOverdue = t =>
    t.status !== "done" &&
    !!t.dueDate &&
    t.dueDate < SS.today();

  SS.fmtDate = s =>
    s
      ? new Date(
          s.length === 10 ? s + "T00:00:00" : s
        ).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : "No date";

  SS.fmtSize = n =>
    n > 1048576
      ? (n / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(n / 1024)) + " KB";

  SS.rel = iso => {
    const m = Math.round(
      (Date.now() - new Date(iso)) / 60000
    );

    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    if (m < 1440) return Math.round(m / 60) + " h ago";
    if (m < 43200) return Math.round(m / 1440) + " d ago";

    return SS.fmtDate(iso);
  };

  SS.progress = pid => {
    const tasks = SS.db.tasks.filter(
      t => t.projectId === pid
    );

    const done = tasks.filter(
      t => t.status === "done"
    ).length;

    return {
      total: tasks.length,
      done,
      pct: tasks.length
        ? Math.round((done / tasks.length) * 100)
        : 0
    };
  };

  SS.statusCounts = tasks =>
    Object.fromEntries(
      SS.STATUSES.map(([key]) => [
        key,
        tasks.filter(t => t.status === key).length
      ])
    );

  SS.health = project => {
    const overdue = SS.db.tasks.filter(
      t =>
        t.projectId === project.id &&
        SS.isOverdue(t)
    ).length;

    const progress = SS.progress(project.id);

    if (
      progress.total &&
      progress.done === progress.total
    ) {
      return ["Complete", "ok"];
    }

    if (
      overdue >= 2 ||
      project.deadline < SS.today()
    ) {
      return ["Off track", "bad"];
    }

    if (overdue === 1) {
      return ["At risk", "warn"];
    }

    return ["On track", "ok"];
  };

  

  SS.activityService = {
    add(projectId, type, description, taskId) {
      SS.db.activities.unshift({
        id: SS.uid("a"),
        projectId,
        actorId: SS.ME,
        taskId: taskId || null,
        type,
        description,
        createdAt: SS.now()
      });
    },

    list() {
      return SS.db.activities
        .slice()
        .sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
    }
  };

  

  SS.projectService = {
    async create(v) {
      if (
        typeof supabaseClient === "undefined"
      ) {
        return {
          ok: false,
          error: "Supabase is not configured. Check supabaseClient.js."
        };
      }

      
      const {
        data: { user },
        error: authError
      } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        return {
          ok: false,
          error: "Please sign in before creating a project."
        };
      }

      
      const {
        data: project,
        error
      } = await supabaseClient
        .from("projects")
        .insert({
          name: v.name,
          description: v.description || "",
          owner_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Supabase project creation failed:",
          error
        );

        return {
          ok: false,
          error: error.message
        };
      }

      
      const p = {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.owner_id,
        memberIds: [user.id],
        startDate: v.startDate,
        deadline: v.deadline,
        createdAt: project.created_at
      };

      
      const existingIndex = SS.db.projects.findIndex(
        item => item.id === p.id
      );

      if (existingIndex === -1) {
        SS.db.projects.push(p);
      } else {
        SS.db.projects[existingIndex] = p;
      }

      SS.save();

      return {
        ok: true,
        project: p
      };
    }
  };


  SS.taskService = {
    create(v) {
      const task = Object.assign(
        {
          id: SS.uid("t"),
          version: 1,
          createdAt: SS.now(),
          updatedAt: SS.now()
        },
        v
      );

      SS.db.tasks.push(task);

      SS.activityService.add(
        task.projectId,
        "task_created",
        'created "' + task.title + '"',
        task.id
      );

      const assignee = SS.user(task.assigneeId);

      if (
        task.assigneeId !== SS.ME &&
        assignee
      ) {
        SS.activityService.add(
          task.projectId,
          "task_assigned",
          'assigned "' +
            task.title +
            '" to ' +
            assignee.name,
          task.id
        );
      }

      SS.save();

      return {
        ok: true,
        task
      };
    },

    update(id, changes, expected) {
      const task = SS.db.tasks.find(
        t => t.id === id
      );

      if (!task) {
        return {
          ok: false,
          error: "Task not found."
        };
      }

      if (
        expected !== undefined &&
        task.version !== expected
      ) {
        return {
          ok: false,
          conflict: true,
          error:
            "This task changed since you opened it. Close it and reopen to see the latest version."
        };
      }

      const keys = Object.keys(changes).filter(
        key => task[key] !== changes[key]
      );

      if (!keys.length) {
        return {
          ok: true,
          task
        };
      }

      const old = Object.assign({}, task);

      Object.assign(task, changes);

      task.version++;
      task.updatedAt = SS.now();

      const log = (type, description) => {
        SS.activityService.add(
          task.projectId,
          type,
          description,
          task.id
        );
      };

      if (keys.includes("status")) {
        const status = SS.STATUSES.find(
          s => s[0] === task.status
        );

        log(
          "status_changed",
          old.status !== "done" &&
            task.status === "done"
            ? 'completed "' + task.title + '"'
            : 'moved "' +
                task.title +
                '" to ' +
                (status ? status[1] : task.status)
        );
      }

      if (keys.includes("assigneeId")) {
        const assignee = SS.user(task.assigneeId);

        if (assignee) {
          log(
            "task_assigned",
            'assigned "' +
              task.title +
              '" to ' +
              assignee.name
          );
        }
      }

      if (keys.includes("dueDate")) {
        log(
          "deadline_changed",
          'changed the deadline of "' +
            task.title +
            '" to ' +
            SS.fmtDate(task.dueDate)
        );
      }

      if (
        keys.some(
          key =>
            ![
              "status",
              "assigneeId",
              "dueDate"
            ].includes(key)
        )
      ) {
        log(
          "task_updated",
          'updated "' + task.title + '"'
        );
      }

      SS.save();

      return {
        ok: true,
        task
      };
    },

    remove(id) {
      const task = SS.db.tasks.find(
        t => t.id === id
      );

      if (!task) return;

      SS.db.tasks = SS.db.tasks.filter(
        t => t.id !== id
      );

      SS.db.comments = SS.db.comments.filter(
        c => c.taskId !== id
      );

      SS.db.attachments = SS.db.attachments.filter(
        a => a.taskId !== id
      );

      SS.activityService.add(
        task.projectId,
        "task_updated",
        'deleted task "' + task.title + '"'
      );

      SS.save();
    }
  };

  

  SS.commentService = {
    forTask(id) {
      return SS.db.comments
        .filter(c => c.taskId === id)
        .sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
        );
    },

    add(taskId, text) {
      text = (text || "").trim();

      if (!text) {
        return {
          ok: false,
          error: "Write something before posting."
        };
      }

      const task = SS.db.tasks.find(
        t => t.id === taskId
      );

      if (!task) {
        return {
          ok: false,
          error: "Task not found."
        };
      }

      SS.db.comments.push({
        id: SS.uid("c"),
        taskId,
        authorId: SS.ME,
        content: text,
        createdAt: SS.now()
      });

      SS.activityService.add(
        task.projectId,
        "comment_added",
        'commented on "' + task.title + '"',
        taskId
      );

      SS.save();

      return {
        ok: true
      };
    }
  };

  

  SS.fileService = {
    add(file, { taskId, projectId }) {
      const task =
        taskId &&
        SS.db.tasks.find(t => t.id === taskId);

      const actualProjectId = task
        ? task.projectId
        : projectId;

      SS.db.attachments.push({
        id: SS.uid("f"),
        taskId: taskId || null,
        projectId: actualProjectId,
        uploadedBy: SS.ME,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "unknown",
        createdAt: SS.now()
      });

      SS.activityService.add(
        actualProjectId,
        "attachment_added",
        'selected file "' +
          file.name +
          '"' +
          (task
            ? ' on "' + task.title + '"'
            : ""),
        taskId
      );

      SS.save();
    },

    forProject(pid) {
      return SS.db.attachments.filter(
        a => a.projectId === pid
      );
    }
  };
})();