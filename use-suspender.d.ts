/**
 * Creates a new useSuspender hook for given function.
 *
 * @param suspender A function to make a useSuspender hook with
 * @param ctx thisArg value
 *
 * @api public
 */
declare function createSuspender<T>(suspender: (...args: any[]) => T, ctx?: any): (...args: any[]) => T

declare namespace createSuspender {
  /**
   * Executes a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param args A list of arguments to execute suspender with
   *
   * @api public
   */
  export function useSuspender(...args: any): any

  /**
   * Calls useSuspense early
   *
   * @param args A list of arguments to execute useSuspender with
   *
   * @api public
   */
  export function callEarly(...args: any[]): void
}

export default createSuspender
