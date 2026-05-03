"use client"

import { toast } from "sonner"

import { api, type Project, type Role, type Task, type TaskStatus, type User } from "@/lib/api"
import { toDateIso } from "@/lib/workspace"
import { create } from "@/lib/zustand"

type DashboardState = {
  summary: {
    projects: number
    tasks: number
    overdue: number
    statusCounts: Record<TaskStatus, number>
  }
  overdueTasks: Task[]
  recentTasks: Task[]
}

type AuthState = { token: string; user: User } | null

type RefreshWorkspaceOptions = {
  tokenOverride?: string
  silent?: boolean
}

type LoadingState = {
  initializing: boolean
  authenticating: boolean
  workspace: boolean
  syncing: boolean
  creatingProject: boolean
  creatingTask: boolean
  updatingProjectIds: string[]
  updatingTaskIds: string[]
}

type UpdateProjectInput = {
  projectId: string
  name: string
  description?: string
  dueDate?: Date
  ownerId: string
  memberIds: string[]
}

type UpdateTaskInput = {
  taskId: string
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  dueDate?: Date
  status: TaskStatus
}

type WorkspaceStore = {
  auth: AuthState
  dashboard: DashboardState | null
  projects: Project[]
  members: User[]
  ready: boolean
  loading: LoadingState
  initialize: () => Promise<void>
  login: (body: { email: string; password: string }) => Promise<boolean>
  signup: (body: {
    name: string
    email: string
    password: string
    role: Role
  }) => Promise<boolean>
  logout: () => void
  refreshWorkspace: (options?: RefreshWorkspaceOptions) => Promise<void>
  createProject: (body: {
    name: string
    description?: string
    dueDate?: Date
    memberIds: string[]
  }) => Promise<boolean>
  updateProject: (body: UpdateProjectInput) => Promise<boolean>
  createTask: (body: {
    projectId: string
    title: string
    description?: string
    assigneeId?: string
    dueDate?: Date
    status: TaskStatus
  }) => Promise<boolean>
  updateTask: (body: UpdateTaskInput) => Promise<boolean>
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
}

const TOKEN_KEY = "ethara-auth-token"
const RECENT_TASK_LIMIT = 5

const initialLoadingState: LoadingState = {
  initializing: false,
  authenticating: false,
  workspace: false,
  syncing: false,
  creatingProject: false,
  creatingTask: false,
  updatingProjectIds: [],
  updatingTaskIds: [],
}

function clearWorkspaceState() {
  return {
    dashboard: null,
    projects: [] as Project[],
    members: [] as User[],
  }
}

function isOpenTask(status: TaskStatus) {
  return status !== "DONE"
}

function toTimestamp(value?: string | null) {
  return value ? new Date(value).getTime() : 0
}

function compareTaskRecency(left: Task, right: Task) {
  return toTimestamp(right.dueDate) - toTimestamp(left.dueDate)
}

function buildTaskWithProject(project: Project, task: Task, members: User[]) {
  return {
    ...task,
    assignee:
      task.assignee ??
      members.find((member) => member.id === task.assignee?.id) ??
      null,
    project: {
      id: project.id,
      name: project.name,
    },
  }
}

function normalizeProjects(projects: Project[], members: User[]) {
  return projects.map((project) => ({
    ...project,
    tasks: project.tasks.map((task) => buildTaskWithProject(project, task, members)),
  }))
}

function buildDashboard(projects: Project[]): DashboardState {
  const tasks = projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      project: task.project ?? {
        id: project.id,
        name: project.name,
      },
    })),
  )

  const statusCounts: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  }

  for (const task of tasks) {
    statusCounts[task.status] += 1
  }

  const overdueTasks = tasks
    .filter((task) => {
      if (!task.dueDate || !isOpenTask(task.status)) {
        return false
      }

      return new Date(task.dueDate).getTime() < Date.now()
    })
    .sort(compareTaskRecency)

  const recentTasks = [...tasks].sort(compareTaskRecency).slice(0, RECENT_TASK_LIMIT)

  return {
    summary: {
      projects: projects.length,
      tasks: tasks.length,
      overdue: overdueTasks.length,
      statusCounts,
    },
    overdueTasks,
    recentTasks,
  }
}

function replaceProject(projects: Project[], nextProject: Project) {
  return projects.map((project) => (project.id === nextProject.id ? nextProject : project))
}

function moveTaskAcrossProjects(
  projects: Project[],
  nextTask: Task,
  nextProjectId: string,
  members: User[],
) {
  return projects.map((project) => {
    const withoutTask = project.tasks.filter((task) => task.id !== nextTask.id)

    if (project.id !== nextProjectId) {
      return {
        ...project,
        tasks: withoutTask,
      }
    }

    const enrichedTask = buildTaskWithProject(project, nextTask, members)

    return {
      ...project,
      tasks: [enrichedTask, ...withoutTask],
    }
  })
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  auth: null,
  dashboard: null,
  projects: [],
  members: [],
  ready: false,
  loading: initialLoadingState,

  initialize: async () => {
    if (get().ready || get().loading.initializing) {
      return
    }

    set((state) => ({
      loading: { ...state.loading, initializing: true },
    }))

    const token = window.localStorage.getItem(TOKEN_KEY)

    if (!token) {
      set((state) => ({
        ready: true,
        loading: { ...state.loading, initializing: false },
      }))
      return
    }

    try {
      const { user } = await api.me(token)
      set({ auth: { token, user } })
      await get().refreshWorkspace({ tokenOverride: token })
    } catch {
      window.localStorage.removeItem(TOKEN_KEY)
      set({
        auth: null,
        ...clearWorkspaceState(),
      })
      toast.error("Your session expired. Please login again.")
    } finally {
      set((state) => ({
        ready: true,
        loading: { ...state.loading, initializing: false },
      }))
    }
  },

  login: async (body) => {
    set((state) => ({
      loading: { ...state.loading, authenticating: true },
    }))

    try {
      const response = await api.login(body)
      window.localStorage.setItem(TOKEN_KEY, response.token)
      set({ auth: { token: response.token, user: response.user } })
      await get().refreshWorkspace({ tokenOverride: response.token })
      toast.success("Logged in successfully.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed")
      return false
    } finally {
      set((state) => ({
        loading: { ...state.loading, authenticating: false },
      }))
    }
  },

  signup: async (body) => {
    set((state) => ({
      loading: { ...state.loading, authenticating: true },
    }))

    try {
      const response = await api.signup(body)
      window.localStorage.setItem(TOKEN_KEY, response.token)
      set({ auth: { token: response.token, user: response.user } })
      await get().refreshWorkspace({ tokenOverride: response.token })
      toast.success("Account created.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed")
      return false
    } finally {
      set((state) => ({
        loading: { ...state.loading, authenticating: false },
      }))
    }
  },

  logout: () => {
    window.localStorage.removeItem(TOKEN_KEY)
    set({
      auth: null,
      ready: true,
      ...clearWorkspaceState(),
      loading: initialLoadingState,
    })
    toast.success("Logged out.")
  },

  refreshWorkspace: async (options) => {
    const token = options?.tokenOverride ?? get().auth?.token

    if (!token) {
      return
    }

    set((state) => ({
      loading: {
        ...state.loading,
        workspace: options?.silent ? state.loading.workspace : true,
        syncing: Boolean(options?.silent),
      },
    }))

    try {
      const [{ projects }, { users }] = await Promise.all([
        api.projects(token),
        api.users(token),
      ])

      const normalizedProjects = normalizeProjects(projects, users)

      set({
        dashboard: buildDashboard(normalizedProjects),
        projects: normalizedProjects,
        members: users,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load workspace")
    } finally {
      set((state) => ({
        loading: {
          ...state.loading,
          workspace: false,
          syncing: false,
        },
      }))
    }
  },

  createProject: async (body) => {
    const auth = get().auth

    if (!auth) {
      return false
    }

    set((state) => ({
      loading: { ...state.loading, creatingProject: true },
    }))

    try {
      const { project } = await api.createProject(auth.token, {
        ...body,
        dueDate: toDateIso(body.dueDate),
      })

      set((state) => {
        const projects = [project, ...state.projects]
        return {
          projects,
          dashboard: buildDashboard(projects),
        }
      })

      toast.success("Project created.")
      void get().refreshWorkspace({ tokenOverride: auth.token, silent: true })
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project creation failed")
      return false
    } finally {
      set((state) => ({
        loading: { ...state.loading, creatingProject: false },
      }))
    }
  },

  updateProject: async (body) => {
    const auth = get().auth

    if (!auth) {
      return false
    }

    const previousProjects = get().projects

    set((state) => ({
      loading: {
        ...state.loading,
        updatingProjectIds: [...state.loading.updatingProjectIds, body.projectId],
      },
    }))

    try {
      const { project } = await api.updateProject(auth.token, body.projectId, {
        name: body.name,
        description: body.description ?? null,
        dueDate: body.dueDate ? toDateIso(body.dueDate) : null,
        ownerId: body.ownerId,
        memberIds: body.memberIds,
      })

      set((state) => {
        const normalizedProject = normalizeProjects([project], state.members)[0]
        const projects = replaceProject(state.projects, normalizedProject)
        return {
          projects,
          dashboard: buildDashboard(projects),
        }
      })

      toast.success("Project updated.")
      return true
    } catch (error) {
      set({
        projects: previousProjects,
        dashboard: buildDashboard(previousProjects),
      })
      toast.error(error instanceof Error ? error.message : "Project update failed")
      return false
    } finally {
      set((state) => ({
        loading: {
          ...state.loading,
          updatingProjectIds: state.loading.updatingProjectIds.filter(
            (id) => id !== body.projectId,
          ),
        },
      }))
    }
  },

  createTask: async (body) => {
    const auth = get().auth

    if (!auth) {
      return false
    }

    set((state) => ({
      loading: { ...state.loading, creatingTask: true },
    }))

    try {
      const { task } = await api.createTask(auth.token, body.projectId, {
        title: body.title,
        description: body.description,
        assigneeId: body.assigneeId || undefined,
        dueDate: toDateIso(body.dueDate),
        status: body.status,
      })

      set((state) => {
        const projects = moveTaskAcrossProjects(
          state.projects,
          task,
          body.projectId,
          state.members,
        )

        return {
          projects,
          dashboard: buildDashboard(projects),
        }
      })

      toast.success("Task created.")
      void get().refreshWorkspace({ tokenOverride: auth.token, silent: true })
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task creation failed")
      return false
    } finally {
      set((state) => ({
        loading: { ...state.loading, creatingTask: false },
      }))
    }
  },

  updateTask: async (body) => {
    const auth = get().auth

    if (!auth) {
      return false
    }

    const previousProjects = get().projects
    const currentTask = previousProjects
      .flatMap((project) => project.tasks)
      .find((task) => task.id === body.taskId)

    if (!currentTask) {
      return false
    }

    const optimisticTask: Task = {
      ...currentTask,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate ? toDateIso(body.dueDate) ?? null : null,
      status: body.status,
      assignee:
        get().members.find((member) => member.id === body.assigneeId) ?? null,
      project:
        get().projects.find((project) => project.id === body.projectId)
          ? {
              id: body.projectId,
              name:
                get().projects.find((project) => project.id === body.projectId)?.name ??
                currentTask.project?.name ??
                "",
            }
          : currentTask.project,
    }

    const optimisticProjects = moveTaskAcrossProjects(
      previousProjects,
      optimisticTask,
      body.projectId,
      get().members,
    )

    set((state) => ({
      projects: optimisticProjects,
      dashboard: buildDashboard(optimisticProjects),
      loading: {
        ...state.loading,
        updatingTaskIds: [...state.loading.updatingTaskIds, body.taskId],
      },
    }))

    try {
      const { task } = await api.updateTask(auth.token, body.taskId, {
        title: body.title,
        description: body.description ?? null,
        projectId: body.projectId,
        assigneeId: body.assigneeId ?? null,
        dueDate: body.dueDate ? toDateIso(body.dueDate) ?? null : null,
        status: body.status,
      })

      set((state) => {
        const projects = moveTaskAcrossProjects(
          state.projects,
          task,
          task.project?.id ?? body.projectId,
          state.members,
        )

        return {
          projects,
          dashboard: buildDashboard(projects),
        }
      })

      toast.success("Task updated.")
      return true
    } catch (error) {
      set({
        projects: previousProjects,
        dashboard: buildDashboard(previousProjects),
      })
      toast.error(error instanceof Error ? error.message : "Task update failed")
      return false
    } finally {
      set((state) => ({
        loading: {
          ...state.loading,
          updatingTaskIds: state.loading.updatingTaskIds.filter(
            (id) => id !== body.taskId,
          ),
        },
      }))
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const previousProjects = get().projects
    const previousTask = previousProjects
      .flatMap((project) => project.tasks)
      .find((task) => task.id === taskId)
    const previousProject = previousProjects.find((project) =>
      project.tasks.some((task) => task.id === taskId),
    )

    if (!previousTask || !previousProject || previousTask.status === status) {
      return
    }

    await get().updateTask({
      taskId,
      title: previousTask.title,
      description: previousTask.description ?? undefined,
      projectId: previousProject.id,
      assigneeId: previousTask.assignee?.id,
      dueDate: previousTask.dueDate ? new Date(previousTask.dueDate) : undefined,
      status,
    })
  },
}))
