import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { DisputesService } from './disputes.service'
import { CreateDisputeDto, JoinDisputeDto, PlayDto, VoteDto } from './dto/dispute.dto'
import { DisputeEntity } from './entities/dispute.entity'

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * 1. 创建争端
   */
  @Post()
  @ApiOperation({ summary: '创建争端', description: '创建一个新的争端议题，支持指定初始参与方和选项' })
  @ApiResponse({ status: 201, description: '创建成功', type: DisputeEntity })
  create(@Body() dto: CreateDisputeDto) {
    try {
      return this.disputesService.create(dto)
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 2. 获取争端详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取争端详情', description: '获取争端详情，包含参与方和选项列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: DisputeEntity })
  @ApiResponse({ status: 404, description: '争端不存在' })
  findOne(@Param('id') id: string) {
    const result = this.disputesService.findOne(id)
    if (!result) {
      throw new HttpException('争端不存在', HttpStatus.NOT_FOUND)
    }
    return result
  }

  /**
   * 3. 加入争端
   */
  @Post(':id/join')
  @ApiOperation({ summary: '加入争端', description: '作为参与方加入争端' })
  @ApiResponse({ status: 200, description: '加入成功', type: DisputeEntity })
  join(@Param('id') id: string, @Body() dto: JoinDisputeDto) {
    try {
      const result = this.disputesService.join(id, dto)
      if (!result) {
        throw new HttpException('争端不存在', HttpStatus.NOT_FOUND)
      }
      return result
    } catch (e: any) {
      if (e instanceof HttpException) throw e
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 4. 运气服人：提交选择
   */
  @Post(':id/play')
  @ApiOperation({ summary: '运气服人：提交选择', description: '提交剪刀石头布/骰子选择，所有人选完后自动判定' })
  @ApiResponse({ status: 200, description: '选择已提交', type: DisputeEntity })
  play(@Param('id') id: string, @Body() dto: PlayDto) {
    try {
      const result = this.disputesService.play(id, dto)
      if (!result) {
        throw new HttpException('争端不存在', HttpStatus.NOT_FOUND)
      }
      return result
    } catch (e: any) {
      if (e instanceof HttpException) throw e
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 5. 做决定：投票
   */
  @Post(':id/vote')
  @ApiOperation({ summary: '做决定：投票', description: '选择一个选项进行投票，所有人投完后自动加权计算' })
  @ApiResponse({ status: 200, description: '投票已提交', type: DisputeEntity })
  vote(@Param('id') id: string, @Body() dto: VoteDto) {
    try {
      const result = this.disputesService.vote(id, dto)
      if (!result) {
        throw new HttpException('争端不存在', HttpStatus.NOT_FOUND)
      }
      return result
    } catch (e: any) {
      if (e instanceof HttpException) throw e
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 6. 获取结果
   */
  @Get(':id/result')
  @ApiOperation({ summary: '获取争端结果', description: '获取争端的最终结果' })
  @ApiResponse({ status: 200, description: '获取成功', type: DisputeEntity })
  getResult(@Param('id') id: string) {
    const result = this.disputesService.getResult(id)
    if (!result) {
      throw new HttpException('争端不存在', HttpStatus.NOT_FOUND)
    }
    return result
  }
}