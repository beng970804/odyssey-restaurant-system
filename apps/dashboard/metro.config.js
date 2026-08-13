// Expo in a pnpm monorepo: without watching the workspace root and resolving
// from both node_modules trees, the app builds but cannot resolve @repo/ui.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// Hierarchical lookup stays ON: with node-linker=hoisted, packages resolved
// out of the pnpm store still need to walk up to the hoisted root.

module.exports = config
