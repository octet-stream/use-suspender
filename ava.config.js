export default {
  require: "global-jsdom/register",
  nodeArguments: [
    "--loader=ts-node/esm/transpile-only"
  ],
  extensions: {
    ts: "module",
    tsx: "module"
  },
  files: [
    "*.test.{ts,tsx}"
  ]
}
