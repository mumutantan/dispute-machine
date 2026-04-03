import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Dispute } from './entities/dispute.entity'
import { CreateDisputeDto, UpdateDisputeDto } from './dto/dispute.dto'

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>
  ) {}

  /**
   * 创建争端
   */
  async create(createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    const dispute = this.disputeRepository.create(createDisputeDto)
    return await this.disputeRepository.save(dispute)
  }

  /**
   * 获取所有争端
   */
  async findAll(): Promise<Dispute[]> {
    return await this.disputeRepository.find({
      order: {
        createdAt: 'DESC'
      }
    })
  }

  /**
   * 获取单个争端
   */
  async findOne(id: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({ where: { id } })
    if (!dispute) {
      throw new NotFoundException(`争端 #${id} 不存在`)
    }
    return dispute
  }

  /**
   * 更新争端
   */
  async update(id: string, updateDisputeDto: UpdateDisputeDto): Promise<Dispute> {
    const dispute = await this.findOne(id)
    Object.assign(dispute, updateDisputeDto)
    return await this.disputeRepository.save(dispute)
  }

  /**
   * 删除争端
   */
  async remove(id: string): Promise<void> {
    const dispute = await this.findOne(id)
    await this.disputeRepository.remove(dispute)
  }
}
