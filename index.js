'use strict'

const fp = require('fastify-plugin')
const pProps = require('p-props')

const kIsResolved = Symbol.for('fastify-queue.isResolved')
const kContents = Symbol.for('fastify-queue.contents')

async function fastifyQueue (fastify, options) {
  const {
    initializer = (k, v, r) => v,
    resolver = (k, v, r) => v,
    onError = (e) => fastify.log.error(e),
    onResolved = () => null,
    queueName = 'queue',
    concurrency,
    stopOnError
  } = options

  function addToQueue (key, value) {
    const reply = this
    reply[queueName][kContents].set(key, initializer(key, value, reply))
  }

  async function resolveQueue (cb = onResolved) {
    const reply = this
    const queue = reply[queueName]
    try {
      const resolved = await pProps(
        queue[kContents],
        (value, key) => resolver(key, value, reply),
        { concurrency, stopOnError }
      )
      await cb(resolved, reply)
    } catch (error) {
      onError(error, reply)
    } finally {
      queue[kIsResolved] = true
    }
  }

  fastify.decorateReply(queueName, null)

  fastify.addHook('onRequest', async (request, reply) => {
    reply[queueName] = {
      add: addToQueue.bind(reply),
      resolve: resolveQueue.bind(reply),
      get contents () { return this[kContents] },
      [kContents]: new Map(),
      [kIsResolved]: false
    }
  })

  fastify.addHook('onResponse', async (request, reply) => {
    const queue = reply[queueName]
    if (!queue[kIsResolved]) {
      await queue.resolve()
    }
  })
}

module.exports = fp(fastifyQueue, { name: 'fastify-queue' })
