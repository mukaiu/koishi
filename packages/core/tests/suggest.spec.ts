import { App } from 'koishi'
import mock from '@koishijs/plugin-mock'

describe('Command Suggestion', () => {
  const app = new App({ prefix: '/', minSimilarity: 0.64 })
  app.plugin(mock)

  const client1 = app.mock.client('456')
  const client2 = app.mock.client('789', '987')

  app.command('foo <text>', { checkArgCount: true })
    .action((_, bar) => 'foo' + bar)

  app.command('fooo', { checkUnknown: true })
    .alias('bool')
    .option('text', '-t <bar>')
    .action(({ options }) => 'fooo' + options.text)

  before(() => app.start())
  after(() => app.stop())

  it('execute command', async () => {
    await client1.shouldReply('foo bar', 'foobar')
    await client1.shouldNotReply('.')
  })

  it('no suggestions', async () => {
    await client1.shouldNotReply('bar foo')
  })

  it('apply suggestions 1', async () => {
    await client1.shouldReply('fo bar', '您要找的是不是“foo”？回复句号以使用推测的指令。')
    await client2.shouldReply('/fooo -t bar', 'fooobar')
    await client1.shouldReply('.', 'foobar')
    await client1.shouldNotReply('.')
  })

  it('apply suggestions 2', async () => {
    await client2.shouldReply('/foooo -t bar', '您要找的是不是“fooo”？回复句号以使用推测的指令。')
    await client1.shouldReply('foo bar', 'foobar')
    await client2.shouldReply('.', 'fooobar')
    await client2.shouldNotReply('.')
  })

  it('ignore suggestions 1', async () => {
    await client1.shouldReply('fo bar', '您要找的是不是“foo”？回复句号以使用推测的指令。')
    await client1.shouldNotReply('bar foo')
    await client1.shouldNotReply('.')
  })

  it('ignore suggestions 2', async () => {
    await client2.shouldReply('/fo bar', '您要找的是不是“foo”？回复句号以使用推测的指令。')
    await client2.shouldReply('/foo bar', 'foobar')
    await client2.shouldNotReply('.')
  })

  it('multiple suggestions', async () => {
    await client1.shouldReply('fool bar', '您要找的是不是“foo”或“fooo”或“bool”？')
    await client1.shouldNotReply('.')
  })
})

describe('session.suggest()', () => {
  const app = new App({ prefix: '.', minSimilarity: 0.64 })
  app.plugin(mock)

  const client = app.mock.client('123', '456')
  const items = ['foo', 'bar']

  app.command('find [item]').action(async ({ session }, item) => {
    if (items.includes(item)) return 'found:' + item
    const name = await session.suggest({
      actual: item,
      expect: ['foo', 'bar', 'baz'],
      prefix: 'PREFIX',
      suffix: 'SUFFIX',
    })
    if (!name) return
    return session.execute({ args: [name], name: 'find' })
  })

  before(() => app.start())
  after(() => app.stop())

  it('no suggestions', async () => {
    await client.shouldNotReply('.')
    await client.shouldNotReply('find for')
  })

  it('show suggestions', async () => {
    await client.shouldReply('.find 111', 'PREFIX')
    await client.shouldNotReply('.')
    await client.shouldReply('.find for', `PREFIX您要找的是不是“foo”？SUFFIX`)
    await client.shouldReply('.', 'found:foo')
    await client.shouldReply('.find bax', `PREFIX您要找的是不是“bar”或“baz”？`)
    await client.shouldNotReply('.')
  })
})
