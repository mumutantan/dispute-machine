import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { DisputesModule } from './disputes/disputes.module'

@Module({
  imports: [DatabaseModule, DisputesModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
