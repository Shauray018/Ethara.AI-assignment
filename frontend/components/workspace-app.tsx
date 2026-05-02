"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react"

import { api, type Project, type Role, type TaskStatus, type User } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AuthState = {
  token: string
  user: User
}

type DashboardState = Awaited<ReturnType<typeof api.dashboard>>

const TOKEN_KEY = "ethara-auth-token"

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
]

function fromDateTimeLocalValue(value: string) {
  return value ? new Date(value).toISOString() : undefined
}

function completionRate(project: Project) {
  if (!project.tasks.length) {
    return 0
  }

  const doneCount = project.tasks.filter((task) => task.status === "DONE").length
  return Math.round((doneCount / project.tasks.length) * 100)
}

export function WorkspaceApp() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [dashboard, setDashboard] = useState<DashboardState | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as Role,
  })
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    dueDate: "",
    memberIds: [] as string[],
  })
  const [taskForm, setTaskForm] = useState({
    projectId: "",
    title: "",
    description: "",
    assigneeId: "",
    dueDate: "",
    status: "TODO" as TaskStatus,
  })

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY)
    if (!token) {
      return
    }

    api
      .me(token)
      .then(({ user }) => {
        setAuth({ token, user })
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY)
      })
  }, [])

  useEffect(() => {
    if (!auth) {
      return
    }

    void loadWorkspace(auth.token)
  }, [auth])

  async function loadWorkspace(token: string) {
    setBusy(true)
    setError("")

    try {
      const [{ summary, overdueTasks, recentTasks }, { projects }, { users }] =
        await Promise.all([api.dashboard(token), api.projects(token), api.users(token)])

      setDashboard({ summary, overdueTasks, recentTasks })
      setProjects(projects)
      setMembers(users)
      setSelectedProjectId((current) => current || projects[0]?.id || "")
      setTaskForm((current) => ({
        ...current,
        projectId: current.projectId || projects[0]?.id || "",
      }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard")
    } finally {
      setBusy(false)
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")

    try {
      const response =
        authMode === "login"
          ? await api.login({
              email: authForm.email,
              password: authForm.password,
            })
          : await api.signup({
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
              role: authForm.role,
            })

      window.localStorage.setItem(TOKEN_KEY, response.token)
      setAuth({ token: response.token, user: response.user })
      setMessage(authMode === "login" ? "Logged in successfully." : "Account created.")
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth) {
      return
    }

    setBusy(true)
    setError("")
    setMessage("")

    try {
      await api.createProject(auth.token, {
        name: projectForm.name,
        description: projectForm.description,
        dueDate: fromDateTimeLocalValue(projectForm.dueDate),
        memberIds: projectForm.memberIds,
      })

      setProjectForm({ name: "", description: "", dueDate: "", memberIds: [] })
      setMessage("Project created.")
      await loadWorkspace(auth.token)
    } catch (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Project creation failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth || !taskForm.projectId) {
      return
    }

    setBusy(true)
    setError("")
    setMessage("")

    try {
      await api.createTask(auth.token, taskForm.projectId, {
        title: taskForm.title,
        description: taskForm.description,
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: fromDateTimeLocalValue(taskForm.dueDate),
        status: taskForm.status,
      })

      setTaskForm((current) => ({
        ...current,
        title: "",
        description: "",
        assigneeId: "",
        dueDate: "",
        status: "TODO",
      }))
      setMessage("Task created.")
      await loadWorkspace(auth.token)
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Task creation failed")
    } finally {
      setBusy(false)
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    if (!auth) {
      return
    }

    setBusy(true)
    setError("")

    try {
      await api.updateTask(auth.token, taskId, { status })
      await loadWorkspace(auth.token)
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Task update failed")
    } finally {
      setBusy(false)
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_KEY)
    setAuth(null)
    setDashboard(null)
    setProjects([])
    setMembers([])
    setSelectedProjectId("")
    setMessage("")
    setError("")
  }

  if (!auth) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.28),_transparent_24%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96)_40%,_rgba(245,158,11,0.18)_140%)] px-4 py-10 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex min-h-[420px] flex-col justify-between rounded-[2rem] border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur">
            <div className="space-y-5">
              <Badge className="border-white/15 bg-white/10 text-white">Ethara Assignment</Badge>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                Projects, tasks, team roles, and overdue tracking in one workspace.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-200/85 md:text-lg">
                Admins create projects and assign work. Members update progress and keep delivery visible across the team.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureTile icon={ShieldCheck} title="Role-based access" description="Admin and member flows protected from the API upward." />
              <FeatureTile icon={FolderKanban} title="Project control" description="Create projects, attach teams, and keep scope organized." />
              <FeatureTile icon={CalendarClock} title="Overdue insight" description="Dashboard highlights delayed work before it slips further." />
            </div>
          </section>

          <Card className="border-white/10 bg-white text-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{authMode === "login" ? "Login" : "Create account"}</CardTitle>
                  <CardDescription>
                    Use the backend JWT auth flow and start managing projects.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setAuthMode((current) => (current === "login" ? "signup" : "login"))
                  }
                >
                  {authMode === "login" ? "Signup" : "Login"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAuthSubmit}>
                {authMode === "signup" ? (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Aisha Khan"
                      value={authForm.name}
                      onChange={(event) =>
                        setAuthForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="team@ethara.app"
                    value={authForm.email}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </div>

                {authMode === "signup" ? (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      id="role"
                      value={authForm.role}
                      onChange={(event) =>
                        setAuthForm((current) => ({
                          ...current,
                          role: event.target.value as Role,
                        }))
                      }
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </div>
                ) : null}

                <Button className="h-11 w-full" disabled={busy} type="submit">
                  {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {authMode === "login" ? "Login" : "Create account"}
                </Button>
              </form>

              {error ? <Feedback tone="error" text={error} /> : null}
              {message ? <Feedback tone="success" text={message} /> : null}
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(241,245,249,0.88)),radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_24%)] px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-background/85 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge>{auth.user.role === "ADMIN" ? "Admin workspace" : "Member workspace"}</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Delivery dashboard for {auth.user.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track project delivery, assign work, and keep overdue tasks visible across the team.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary">{auth.user.email}</Badge>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </section>

        {error ? <Feedback tone="error" text={error} /> : null}
        {message ? <Feedback tone="success" text={message} /> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={BriefcaseBusiness}
            label="Projects"
            value={dashboard?.summary.projects ?? 0}
            caption="Projects visible to your role"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tasks"
            value={dashboard?.summary.tasks ?? 0}
            caption="Tracked tasks across the workspace"
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={dashboard?.summary.overdue ?? 0}
            caption="Open items past the deadline"
          />
          <StatCard
            icon={ShieldCheck}
            label="Role"
            value={auth.user.role}
            caption="Permissions enforced by JWT + RBAC"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Status overview</CardTitle>
              <CardDescription>Live counts grouped by task state from the dashboard API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {statusOptions.map((status) => {
                const value = dashboard?.summary.statusCounts[status.value] ?? 0
                const total = dashboard?.summary.tasks ?? 0
                const rate = total ? Math.round((value / total) * 100) : 0

                return (
                  <div key={status.value} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{status.label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <Progress value={rate} />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest task updates across projects you can access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard?.recentTasks.length ? (
                dashboard.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-border/60 bg-background/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{task.title}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {task.project?.name} {task.assignee?.name ? `· ${task.assignee.name}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState text="No recent task activity yet." />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>Admins can create projects and attach team members immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleProjectSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project name</Label>
                    <Input
                      id="project-name"
                      value={projectForm.name}
                      onChange={(event) =>
                        setProjectForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(event) =>
                        setProjectForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-due-date">Due date</Label>
                    <Input
                      id="project-due-date"
                      type="datetime-local"
                      value={projectForm.dueDate}
                      onChange={(event) =>
                        setProjectForm((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-members">Team members</Label>
                    <Select
                      id="project-members"
                      multiple
                      className="h-36 py-3"
                      value={projectForm.memberIds}
                      onChange={(event) =>
                        setProjectForm((current) => ({
                          ...current,
                          memberIds: Array.from(event.target.selectedOptions).map(
                            (option) => option.value
                          ),
                        }))
                      }
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={busy || auth.user.role !== "ADMIN"}
                  >
                    Create project
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create task</CardTitle>
                <CardDescription>Assign work to project members and track status from day one.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleTaskSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="task-project">Project</Label>
                    <Select
                      id="task-project"
                      value={taskForm.projectId}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          projectId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task title</Label>
                    <Input
                      id="task-title"
                      value={taskForm.title}
                      onChange={(event) =>
                        setTaskForm((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="task-assignee">Assignee</Label>
                      <Select
                        id="task-assignee"
                        value={taskForm.assigneeId}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            assigneeId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {(projects.find((project) => project.id === taskForm.projectId)?.members ??
                          []
                        ).map((member) => (
                          <option key={member.user.id} value={member.user.id}>
                            {member.user.name}
                          </option>
                        ))}
                        {projects.find((project) => project.id === taskForm.projectId)?.owner ? (
                          <option
                            value={projects.find((project) => project.id === taskForm.projectId)?.owner.id}
                          >
                            {
                              projects.find((project) => project.id === taskForm.projectId)?.owner
                                .name
                            }{" "}
                            (Owner)
                          </option>
                        ) : null}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-status">Initial status</Label>
                      <Select
                        id="task-status"
                        value={taskForm.status}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            status: event.target.value as TaskStatus,
                          }))
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-due-date">Due date</Label>
                    <Input
                      id="task-due-date"
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={busy}>
                    Create task
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>Select a project to inspect members and tasks.</CardDescription>
                  </div>
                  <Select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    className="w-full lg:w-72"
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProject ? (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{selectedProject.name}</h3>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            {selectedProject.description || "No description provided."}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary">
                          {completionRate(selectedProject)}% complete
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <MiniInfo label="Owner" value={selectedProject.owner.name} />
                        <MiniInfo
                          label="Members"
                          value={String(selectedProject.members.length + 1)}
                        />
                        <MiniInfo
                          label="Due"
                          value={
                            selectedProject.dueDate
                              ? new Date(selectedProject.dueDate).toLocaleDateString()
                              : "Not set"
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium">Team</h4>
                        <Badge>{selectedProject.members.length + 1} people</Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <MemberTile
                          key={selectedProject.owner.id}
                          user={selectedProject.owner}
                          suffix="Owner"
                        />
                        {selectedProject.members.map((member) => (
                          <MemberTile key={member.id} user={member.user} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium">Tasks</h4>
                        <Badge>{selectedProject.tasks.length} items</Badge>
                      </div>
                      <div className="space-y-3">
                        {selectedProject.tasks.length ? (
                          selectedProject.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-3xl border border-border/60 bg-background/70 p-4"
                            >
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{task.title}</p>
                                    <StatusBadge status={task.status} />
                                  </div>
                                  <p className="text-sm leading-6 text-muted-foreground">
                                    {task.description || "No task description."}
                                  </p>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span>
                                      Assignee: {task.assignee?.name ?? "Unassigned"}
                                    </span>
                                    <span>
                                      Due:{" "}
                                      {task.dueDate
                                        ? new Date(task.dueDate).toLocaleString()
                                        : "Not set"}
                                    </span>
                                  </div>
                                </div>
                                <Select
                                  className="w-full lg:w-44"
                                  value={task.status}
                                  onChange={(event) =>
                                    updateTaskStatus(task.id, event.target.value as TaskStatus)
                                  }
                                >
                                  {statusOptions.map((status) => (
                                    <option key={status.value} value={status.value}>
                                      {status.label}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                            </div>
                          ))
                        ) : (
                          <EmptyState text="No tasks inside this project yet." />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState text="Pick a project to inspect project members, tasks, and progress." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue tasks</CardTitle>
                <CardDescription>Tasks that have missed their due date and are still open.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard?.overdueTasks.length ? (
                  dashboard.overdueTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-red-950">{task.title}</p>
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="mt-2 text-sm text-red-900/80">
                        {task.project?.name} · due{" "}
                        {task.dueDate ? new Date(task.dueDate).toLocaleString() : "unknown"}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No overdue tasks. Current deadlines are under control." />
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

function FeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FolderKanban
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
      <Icon className="mb-4 size-5 text-sky-200" />
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200/80">{description}</p>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof FolderKanban
  label: string
  value: number | string
  caption: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{caption}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const tone =
    status === "DONE"
      ? "bg-emerald-100 text-emerald-700"
      : status === "IN_PROGRESS"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-200 text-slate-700"

  return <Badge className={tone}>{status.replace("_", " ")}</Badge>
}

function Feedback({ tone, text }: { tone: "error" | "success"; text: string }) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      }
    >
      {text}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-background/60 p-6 text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function MemberTile({ user, suffix }: { user: User; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Badge className="bg-primary/10 text-primary">
          {suffix ? `${user.role} · ${suffix}` : user.role}
        </Badge>
      </div>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  )
}
