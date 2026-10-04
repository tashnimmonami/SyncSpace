(function () {
  const h = SS.h = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);

    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;

      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }

    kids.flat(2).forEach(c => {
      if (c != null && c !== false) {
        e.append(c.nodeType ? c : document.createTextNode(c));
      }
    });

    return e;
  };

  const IC = {
    menu: "M4 6h16M4 12h16M4 18h16",
    bell: "M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20h4",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
    x: "M6 6l12 12M18 6L6 18",
    sun: "M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M5.64 18.36l1.42-1.42M16.94 7.06l-1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    moon: "M20.2 15.5A8.5 8.5 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z",
    home: "M3 12l9-8 9 8M5 10v10h14V10",
    check: "M5 12l4 4 10-10",
    folder: "M3 7h18v12H3zM3 7l3-3h6l2 3",
    pulse: "M3 12h4l3-8 4 16 3-8h4",
    gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3"
  };

  SS.icon = d => {
    const ns = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(ns, "svg");
    const p = document.createElementNS(ns, "path");

    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("class", "ico");
    s.setAttribute("aria-hidden", "true");
    p.setAttribute("d", d);
    s.append(p);

    return s;
  };

  SS.avatar = uid => {
    const u = SS.user(uid);
    const n = u ? u.name : "?";
    const hue = [...String(uid)].reduce(
      (a, c) => a + c.charCodeAt(0) * 7,
      0
    ) % 360;

    return h(
      "span",
      {
        class: "av",
        style: "background:hsl(" + hue + " 50% 42%)",
        title: n,
        "aria-label": n
      },
      n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    );
  };

  SS.refresh = () => {
    if (SS.page) SS.page();
  };

  SS.match = (text, q) =>
    !q || String(text).toLowerCase().includes(q);

  SS.statusLabel = s =>
    (SS.STATUSES.find(x => x[0] === s) || [0, s])[1];

  SS.cap = s => s[0].toUpperCase() + s.slice(1);

  SS.toast = (msg, kind) => {
    let box = document.querySelector(".toasts");

    if (!box) {
      box = h("div", {
        class: "toasts",
        "aria-live": "polite"
      });
      document.body.append(box);
    }

    const t = h("div", {
      class: "toast " + (kind || ""),
      text: msg
    });

    box.append(t);
    setTimeout(() => t.remove(), 3500);
  };

  SS.modal = function (title, body, opt = {}) {
    const prev = document.activeElement;

    const m = {
      close(force) {
        if (
          !force &&
          opt.isDirty &&
          opt.isDirty() &&
          !confirm("Discard your unsaved changes?")
        ) {
          return;
        }

        wrap.remove();

        if (prev && prev.focus) prev.focus();
      }
    };

    const box = h(
      "div",
      {
        class: "modal" + (opt.wide ? " wide" : ""),
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        tabindex: "-1"
      },
      h(
        "div",
        { class: "mh" },
        h("h2", { text: title }),
        h(
          "button",
          {
            class: "icon-btn",
            type: "button",
            "aria-label": "Close",
            onclick: () => m.close()
          },
          SS.icon(IC.x)
        )
      ),
      h("div", { class: "mb" }, body)
    );

    const wrap = h(
      "div",
      {
        class: "overlay",
        onclick: e => {
          if (e.target === wrap) m.close();
        },
        onkeydown: e => {
          if (e.key === "Escape") m.close();

          if (e.key === "Tab") {
            const f = [
              ...box.querySelectorAll(
                "button,input,select,textarea,a[href]"
              )
            ].filter(x => !x.disabled);

            const a = document.activeElement;

            if (
              f.length &&
              e.shiftKey &&
              (a === f[0] || a === box)
            ) {
              e.preventDefault();
              f[f.length - 1].focus();
            } else if (
              f.length &&
              !e.shiftKey &&
              a === f[f.length - 1]
            ) {
              e.preventDefault();
              f[0].focus();
            }
          }
        }
      },
      box
    );

    document.body.append(wrap);
    (box.querySelector("input,select,textarea") || box).focus();

    return m;
  };

  SS.badge = (txt, cls) =>
    h("span", {
      class: "badge " + (cls || ""),
      text: txt
    });

  SS.prioBadge = p =>
    SS.badge(
      SS.cap(p),
      p === "high" ? "bad" : p === "medium" ? "warn" : ""
    );

  SS.changeStatus = (id, status) => {
    const t = SS.db.tasks.find(x => x.id === id);
    const r = SS.taskService.update(id, { status }, t.version);

    SS.toast(
      r.ok
        ? "Status changed to " + SS.statusLabel(status)
        : r.error,
      r.ok ? "ok" : "error"
    );

    SS.refresh();
  };

  SS.statusSelect = t => {
    const s = h(
      "select",
      {
        class: "inline-sel",
        "aria-label": "Status for " + t.title,
        onchange: () => SS.changeStatus(t.id, s.value)
      },
      SS.STATUSES.map(([v, l]) =>
        h("option", {
          value: v,
          selected: v === t.status
        }, l)
      )
    );

    return s;
  };

  SS.empty = (title, text, btn) =>
    h(
      "div",
      { class: "empty" },
      h("h3", { text: title }),
      h("p", { text }),
      btn ? h("p", {}, btn) : null
    );

  SS.card = (title, link, ...kids) =>
    h(
      "section",
      { class: "card" },
      h("div", { class: "ch" }, h("h3", { text: title }), link || null),
      kids
    );

  SS.feedList = (items, limit) =>
    h(
      "ul",
      { class: "feed" },
      items.slice(0, limit || 99).map(a => {
        const u = SS.user(a.actorId);
        const p = SS.project(a.projectId);

        return h(
          "li",
          {},
          SS.avatar(a.actorId),
          h(
            "div",
            {},
            h(
              "p",
              {},
              h("strong", {
                text: u ? u.name.split(" ")[0] : "Someone"
              }),
              " " + a.description
            ),
            h("p", {
              class: "muted small",
              text:
                (p ? p.name + " · " : "") +
                SS.rel(a.createdAt)
            })
          )
        );
      })
    );

  if (!SS.db.activities.length) {
    SS.feedList = () =>
      SS.empty(
        "No activity yet",
        "Actions you take will show up here."
      );
  }

  SS.projectCard = p => {
    const pr = SS.progress(p.id);
    const hl = SS.health(p);
    const own = SS.user(p.ownerId);

    return h(
      "a",
      {
        class: "card pcard",
        href: "projects.html?id=" + encodeURIComponent(p.id)
      },
      h(
        "div",
        { class: "row" },
        h("strong", { text: p.name }),
        SS.badge(hl[0], hl[1])
      ),
      h("p", { text: p.description }),
      h(
        "div",
        {
          class: "bar",
          role: "progressbar",
          "aria-valuenow": pr.pct,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-label": p.name + " progress"
        },
        h("i", { style: "width:" + pr.pct + "%" })
      ),
      h(
        "div",
        { class: "row small muted" },
        h("span", {
          text:
            pr.done +
            " of " +
            pr.total +
            " tasks done (" +
            pr.pct +
            "%)"
        }),
        h("span", { text: "Due " + SS.fmtDate(p.deadline) })
      ),
      h(
        "div",
        { class: "row" },
        h("span", {
          class: "small muted",
          text: "Owner: " + (own ? own.name : "Unknown")
        }),
        h("span", { class: "avs" }, p.memberIds.map(SS.avatar))
      )
    );
  };

  SS.taskTable = function (tasks, o = {}) {
    const st = o.sort || { key: "dueDate", dir: 1 };

    const cols = [
      ["title", "Task"],
      ["project", "Project"],
      ["assignee", "Assignee"],
      ["priority", "Priority"],
      ["status", "Status"],
      ["dueDate", "Deadline"]
    ];

    const val = (t, k) =>
      k === "project"
        ? (SS.project(t.projectId) || {}).name || ""
        : k === "assignee"
        ? (SS.user(t.assigneeId) || {}).name || ""
        : k === "priority"
        ? SS.PRIORITIES.indexOf(t.priority)
        : k === "status"
        ? SS.STATUSES.findIndex(s => s[0] === t.status)
        : t[k] || "";

    const rows = o.sort
      ? tasks.slice().sort((a, b) =>
          (
            val(a, st.key) > val(b, st.key)
              ? 1
              : val(a, st.key) < val(b, st.key)
              ? -1
              : 0
          ) * st.dir
        )
      : tasks;

    if (!rows.length) {
      return SS.empty(
        "No tasks found",
        "Try changing your filters or create a new task."
      );
    }

    return h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        {},
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            cols.map(([k, l]) =>
              h(
                "th",
                {
                  scope: "col",
                  "aria-sort":
                    o.sort && st.key === k
                      ? st.dir > 0
                        ? "ascending"
                        : "descending"
                      : "none"
                },
                o.onSort
                  ? h(
                      "button",
                      {
                        type: "button",
                        onclick: () => o.onSort(k)
                      },
                      l +
                        (st.key === k
                          ? st.dir > 0
                            ? " ▲"
                            : " ▼"
                          : "")
                    )
                  : l
              )
            )
          )
        ),
        h(
          "tbody",
          {},
          rows.map(t => {
            const p = SS.project(t.projectId);
            const u = SS.user(t.assigneeId);

            return h(
              "tr",
              {},
              h(
                "td",
                {},
                h(
                  "button",
                  {
                    class: "link",
                    type: "button",
                    onclick: () => SS.openTask(t.id),
                    text: t.title
                  }
                )
              ),
              h("td", { text: p ? p.name : "" }),
              h(
                "td",
                {},
                h(
                  "span",
                  { class: "who" },
                  SS.avatar(t.assigneeId),
                  u ? u.name : "Unassigned"
                )
              ),
              h("td", {}, SS.prioBadge(t.priority)),
              h("td", {}, SS.statusSelect(t)),
              h("td", {
                class: SS.isOverdue(t) ? "overdue" : "",
                text:
                  SS.fmtDate(t.dueDate) +
                  (SS.isOverdue(t) ? " (overdue)" : "")
              })
            );
          })
        )
      )
    );
  };

  SS.board = function (tasks) {
    return h(
      "div",
      { class: "board" },
      SS.STATUSES.map(([key, label]) => {
        const items = tasks.filter(t => t.status === key);

        const col = h(
          "section",
          {
            class: "col",
            "aria-label": label,
            ondragover: e => {
              e.preventDefault();
              col.classList.add("over");
            },
            ondragleave: () => col.classList.remove("over"),
            ondrop: e => {
              e.preventDefault();
              col.classList.remove("over");

              const id = e.dataTransfer.getData("text/plain");
              const t = SS.db.tasks.find(x => x.id === id);

              if (t && t.status !== key) {
                SS.changeStatus(id, key);
              }
            }
          },
          h(
            "header",
            {},
            h("h3", { text: label }),
            h("span", { class: "count", text: items.length })
          ),
          items.map(t => {
            const p = SS.project(t.projectId);
            const nc = SS.db.comments.filter(c => c.taskId === t.id).length;
            const nf = SS.db.attachments.filter(a => a.taskId === t.id).length;

            return h(
              "div",
              {
                class: "tcard",
                draggable: "true",
                ondragstart: e => e.dataTransfer.setData("text/plain", t.id)
              },
              h(
                "button",
                {
                  class: "link",
                  type: "button",
                  onclick: () => SS.openTask(t.id),
                  text: t.title
                }
              ),
              h("span", {
                class: "small muted",
                text: p ? p.name : ""
              }),
              h(
                "div",
                { class: "row" },
                SS.prioBadge(t.priority),
                SS.avatar(t.assigneeId)
              ),
              h(
                "div",
                { class: "row small muted" },
                h("span", {
                  class: SS.isOverdue(t) ? "overdue" : "",
                  text: SS.fmtDate(t.dueDate)
                }),
                h("span", { text: nc + " comments, " + nf + " files" })
              ),
              SS.statusSelect(t)
            );
          }),
          items.length
            ? null
            : h("p", { class: "muted small", text: "No tasks" })
        );

        return col;
      })
    );
  };

  SS.openTask = function (id, defaults) {
    const t = id ? SS.db.tasks.find(x => x.id === id) : null;

    if (id && !t) return;

    if (!SS.db.projects.length) {
      SS.toast("Create a project before adding tasks.", "error");
      return;
    }

    const d = t || Object.assign({
      projectId: SS.db.projects[0].id,
      title: "",
      description: "",
      assigneeId: SS.ME,
      status: "todo",
      priority: "medium",
      dueDate: ""
    }, defaults);

    const opts = (arr, v) =>
      arr.map(([val, l]) =>
        h("option", { value: val, selected: val === v }, l)
      );

    const fld = (l, el) =>
      h("label", { class: "fld" }, h("span", { text: l }), el);

    const title = h("input", {
      type: "text",
      value: d.title,
      maxlength: "120"
    });

    const desc = h("textarea", {
      rows: "3",
      maxlength: "1000"
    });

    desc.value = d.description;

    const proj = h(
      "select",
      {},
      opts(SS.db.projects.map(p => [p.id, p.name]), d.projectId)
    );

    const asg = h(
      "select",
      {},
      opts(SS.db.users.map(u => [u.id, u.name]), d.assigneeId)
    );

    const pri = h(
      "select",
      {},
      opts(SS.PRIORITIES.map(p => [p, SS.cap(p)]), d.priority)
    );

    const sta = h("select", {}, opts(SS.STATUSES, d.status));
    const due = h("input", { type: "date", value: d.dueDate });
    const err = h("p", { class: "error", role: "alert" });

    const read = () => ({
      title: title.value.trim(),
      description: desc.value.trim(),
      projectId: proj.value,
      assigneeId: asg.value,
      priority: pri.value,
      status: sta.value,
      dueDate: due.value
    });

    const dirty = () => {
      const r = read();
      return Object.keys(r).some(k => r[k] !== d[k]);
    };

    const save = () => {
      const v = read();

      if (v.title.length < 3) {
        err.textContent = "Title must be at least 3 characters.";
        return;
      }

      if (!v.dueDate) {
        err.textContent = "Choose a deadline.";
        return;
      }

      let r;

      if (t) {
        const ch = {};

        Object.keys(v).forEach(k => {
          if (v[k] !== t[k]) ch[k] = v[k];
        });

        r = SS.taskService.update(t.id, ch, t.version);
      } else {
        r = SS.taskService.create(v);
      }

      if (!r.ok) {
        err.textContent = r.error;
        return;
      }

      m.close(true);
      SS.toast(t ? "Task saved" : "Task created", "ok");
      SS.refresh();
    };

    const body = [
      fld("Title", title),
      fld("Description", desc),
      h(
        "div",
        { class: "grid2" },
        fld("Project", proj),
        fld("Assignee", asg),
        fld("Priority", pri),
        fld("Status", sta)
      ),
      fld("Deadline", due),
      err
    ];

    const actions = h(
      "div",
      { class: "actions" },
      t
        ? h(
            "button",
            {
              class: "btn danger",
              type: "button",
              onclick: () => {
                if (confirm('Delete "' + t.title + '"? This cannot be undone.')) {
                  SS.taskService.remove(t.id);
                  m.close(true);
                  SS.toast("Task deleted", "ok");
                  SS.refresh();
                }
              }
            },
            "Delete task"
          )
        : null,
      h(
        "button",
        {
          class: "btn",
          type: "button",
          onclick: () => m.close()
        },
        "Cancel"
      ),
      h(
        "button",
        {
          class: "btn primary",
          type: "button",
          onclick: save
        },
        t ? "Save changes" : "Create task"
      )
    );

    body.push(actions);

    if (t) {
      body.unshift(
        h("p", {
          class: "muted small",
          text:
            "Created " +
            SS.fmtDate(t.createdAt) +
            ", last updated " +
            SS.rel(t.updatedAt) +
            " (version " +
            t.version +
            ")"
        })
      );

      const clist = h("div", {});
      const cerr = h("p", { class: "error", role: "alert" });

      const cin = h("textarea", {
        rows: "2",
        maxlength: "500",
        placeholder: "Write a comment",
        "aria-label": "New comment"
      });

      const drawC = () => {
        const cs = SS.commentService.forTask(t.id);

        clist.replaceChildren(
          ...(cs.length
            ? cs.map(c =>
                h(
                  "div",
                  { class: "comment" },
                  SS.avatar(c.authorId),
                  h(
                    "div",
                    {},
                    h("strong", {
                      text: (SS.user(c.authorId) || {}).name || "Unknown"
                    }),
                    h("span", {
                      class: "muted small",
                      text: "  " + SS.rel(c.createdAt)
                    }),
                    h("p", { text: c.content })
                  )
                )
              )
            : [h("p", {
                class: "muted small",
                text: "No comments yet."
              })])
        );
      };

      drawC();

      const alist = h("ul", { class: "feed" });

      const drawA = () => {
        const as = SS.db.attachments.filter(a => a.taskId === t.id);

        alist.replaceChildren(
          ...(as.length
            ? as.map(a =>
                h(
                  "li",
                  {},
                  h("span", { text: a.fileName }),
                  h("span", {
                    class: "muted small",
                    text: SS.fmtSize(a.fileSize) + ", " + a.fileType
                  })
                )
              )
            : [h("li", {
                class: "muted small",
                text: "No files selected."
              })])
        );
      };

      drawA();

      const file = h("input", {
        type: "file",
        multiple: true,
        "aria-label": "Select files",
        onchange: () => {
          [...file.files].forEach(f =>
            SS.fileService.add(f, { taskId: t.id })
          );

          file.value = "";
          drawA();
          SS.toast("File details saved (not uploaded)", "ok");
          SS.refresh();
        }
      });

      body.push(
        h(
          "div",
          { class: "sec" },
          h("h3", { text: "Comments" }),
          clist,
          cin,
          cerr,
          h(
            "p",
            {},
            h(
              "button",
              {
                class: "btn",
                type: "button",
                onclick: () => {
                  const r = SS.commentService.add(t.id, cin.value);

                  if (!r.ok) {
                    cerr.textContent = r.error;
                    return;
                  }

                  cin.value = "";
                  cerr.textContent = "";
                  drawC();
                  SS.toast("Comment added", "ok");
                  SS.refresh();
                }
              },
              "Add comment"
            )
          )
        ),
        h(
          "div",
          { class: "sec" },
          h("h3", { text: "Attachments" }),
          alist,
          file,
          h("p", {
            class: "muted small",
            text: "Files are only selected in this browser. Uploads to cloud storage are not enabled."
          })
        )
      );
    }

    const m = SS.modal(
      t ? "Task details" : "Create task",
      body,
      { wide: !!t, isDirty: dirty }
    );
  };

  SS.openProject = function () {
    const fld = (l, el) =>
      h("label", { class: "fld" }, h("span", { text: l }), el);

    const name = h("input", {
      type: "text",
      maxlength: "80"
    });

    const desc = h("textarea", {
      rows: "3",
      maxlength: "400"
    });

    const start = h("input", {
      type: "date",
      value: SS.today()
    });

    const end = h("input", { type: "date" });

    const owner = h(
      "select",
      {},
      SS.db.users.map(u =>
        h("option", {
          value: u.id,
          selected: u.id === SS.ME
        }, u.name)
      )
    );

    const checks = SS.db.users.map(u =>
      h("input", {
        type: "checkbox",
        value: u.id
      })
    );

    const err = h("p", {
      class: "error",
      role: "alert"
    });

    const m = SS.modal(
      "Create project",
      [
        fld("Project name", name),
        fld("Description", desc),
        h(
          "div",
          { class: "grid2" },
          fld("Start date", start),
          fld("Deadline", end)
        ),
        fld("Project owner", owner),
        h(
          "fieldset",
          {
            class: "fld",
            style: "border:0;padding:0;margin:0"
          },
          h("span", { text: "Initial team members" }),
          h(
            "div",
            { class: "checks" },
            SS.db.users.map((u, i) =>
              h("label", {}, checks[i], u.name)
            )
          )
        ),
        err,
        h(
          "div",
          { class: "actions" },
          h(
            "button",
            {
              class: "btn",
              type: "button",
              onclick: () => m.close()
            },
            "Cancel"
          ),
          h(
            "button",
            {
              class: "btn primary",
              type: "button",
              onclick: async () => {
                if (name.value.trim().length < 3) {
                  err.textContent =
                    "Project name must be at least 3 characters.";
                  return;
                }

                if (!start.value || !end.value) {
                  err.textContent =
                    "Choose a start date and a deadline.";
                  return;
                }

                if (end.value < start.value) {
                  err.textContent =
                    "The deadline cannot be before the start date.";
                  return;
                }

                const result = await SS.projectService.create({
                  name: name.value.trim(),
                  description: desc.value.trim(),
                  startDate: start.value,
                  deadline: end.value,
                  ownerId: owner.value,
                  memberIds: checks
                    .filter(c => c.checked)
                    .map(c => c.value)
                });

                if (!result.ok) {
                  err.textContent = result.error;
                  return;
                }

                m.close(true);
                SS.toast("Project created", "ok");
                SS.refresh();
              }
            },
            "Create project"
          )
        )
      ],
      {
        isDirty: () =>
          !!(name.value || desc.value || end.value)
      }
    );
  };

  function buildShell() {
    const b = document.body;
    const page = b.dataset.page;
    const mq = matchMedia("(max-width:900px)");

    document.documentElement.dataset.theme = SS.prefs.theme;
    b.classList.toggle("compact", SS.prefs.compact);
    b.classList.toggle("collapsed", SS.prefs.collapsed);

    SS.setTheme = theme => {
      SS.prefs.theme = theme;
      document.documentElement.dataset.theme = theme;
      SS.savePrefs();

      document.querySelectorAll('input[name="theme"]').forEach(input => {
        input.checked = input.value === theme;
      });

      const dark = theme === "dark";

      themeToggle.replaceChildren(
        SS.icon(dark ? IC.sun : IC.moon)
      );

      themeToggle.setAttribute(
        "aria-label",
        "Switch to " + (dark ? "light" : "dark") + " mode"
      );

      themeToggle.setAttribute(
        "title",
        "Switch to " + (dark ? "light" : "dark") + " mode"
      );

      themeToggle.setAttribute("aria-pressed", String(dark));
    };

    const nav = [
      ["index", "index.html", "Overview", IC.home],
      ["tasks", "tasks.html?mine=1", "My Tasks", IC.check],
      ["projects", "projects.html", "Projects", IC.folder],
      ["activity", "activity.html", "Team Activity", IC.pulse],
      ["settings", "settings.html", "Settings", IC.gear]
    ];

    const me = SS.user(SS.ME);
    const act = b.dataset.action;

    const side = h(
      "aside",
      {
        class: "side",
        id: "sidebar",
        "aria-label": "Sidebar"
      },
      h(
        "div",
        { class: "brand" },
        h("span", { class: "logo", text: "S" }),
        "SyncSpace"
      ),
      h(
        "a",
        {
          class: "ws",
          href: "settings.html#workspace",
          title: "Workspace settings"
        },
        h("small", { text: "Workspace" }),
        SS.prefs.workspace
      ),
      h(
        "nav",
        { class: "nav", "aria-label": "Main" },
        nav.map(([k, href, l, ic]) =>
          h(
            "a",
            {
              href,
              class: k === page ? "on" : "",
              "aria-current": k === page ? "page" : null
            },
            SS.icon(ic),
            l
          )
        )
      ),
      h("p", {
        class: "tag muted",
        text: "Everything your team needs to move forward."
      }),
      h(
        "div",
        { class: "me" },
        SS.avatar(SS.ME),
        h(
          "div",
          {},
          h("div", { text: me.name }),
          h("small", { text: me.role })
        )
      )
    );

    const toggle = () => {
      if (mq.matches) {
        b.classList.toggle("open");
      } else {
        b.classList.toggle("collapsed");
        SS.prefs.collapsed = b.classList.contains("collapsed");
        SS.savePrefs();
      }
    };

    const q = h("input", {
      type: "search",
      placeholder: "Search",
      "aria-label": "Search",
      oninput: () =>
        SS.onSearch &&
        SS.onSearch(q.value.trim().toLowerCase()),
      onkeydown: e => {
        if (e.key === "Enter" && !SS.onSearch) {
          location.href =
            "tasks.html?q=" + encodeURIComponent(q.value.trim());
        }
      }
    });

    const ov = SS.db.tasks.filter(SS.isOverdue).length;

    const bell = h(
      "button",
      {
        class: "icon-btn",
        type: "button",
        "aria-label": "Notifications",
        onclick: () =>
          SS.modal("Notifications", [
            h("p", {
              class: "muted",
              text:
                ov +
                " overdue task" +
                (ov === 1 ? "" : "s") +
                " in your workspace."
            }),
            SS.feedList(
              SS.activityService.list().filter(
                a => a.actorId !== SS.ME
              ),
              6
            )
          ])
      },
      SS.icon(IC.bell),
      ov ? h("span", { class: "dot" }) : null
    );

    const themeToggle = h("button", {
      class: "icon-btn",
      type: "button",
      onclick: () =>
        SS.setTheme(
          SS.prefs.theme === "dark" ? "light" : "dark"
        )
    });

    SS.setTheme(SS.prefs.theme);

    const top = h(
      "header",
      { class: "top" },
      h(
        "button",
        {
          class: "icon-btn",
          type: "button",
          "aria-label": "Toggle sidebar",
          onclick: toggle
        },
        SS.icon(IC.menu)
      ),
      h(
        "div",
        { class: "top-title" },
        h("div", {
          class: "crumb",
          id: "crumb",
          text: "Workspace / " + b.dataset.title
        }),
        h("h1", {
          id: "ptitle",
          text: b.dataset.title
        })
      ),
      h("label", { class: "search" }, SS.icon(IC.search), q),
      themeToggle,
      bell,
      SS.avatar(SS.ME),
      act
        ? h(
            "button",
            {
              class: "btn primary",
              type: "button",
              onclick:
                act === "task"
                  ? () => SS.openTask(null)
                  : SS.openProject
            },
            act === "task" ? "Create task" : "Create project"
          )
        : null
    );

    document.getElementById("shell").replaceChildren(
      side,
      h("div", {
        class: "scrim",
        onclick: () => b.classList.remove("open")
      }),
      h(
        "div",
        { class: "main" },
        top,
        h("main", {
          id: "main",
          class: "content"
        })
      )
    );

    SS.setTitle = t => {
      document.getElementById("ptitle").textContent = t;
      document.getElementById("crumb").textContent = "Projects / " + t;
      document.title = t + " · SyncSpace";
    };
  }

  buildShell();
})();