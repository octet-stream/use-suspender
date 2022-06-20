type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * A function to create a useSuspender hook with
 */
 interface SuspenderImplementation {
  (...args: any[]): any
}

interface Cache {
  /**
   * Clears cache
   */
  size: number,

  /**
   * Returns cache size
   */
  clear(): void
}

/**
 * Calls a suspender with given arguments.
 * Will throw a Promise to notify React.Suspense
 */
export interface SuspenderHook<TResult, TArgs extends unknown[]> {
  /**
   * @param args A list of arguments to execute suspender with
   *
   * @deprecated Use SuspenderHook.useSuspender
   */
  (...args: TArgs): TResult

  /**
   * Calls a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param args A list of arguments to execute suspender with
   */
  useSuspender(...args: TArgs): TResult

  /**
   * Calls useSuspender early
   *
   * @param args A list of arguments to execute suspender with
   */
  callEarly(...args: TArgs): void

  /**
   * Internal cache
   */
  cache: Cache
}

/**
 * Creates a new useSuspender hook for given function.
 *
 * @param fn A function to create a useSuspender hook with
 * @param ctx thisArg value
 */
export function createSuspender<T extends SuspenderImplementation>(
  fn: T,
  ctx?: unknown
): SuspenderHook<UnwrapPromise<ReturnType<T>>, Parameters<T>>

export default createSuspender
