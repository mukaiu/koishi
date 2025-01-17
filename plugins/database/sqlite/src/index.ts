import { defineDriver, Schema } from 'koishi'
import { SQLiteDriver } from '@minatojs/driver-sqlite'
import path from 'path'

export default defineDriver(SQLiteDriver, Schema.object({
  path: Schema.string().description('数据库路径').default('.koishi.db'),
}), (ctx, config) => {
  if (config.path !== ':memory:') {
    config.path = path.resolve(ctx.baseDir, config.path)
  }
})
