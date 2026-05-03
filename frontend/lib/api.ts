export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"

export type Role = "ADMIN" | "MEMBER"
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

export type Task = {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  dueDate?: string | null
  assignee?: User | null
  project?: {
    id: string
    name: string
  }
}

export type Project = {
  id: string
  name: string
  description?: string | null
  dueDate?: string | null
  owner: User
  members: Array<{
    id: string
    user: User
  }>
  tasks: Task[]
}

type ApiOptions = {
  method?: string
  token?: string | null
  body?: unknown
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed")
  }

  return payload as T
}

export const api = {
  signup: (body: {
    name: string
    email: string
    password: string
    role: Role
  }) =>
    request<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body,
    }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body,
    }),
  me: (token: string) =>
    request<{ user: User }>("/auth/me", {
      token,
    }),
  users: (token: string) =>
    request<{ users: User[] }>("/users", {
      token,
    }),
  projects: (token: string) =>
    request<{ projects: Project[] }>("/projects", {
      token,
    }),
  createProject: (
    token: string,
    body: {
      name: string
      description?: string
      dueDate?: string
      memberIds: string[]
    }
  ) =>
    request<{ project: Project }>("/projects", {
      method: "POST",
      token,
      body,
    }),
  updateProject: (
    token: string,
    projectId: string,
    body: Partial<{
      name: string
      description: string | null
      dueDate: string | null
      ownerId: string
      memberIds: string[]
    }>
  ) =>
    request<{ project: Project }>(`/projects/${projectId}`, {
      method: "PATCH",
      token,
      body,
    }),
  addProjectMembers: (
    token: string,
    projectId: string,
    body: { memberIds: string[] }
  ) =>
    request<{ project: Project }>(`/projects/${projectId}/members`, {
      method: "POST",
      token,
      body,
    }),
  createTask: (
    token: string,
    projectId: string,
    body: {
      title: string
      description?: string
      assigneeId?: string
      dueDate?: string
      status?: TaskStatus
    }
  ) =>
    request<{ task: Task }>(`/projects/${projectId}/tasks`, {
      method: "POST",
      token,
      body,
    }),
  updateTask: (
    token: string,
    taskId: string,
    body: Partial<{
      title: string
      description: string | null
      projectId: string
      assigneeId: string | null
      dueDate: string | null
      status: TaskStatus
    }>
  ) =>
    request<{ task: Task }>(`/tasks/${taskId}`, {
      method: "PATCH",
      token,
      body,
    }),
}
