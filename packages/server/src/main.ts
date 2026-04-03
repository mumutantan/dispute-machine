import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 配置 CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  })

  // 设置全局前缀
  app.setGlobalPrefix('api')

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('争端分歧机 API')
    .setDescription('争端分歧机后端接口文档')
    .setVersion('1.0')
    .addTag('disputes', '争端管理')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  // 启动服务
  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`🚀 服务已启动: http://localhost:${port}`)
  console.log(`📚 API 文档: http://localhost:${port}/api/docs`)
}

bootstrap().catch(e => {
  console.error('启动失败:', e)
  process.exit(1)
})