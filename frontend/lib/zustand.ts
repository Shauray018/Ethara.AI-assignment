"use client"

import { useSyncExternalStore } from "react"

type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
) => void

type GetState<T> = () => T

type StoreApi<T> = {
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: () => void) => () => void
}

type BoundStore<T> = {
  (): T
  <U>(selector: (state: T) => U): U
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: () => void) => () => void
}

export function create<T>(
  initializer: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T,
): BoundStore<T> {
  let state: T
  const listeners = new Set<() => void>()

  const getState: GetState<T> = () => state

  const setState: SetState<T> = (partial) => {
    const nextPartial =
      typeof partial === "function" ? partial(state) : partial
    state = { ...state, ...nextPartial }
    listeners.forEach((listener) => listener())
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const api: StoreApi<T> = { getState, setState, subscribe }
  state = initializer(setState, getState, api)

  function useStore<U>(selector?: (currentState: T) => U) {
    return useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : state) as U,
      () => (selector ? selector(state) : state) as U,
    )
  }

  const boundStore = useStore as BoundStore<T>
  boundStore.getState = getState
  boundStore.setState = setState
  boundStore.subscribe = subscribe

  return boundStore
}
