import { IsString, IsOptional, IsEnum, MaxLength, IsObject } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DisputeType, DisputeStatus } from '../entities/dispute.entity'

/**
 * 创建争端 DTO
 */
export class CreateDisputeDto {
  @ApiProperty({ description: '争端标题', maxLength: 200, example: '今晚吃什么？' })
  @IsString()
  @MaxLength(200)
  title: string

  @ApiPropertyOptional({ description: '争端描述', example: '大家一起来决定今晚的晚餐' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({
    description: '争端类型',
    enum: DisputeType,
    default: DisputeType.DISCUSSION,
    example: DisputeType.VOTING
  })
  @IsEnum(DisputeType)
  @IsOptional()
  type?: DisputeType

  @ApiPropertyOptional({ description: '额外配置选项', example: { options: ['火锅', '烧烤', '日料'] } })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>
}

/**
 * 更新争端 DTO
 */
export class UpdateDisputeDto {
  @ApiPropertyOptional({ description: '争端标题', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ description: '争端描述' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: '争端类型', enum: DisputeType })
  @IsEnum(DisputeType)
  @IsOptional()
  type?: DisputeType

  @ApiPropertyOptional({ description: '争端状态', enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  @IsOptional()
  status?: DisputeStatus

  @ApiPropertyOptional({ description: '额外配置选项' })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>
}
