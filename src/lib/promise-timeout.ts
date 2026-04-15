/**
 * Rejects if `promise` does not settle within `ms` milliseconds.
 * Used so auth / network calls cannot leave the UI stuck on loading forever.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise
      .then(
        (v) => {
          clearTimeout(id)
          resolve(v)
        },
        (e) => {
          clearTimeout(id)
          reject(e)
        }
      )
  })
}
