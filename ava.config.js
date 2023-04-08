export default {
  require: "global-jsdom/register",
  nodeArguments: [
    "--no-warnings",
    "--loader=ts-node/esm/transpile-only"
  ],
  environmentVariables: {
    "TS_NODE_PROJECT": "tsconfig.ava.json"
  },
  extensions: {
    ts: "module",
    tsx: "module"
  },
  files: [
    "src/**/*.test.{ts,tsx}"
  ]
}
