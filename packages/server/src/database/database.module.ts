import { Module, Global, Logger, Injectable, Inject } from '@nestjs/common'
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import * as path from 'path'
import * as fs from 'fs'

export const DATABASE_TOKEN = 'DATABASE'

@Injectable()
export class DbService {
  private _db: SqlJsDatabase | null = null
  private _save: (() => void) | null = null

  setDb(db: SqlJsDatabase, save: () => void) {
    this._db = db
    this._save = save
  }

  get db(): SqlJsDatabase {
    if (!this._db) throw new Error('Database not initialized yet')
    return this._db
  }

  save() {
    this._save?.()
  }

  exec(sql: string) {
    this.db.exec(sql)
  }

  run(sql: string, params?: any[]) {
    const stmt = this.db.prepare(sql)
    if (params && params.length) {
      stmt.bind(params)
    }
    try {
      stmt.step()
    } finally {
      stmt.free()
    }
  }

  prepare(sql: string) {
    return new Stmt(this.db.prepare(sql), this)
  }
}

class Stmt {
  constructor(private readonly stmt: any, private readonly dbService: DbService) {}

  get(...params: any[]): any {
    this.stmt.bind(params)
    try {
      if (this.stmt.step()) {
        const row = this.stmt.getAsObject()
        this.stmt.reset()
        return row
      }
      return undefined
    } finally {}
  }

  all(...params: any[]): any[] {
    this.stmt.bind(params)
    const results: any[] = []
    try {
      while (this.stmt.step()) {
        results.push(this.stmt.getAsObject())
      }
      this.stmt.reset()
      return results
    } finally {}
  }

  run(...params: any[]) {
    this.stmt.bind(params)
    try {
      this.stmt.step()
    } finally {
      this.stmt.reset()
    }
  }

  free() {
    this.stmt.free()
  }
}

@Global()
@Module({
  providers: [
    DbService,
    {
      provide: 'DB_INITIALIZER',
      useFactory: async (dbService: DbService) => {
        const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'dispute.db')
        const dbDir = path.dirname(dbPath)

        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true })
        }

        const logger = new Logger('Database')
        const SQL = await initSqlJs()

        let db: SqlJsDatabase

        if (fs.existsSync(dbPath)) {
          const buffer = fs.readFileSync(dbPath)
          db = new SQL.Database(buffer)
          logger.log(`📂 数据库已加载: ${dbPath}`)
        } else {
          db = new SQL.Database()
          logger.log(`📂 创建新数据库: ${dbPath}`)
        }

        // 建表
        db.exec(`
          CREATE TABLE IF NOT EXISTS disputes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            config TEXT DEFAULT '{}',
            result TEXT DEFAULT '{}',
            created_at TEXT DEFAULT (datetime('now')),
            finished_at TEXT
          );
        `)
        db.exec(`
          CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
            dispute_id TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'player',
            weight REAL DEFAULT 1.0,
            choice TEXT DEFAULT '',
            is_winner INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
          );
        `)
        db.exec(`
          CREATE TABLE IF NOT EXISTS options (
            id TEXT PRIMARY KEY,
            dispute_id TEXT NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
          );
        `)

        db.run('PRAGMA foreign_keys = ON;')
        logger.log('✅ 数据库表已创建')

        const saveFn = () => {
          try {
            const data = db.export()
            const buffer = Buffer.from(data)
            fs.writeFileSync(dbPath, buffer)
          } catch (e) {}
        }

        // Set db on DbService
        dbService.setDb(db, saveFn)

        // 定期保存
        const saveInterval = setInterval(saveFn, 5000)

        const cleanup = () => {
          clearInterval(saveInterval)
          saveFn()
        }
        process.on('exit', cleanup)
        process.on('SIGINT', () => { cleanup(); process.exit(0) })
        process.on('SIGTERM', () => { cleanup(); process.exit(0) })

        return true
      },
      inject: [DbService]
    }
  ],
  exports: [DbService]
})
export class DatabaseModule {}
