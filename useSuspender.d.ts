/**
 * Executes a suspender with given arguments.
 * Will throw a Promise to notify React.Suspense
 */
export interface SuspenderHook {
  /**
   * @param args A list of arguments to execute suspender with
   */
  (...args: any[]): any

  /**
   * Calls useSuspender early
   *
   * @param args A list of arguments to execute suspender with
   */
  callEarly(...args: any[]): void
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
export function createSuspender(fn: SuspenderImplementation, ctx?: any): SuspenderHook
export default createSuspender
