/**
 * Calls a function and returns a Promise that resolves a result
 *
 * @param {Function} fn
 * @param {any[]} args
 */
function exec(fn, args) {
  try {
    const res = fn(...args)

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
function createSuspender(suspender) {
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

    operation.suspender = exec(suspender, args)
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
