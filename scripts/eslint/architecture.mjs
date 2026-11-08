import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = fileURLToPath(new URL('../../src/', import.meta.url))
const allowedLayers = {
  app: ['app', 'pages', 'features', 'shared', 'lib'],
  pages: ['features', 'shared', 'lib'],
  features: ['features', 'shared', 'lib'],
  shared: ['shared'],
  lib: ['lib', 'shared'],
}

const describe = (filename) => {
  const relative = path.relative(sourceRoot, filename).replaceAll('\\', '/')
  const [layer, module, area] = relative
    .replace(/\.[cm]?[jt]sx?$/, '')
    .split('/')
  return { layer, module, area, relative }
}

const isPublicEntry = (relative, layer, module) =>
  relative === `${layer}/${module}` ||
  new RegExp(`^${layer}/${module}/index(?:\\.[cm]?[jt]sx?)?$`).test(relative)

export const architectureRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce application layers and module public APIs' },
    schema: [],
    messages: { boundary: '{{reason}}' },
  },
  create(context) {
    const source = describe(context.filename)

    function check(node) {
      const specifier = node?.value
      if (typeof specifier !== 'string') return
      const targetPath = specifier.startsWith('@/')
        ? path.resolve(sourceRoot, specifier.slice(2))
        : specifier.startsWith('.')
          ? path.resolve(path.dirname(context.filename), specifier)
          : null

      const report = (reason) =>
        context.report({ node, messageId: 'boundary', data: { reason } })
      if (!targetPath) {
        if (
          source.layer === 'features' &&
          source.area !== 'api' &&
          (specifier.startsWith('@supabase/') || specifier === 'axios')
        ) {
          report('Access remote services through this feature’s api layer.')
        }
        return
      }

      const target = describe(targetPath)
      const sameModule =
        source.layer === target.layer && source.module === target.module
      if (source.layer === 'main' && target.layer !== 'app') {
        report('The entry point only initializes the app layer.')
      }
      if (source.layer === 'pages' && sameModule) return

      if (
        allowedLayers[source.layer] &&
        !allowedLayers[source.layer].includes(target.layer)
      ) {
        report(`The ${source.layer} layer cannot depend on ${target.layer}.`)
        return
      }
      if (
        ['features', 'pages'].includes(target.layer) &&
        !sameModule &&
        !isPublicEntry(target.relative, target.layer, target.module)
      ) {
        report(
          `Import ${target.layer}/${target.module} through its public index.ts.`,
        )
      }
      if (source.layer === 'features' && sameModule) {
        if (
          source.area === 'components' &&
          ['api', 'data'].includes(target.area)
        ) {
          report(
            'Components access data through hooks, never api or demo data directly.',
          )
        }
        if (source.area === 'hooks' && target.area === 'data') {
          report('Hooks access data through the api layer.')
        }
        if (
          ['api', 'data'].includes(source.area) &&
          ['components', 'hooks'].includes(target.area)
        ) {
          report('The data layer cannot depend on React components or hooks.')
        }
      }
      if (
        source.layer === 'features' &&
        source.area === 'components' &&
        target.layer === 'lib'
      ) {
        report(
          'Components access integrations through their feature’s hooks and api.',
        )
      }
      if (
        source.layer === 'lib' &&
        target.layer === 'shared' &&
        ['ui', 'hooks', 'assets'].includes(target.module)
      ) {
        report(
          'Infrastructure cannot depend on React UI, hooks or visual assets.',
        )
      }
    }

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
      TSImportType: (node) => check(node.source),
      CallExpression: (node) => {
        if (
          source.layer === 'features' &&
          source.area !== 'api' &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'fetch'
        ) {
          context.report({
            node,
            messageId: 'boundary',
            data: {
              reason: 'Remote requests belong in the feature’s api layer.',
            },
          })
        }
      },
    }
  },
}
