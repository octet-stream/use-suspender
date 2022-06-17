import {expectType as expect} from "tsd"

import {createSuspender, SuspenderImplementation, SuspenderHook} from "."

// Expect createSuspender to be a function
expect<Function>(createSuspender)

// Expect SuspenderImplementation to match any function
expect<SuspenderImplementation>(() => {})

expect<SuspenderImplementation>((a: number, b: number) => a + b)

// SuspenderHook has correct result
expect<SuspenderHook<number, []>>(createSuspender(() => 0))

// SuspenderHook unwraps promise result
expect<SuspenderHook<number, []>>(createSuspender(async () => 0))

// SuspenderHook takes arguments from given SuspenderImplementation
expect<SuspenderHook<void, [number, number]>>(createSuspender((a: number, b: number) => a + b))

// Expect SuspenderHook to have callEarly method
expect<() => void>(createSuspender(() => {}).callEarly)
