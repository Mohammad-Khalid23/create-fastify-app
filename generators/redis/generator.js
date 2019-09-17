'use strict'

const fs = require('fs')
const { promisify } = require('util')
const path = require('path')
const { createTemplate } = require('./../../lib/utils')
const { getAbsolutePath, fileExists } = require('./../../lib/utils')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

async function generatePlugin (pluginPath, answers) {
  const rootProjectPath = getAbsolutePath(path.join(pluginPath, '..', '..'))

  const redisExist = await fileExists(path.join(pluginPath, 'redis.js'), fs.F_OK)
  if (redisExist) {
    throw new Error('Redis plugin already configured')
  }

  try {
    const content = await createTemplate(path.join(__dirname, 'templates', 'redis.hbs'), answers)
    await writeFile(path.join(pluginPath, 'redis.js'), content, 'utf8')
  } catch (e) {
    throw new Error(e)
  }

  try {
    let rootPkg = await readFile(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
    let pkg = await readFile(path.join(rootProjectPath, 'package.json'), 'utf8')
    rootPkg = JSON.parse(rootPkg)
    pkg = JSON.parse(pkg)

    Object.assign(pkg.dependencies, {
      'fastify-redis': rootPkg.devDependencies['fastify-redis']
    })

    await writeFile(path.join(rootProjectPath, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8')
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = { generatePlugin }
