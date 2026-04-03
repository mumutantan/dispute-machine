import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { DisputesService } from './disputes.service'
import { CreateDisputeDto, UpdateDisputeDto } from './dto/dispute.dto'
import { Dispute } from './entities/dispute.entity'

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: '创建争端', description: '创建一个新的争端议题' })
  @ApiResponse({ status: 201, description: '创建成功', type: Dispute })
  create(@Body() createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    return this.disputesService.create(createDisputeDto)
  }

  @Get()
  @ApiOperation({ summary: '获取争端列表', description: '获取所有争端列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Dispute] })
  findAll(): Promise<Dispute[]> {
    return this.disputesService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取争端详情', description: '根据ID获取争端详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Dispute })
  @ApiResponse({ status: 404, description: '争端不存在' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Dispute> {
    return this.disputesService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新争端', description: '更新争端信息' })
  @ApiResponse({ status: 200, description: '更新成功', type: Dispute })
  @ApiResponse({ status: 404, description: '争端不存在' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDisputeDto: UpdateDisputeDto
  ): Promise<Dispute> {
    return this.disputesService.update(id, updateDisputeDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除争端', description: '删除指定争端' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '争端不存在' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.disputesService.remove(id)
  }
}
