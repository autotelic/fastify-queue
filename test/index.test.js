'use strict'

const { test } = require('tap')
const fastifyQueue = require('../')
const { promisify } = require('util')
const asyncTimeout = promisify(setTimeout)

function buildApp (handler, opts = {}) {
  const fastify = require('fastify')()
  fastify.register(fastifyQueue, opts)
  fastify.get('/', handler)
  return fastify
}

test('adding to the queue', async ({ equal, same }) => {
  const app = buildApp(async (req, reply) => {
    same(reply.queue.contents, new Map())
    reply.queue.add('foo', 'bar')
    same(reply.queue.contents, new Map([['foo', 'bar']]))
    return {}
  })
  await app.ready()
  equal(app.hasReplyDecorator('queue'), true, 'should decorate reply with queue')
  const res = await app.inject({ url: '/' })
  equal(res.statusCode, 200)
})

test('using an initializer', async ({ equal, same }) => {
  const routeHandler = async (req, reply) => {
    same(reply.queue.contents, new Map())
    reply.queue.add('foo', 'bar')
    same(reply.queue.contents, new Map([['foo', { id: req.id, value: 'bar' }]]))
    return {}
  }
  const initializer = (key, value, reply) => {
    equal(key, 'foo')
    equal(value, 'bar')
    return { id: reply.request.id, value }
  }
  const app = buildApp(routeHandler, { initializer })
  await app.ready()
  equal(app.hasReplyDecorator('queue'), true, 'should decorate reply with queue')
  const res = await app.inject({ url: '/' })
  equal(res.statusCode, 200)
})

test('using an initializer with a resolver', async ({ equal, same }) => {
  const routeHandler = async (req, reply) => {
    same(reply.queue.contents, new Map())
    reply.queue.add('foo-1', 'bar-1')
    reply.queue.add('foo-2', 'bar-2')
    reply.queue.add('foo-3', 'bar-3')
    return {}
  }
  const initializer = async (key, value) => {
    // Simulate awaiting a response.
    await asyncTimeout(20)
    return { key, value }
  }
  const resolved = []
  const resolver = (key, value) => {
    resolved.push(value)
  }
  const app = buildApp(routeHandler, { resolver, initializer })
  await app.ready()
  equal(app.hasReplyDecorator('queue'), true, 'should decorate reply with queue')
  const res = await app.inject({ url: '/' })
  equal(res.statusCode, 200)
  // Since the resolver is called after the request is complete, we need to wait for our expected
  // payloads to accumulate.
  await asyncTimeout(60)
  same(resolved, [
    { key: 'foo-1', value: 'bar-1' },
    { key: 'foo-2', value: 'bar-2' },
    { key: 'foo-3', value: 'bar-3' }
  ])
})

test('error handling', async ({ equal, same }) => {
  const routeHandler = async (req, reply) => {
    same(reply.queue.contents, new Map())
    reply.queue.add('foo', 'bar')
    return {}
  }
  const resolver = (key, value) => {
    throw Error('Whoops')
  }
  const app = buildApp(routeHandler, { resolver })
  const errors = []
  app.log.error = (e) => {
    errors.push(e)
  }
  await app.ready()
  equal(app.hasReplyDecorator('queue'), true, 'should decorate reply with queue')
  const res = await app.inject({ url: '/' })
  equal(res.statusCode, 200)
  // Since the resolver is called after the request is complete, we need to wait for our expected
  // payloads to accumulate.
  await asyncTimeout(60)
  same(errors, [Error('Whoops')])
})

test('manually resolving queue', async ({ equal, same }) => {
  const routeHandler = async (req, reply) => {
    same(reply.queue.contents, new Map())
    reply.queue.add('foo', 'bar')
    same(reply.queue.contents, new Map([['foo', 'bar']]))
    await reply.queue.resolve()
    return {}
  }
  let onResolvedCalls = 0
  const onResolved = () => {
    onResolvedCalls++
  }
  const app = buildApp(routeHandler, { onResolved })
  await app.ready()
  equal(app.hasReplyDecorator('queue'), true, 'should decorate reply with queue')
  const res = await app.inject({ url: '/' })
  equal(res.statusCode, 200)
  // Since the resolver is called after the request is complete, we need to wait for our expected
  // payloads to accumulate.
  await asyncTimeout(60)
  equal(onResolvedCalls, 1, 'onResponse hook should not call resolve if queue has already resolved.')
})

test('skipped onRequest hook', async ({ equal, same }) => {
  const fastify = require('fastify')()
  // This plugin's onRequest hook will trigger before ours and send a reply -
  // thereby skipping our request hook but still triggering our onResponse hook.
  fastify.register((fastify, opts, done) => {
    fastify.addHook('onRequest', (req, reply) => {
      reply
        .code(204)
        .header('Content-Length', '0')
        .send()
    })
    fastify.get('/', (req, reply) => {
      console.log(reply.queue)
      reply.send()
    })
    done()
  })
  fastify.register(fastifyQueue)
  const errors = []
  fastify.log.error = (obj) => { errors.push(obj.err) }
  await fastify.ready()
  equal(fastify.hasReplyDecorator('queue'), true, 'should decorate reply with queue')
  const res = await fastify.inject({ url: '/' })
  equal(res.statusCode, 204)
  same(errors, [], 'onResponse hook should be able to handle a null reply.queue')
})
