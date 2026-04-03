import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 争端响应实体（Swagger 文档用）
 */
export class DisputeEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  title: string

  @ApiProperty()
  description: string

  @ApiProperty()
  type: string

  @ApiProperty()
  status: string

  @ApiProperty()
  config: any

  @ApiProperty()
  result: any

  @ApiProperty()
  created_at: string

  @ApiPropertyOptional()
  finished_at: string | null

  @ApiProperty({ type: [Object] })
  participants: any[]

  @ApiProperty({ type: [Object] })
  options: any[]
}

/**
 * 参与方实体
 */
export class ParticipantEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  dispute_id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  role: string

  @ApiProperty()
  weight: number

  @ApiProperty()
  choice: string

  @ApiProperty()
  is_winner: number

  @ApiProperty()
  created_at: string
}

/**
 * 选项实体
 */
export class OptionEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  dispute_id: string

  @ApiProperty()
  content: string
}