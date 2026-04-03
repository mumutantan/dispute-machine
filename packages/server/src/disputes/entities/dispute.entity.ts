import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'

/**
 * 争端类型枚举
 */
export enum DisputeType {
  DECISION = 'decision',    // 决策类
  VOTING = 'voting',        // 投票类
  DISCUSSION = 'discussion' // 讨论类
}

/**
 * 争端状态枚举
 */
export enum DisputeStatus {
  PENDING = 'pending',     // 待处理
  ACTIVE = 'active',       // 进行中
  RESOLVED = 'resolved',   // 已解决
  CLOSED = 'closed'        // 已关闭
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 200, comment: '争端标题' })
  title: string

  @Column({ type: 'text', nullable: true, comment: '争端描述' })
  description: string

  @Column({
    type: 'enum',
    enum: DisputeType,
    default: DisputeType.DISCUSSION,
    comment: '争端类型'
  })
  type: DisputeType

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.PENDING,
    comment: '争端状态'
  })
  status: DisputeStatus

  @Column({ type: 'json', nullable: true, comment: '额外配置' })
  options: Record<string, unknown>

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date
}
