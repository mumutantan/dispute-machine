import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { DisputesModule } from './disputes/disputes.module'

@Module({
  imports: [
    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || './data/dispute.db',
      autoLoadEntities: true,
      synchronize: true, // 开发环境自动同步表结构
      logging: process.env.NODE_ENV === 'development'
    }),
    DatabaseModule,
    DisputesModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
