import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }

  getInfo() {
    return {
      name: '争端分歧机',
      version: '1.0.0',
      description: '一个帮助团队或朋友在争议问题上做出决策的工具'
    }
  }
}
