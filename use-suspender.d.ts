/**
 * Creates a new useSuspender hook for given function.
 *
 * @param suspender A function to make a useSuspender hook with
 * @param ctx thisArg value
 *
 * @api public
 */
declare function createSuspender<T>(suspender: (...args: any[]) => T, ctx?: any): (...args: any[]) => T

// TODO: Add a definition for useSuspender properties
export default createSuspender
