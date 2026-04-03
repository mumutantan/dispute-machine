import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum DisputeType {
  LUCK_RPS = 'luck_rps',
  LUCK_DICE = 'luck_dice',
  DECIDE = 'decide'
}

export enum DisputeStatus {
  PENDING = 'pending',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

/**
 * 创建争端 DTO
 */
export class CreateDisputeDto {
  @ApiProperty({ description: '争端标题', example: '今晚吃什么？' })
  @IsString()
  title: string

  @ApiPropertyOptional({ description: '争端描述', example: '大家一起来决定今晚的晚餐' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({
    description: '争端类型',
    enum: DisputeType,
    example: DisputeType.LUCK_RPS
  })
  @IsEnum(DisputeType)
  type: DisputeType

  @ApiPropertyOptional({
    description: '初始参与方名单（可选）',
    example: ['小明', '小红'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  participantNames?: string[]

  @ApiPropertyOptional({
    description: '选项列表（做决定类型需要）',
    example: ['火锅', '烧烤', '日料'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  options?: string[]
}

/**
 * 加入争端 DTO
 */
export class JoinDisputeDto {
  @ApiProperty({ description: '参与者名称', example: '小明' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '权重', example: 1.0 })
  @IsNumber()
  @IsOptional()
  weight?: number
}

/**
 * 运气服人提交选择 DTO
 */
export class PlayDto {
  @ApiProperty({ description: '参与者ID', example: 'uuid' })
  @IsUUID()
  participantId: string

  @ApiProperty({
    description: '选择（石头/剪刀/布 或 数字）',
    example: 'rock'
  })
  @IsString()
  choice: string
}

/**
 * 做决定投票 DTO
 */
export class VoteDto {
  @ApiProperty({ description: '参与者ID', example: 'uuid' })
  @IsUUID()
  participantId: string

  @ApiProperty({ description: '选项ID', example: 'uuid' })
  @IsUUID()
  optionId: string
}