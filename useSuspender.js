// @ts-check

import eq from "fast-deep-equal/es6/react.js"

const STATE_PENDING = 0
const STATE_RESOLVED = 1
const STATE_REJECTED = 2

/**
 * @typedef {STATE_PENDING | STATE_RESOLVED | STATE_REJECTED} State
 */

/**
 * @typedef {Object} Operation
 * @prop {State} state
 * @prop {Error | null} error
 * @prop {any} result
 * @prop {Promise<void> | null} suspender
 * @prop {any[]} args
 */

/**
 * Calls a function and returns a Promise that resolves with its result
 *
 * @param {(...args: any[]) => any} fn
 * @param {any[]} args
 * @param {unknown} ctx
 *
 * @return {Promise<any>}
 *
 * @api private
 */
function getPromise(fn, args, ctx) {
  try {
    const res = fn.apply(ctx, args)

    return res instanceof Promise ? res : Promise.resolve(res)
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 * Creates a new useSuspender hook for given function.
 *
 * @param {(...args: any[]) => any} fn A function to create a useSuspender hook with
 * @param {unknown} [ctx = undefined] thisArg value
 *
 * @return {(...args: any[]) => any} useSuspender
 *
 * @api public
 */
export function createSuspender(fn, ctx) {
  if (typeof fn !== "function") {
    throw new TypeError("First argument expected to be a function.")
  }

  // TODO: I think the cache in its current state might cause potential memory leaks in some scenarios.
  // TODO: I need to find a way to invalidate cache automatically. Not sure which strategy to choose.
  /** @type {Set<Operation>} */
  const cache = new Set()

  /**
   * @param {any[]} args
   *
   * @return {Operation | undefined}
   */
  function get(args) {
    for (const operation of cache) {
      if (eq(args, operation.args)) {
        return operation
      }
    }

    return undefined
  }

  /**
   * Calls a suspender function and sets its Promise on the operation
   * Takes the same arguments as getPromise function.
   *
   * @param {any[]} args
   *
   * @return {Promise<void>}
   *
   * @api private
   */
  function call(args) {
    /**
     * @type {Operation}
     *
     * @api private
     */
    const operation = {
      args,
      error: null,
      result: null,
      state: STATE_PENDING,
      suspender: getPromise(fn, args, ctx)
        // The return statement is useless for this `.then()` callback
        // eslint-disable-next-line promise/always-return
        .then(result => {
          operation.result = result
          operation.state = STATE_RESOLVED
        })
        .catch(error => {
          operation.error = error
          operation.state = STATE_REJECTED
        })
    }

    // Add operation to cache
    cache.add(operation)

    return operation.suspender
  }

  /**
   * Calls a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   * @param {any[]} args A list of arguments to execute suspender with
   *
   * @return {any}
   *
   * @throws {Promise<void>} If the Promise haven't been fulfilled yet
   *
   * @throws {Error} If suspender's Promise has been rejected with an error
   *
   * @api public
   */
  function useSuspender(...args) {
    // Find an operation that matches given arguments
    const operation = get(args)

    // If the operation exists, check out its state
    if (operation) {
      // If the operation is still pending, re-throw the Promise
      if (operation.state === STATE_PENDING) {
        throw operation.suspender
      }

      // If the operation is failed, throw its error
      if (operation.state === STATE_REJECTED) {
        throw operation.error
      }

      // If the operation is resolved, return its result, delete operation from cache and stop.
      if (operation.state === STATE_RESOLVED) {
        const {result} = operation

        // Remove the operation from cache
        cache.delete(operation)

        return result
      }
    }

    // If the operation is not exists, create a new one
    throw call(args)
  }

  /**
   * Calls useSuspense early
   *
   * @param {any[]} args A list of arguments to execute suspender with
   *
   * @return {void}
   *
   * @api public
   */
  useSuspender.callEarly = function callEarly(...args) {
    call(args)
  }

  // For those who want to use object destructing on createSuspender result.
  useSuspender.useSuspender = useSuspender

  return useSuspender
}

export default createSuspender
