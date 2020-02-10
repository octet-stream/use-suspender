/**
 * Calls a function and returns a Promise that resolves a result
 *
 * @param {Function} fn
 * @param {any[]} args
 *
 * @return {Promise<any>}
 */
function exec(fn, args, ctx) {
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
function createSuspender(suspender, ctx = null) {
  if (typeof suspender !== "function") {
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

    operation.suspender = exec(suspender, args, this || ctx)
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

  return useSuspender
}

module.exports = createSuspender
