import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 配置 CORS - 允许 localhost 和所有局域网 IP
  app.enableCors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如移动端、Postman）
      if (!origin) return callback(null, true)

      // 允许 localhost 和 127.0.0.1
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true)
      }

      // 允许局域网 IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const ipPattern = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/
      if (ipPattern.test(origin)) {
        return callback(null, true)
      }

      // 其他请求也允许（开发模式）
      return callback(null, true)
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization'
  })

  // 设置全局前缀
  app.setGlobalPrefix('api')

  // 设置全局 JSON 响应编码为 UTF-8，解决中文乱码问题
  const httpAdapter = app.getHttpAdapter()
  const instance = httpAdapter.getInstance()
  instance.set('json spaces', 2)
  // 使用中间件设置 Content-Type
  instance.use((req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res)
    res.json = (body: any) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return originalJson(body)
    }
    next()
  })

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