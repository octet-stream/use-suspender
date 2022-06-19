type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * A function to create a useSuspender hook with
 */
 interface SuspenderImplementation {
  (...args: any[]): any
}

/**
 * Calls a suspender with given arguments.
 * Will throw a Promise to notify React.Suspense
 */
export interface SuspenderHook<TResult, TArgs extends unknown[]> {
  /**
   * @param args A list of arguments to execute suspender with
   */
  (...args: TArgs): TResult

  useSuspender(...args: TArgs): TResult

  /**
   * Calls useSuspender early
   *
   * @param args A list of arguments to execute suspender with
   */
  callEarly(...args: TArgs): void
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
