/**
 * Check if given value is a function
 *
 * @param {any} value – a value to test
 *
 * @return {boolean}
 *
 * @api private
 */
const isFunction = value => typeof value === "function"

/**
 * Calls a function and returns a Promise that resolves a result
 *
 * @param {Function} fn
 * @param {any[]} args
 *
 * @return {Promise<any>}
 *
 * @api private
 */
function call(fn, args, ctx) {
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
 * @param {Function} suspender
 *
 * @return {Function} useSuspender
 */
function createSuspender(suspender, ctx = undefined) {
  if (!isFunction(suspender)) {
    throw new TypeError("Suspender expected to be a function.")
  }

  const operation = {
    state: "initial", // initial | pending | resolved | rejected
    error: null,
    result: null,
    suspender: null
  }

  /**
   * Executes a suspender with given arguments.
   * Will throw a Promise to notify React.Suspense
   *
   *
   * @param {any[]} [args = []]
   *
   * @return {any}
   *
   * @throws {Promise} A promise will be thrown when no suspender with
   *  such ID found in cache.
   *
   * @throws {Error} if suspender's Promise has been rejected with an error
   *
   * @api public
   */
  function useSuspender(...args) {
    if (operation.state === "rejected") {
      operation.suspender = null

      throw operation.error
    }

    if (operation.state === "resolved") {
      operation.state = "initial"
      operation.suspender = null

      return operation.result
    }

    if (operation.state === "pending") {
      throw operation.suspender
    }

    operation.suspender = call(suspender, args, this || ctx || undefined)
      .then(result => {
        operation.result = result
        operation.state = "resolved"
      })

      .catch(error => {
        operation.error = error
        operation.state = "rejected"
      })

    operation.state = "pending"

    throw operation.suspender
  }

  /**
   * Calls useSuspense early
   */
  useSuspender.init = function init(...args) {
    try {
      useSuspender.call(this === useSuspender ? undefined : this, ...args)
    } catch (_) {
      // useSuspender call sholdn't throw an error, so just ignore anything
    }
  }

  // For those who want to use object destructing on createSuspender result.
  useSuspender.useSuspender = useSuspender

  return useSuspender
}

module.exports = createSuspender
