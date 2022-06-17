type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * Calls a suspender with given arguments.
 * Will throw a Promise to notify React.Suspense
 */
export interface SuspenderHook<TResult, TArgs extends unknown[]> {
  /**
   * @param args A list of arguments to execute suspender with
   */
  (...args: TArgs): TResult

  /**
   * Calls useSuspender early
   *
   * @param args A list of arguments to execute suspender with
   */
  callEarly(...args: TArgs): void
}

/**
 * A function to create a useSuspender hook with
 */
export interface SuspenderImplementation {
  (...args: any[]): any
}

/**
 * Creates a new useSuspender hook for given function.
 *
 * @param fn A function to create a useSuspender hook with
 * @param ctx thisArg value
 */
export function createSuspender<T extends SuspenderImplementation>(
  fn: T, ctx?: any
): SuspenderHook<UnwrapPromise<ReturnType<T>>, Parameters<T>>

export default createSuspender
