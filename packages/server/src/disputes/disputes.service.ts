import { Injectable } from '@nestjs/common'
import { DbService } from '../database/database.module'

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

export interface DisputeRow {
  id: string
  title: string
  description: string
  type: string
  status: string
  config: string
  result: string
  created_at: string
  finished_at: string | null
}

export interface ParticipantRow {
  id: string
  dispute_id: string
  name: string
  role: string
  weight: number
  choice: string
  is_winner: number
  created_at: string
}

export interface OptionRow {
  id: string
  dispute_id: string
  content: string
}

@Injectable()
export class DisputesService {
  constructor(private readonly db: DbService) {}

  // ==================== 争端 CRUD ====================

  create(data: {
    title: string
    description?: string
    type: DisputeType
    participantNames?: string[]
    options?: string[]
  }) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // 事务：手动 begin/commit
    this.db.run('BEGIN')
    try {
      this.db.run(
        'INSERT INTO disputes (id, title, description, type, status, config, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.title, data.description || '', data.type, 'pending', '{}', '{}', now]
      )

      if (data.participantNames?.length) {
        for (const name of data.participantNames) {
          this.db.run(
            'INSERT INTO participants (id, dispute_id, name, role, weight, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), id, name, 'player', 1.0, now]
          )
        }
      }

      if (data.options?.length) {
        for (const content of data.options) {
          this.db.run(
            'INSERT INTO options (id, dispute_id, content) VALUES (?, ?, ?)',
            [crypto.randomUUID(), id, content]
          )
        }
      }

      this.db.run('COMMIT')
    } catch (e) {
      this.db.run('ROLLBACK')
      throw e
    }

    this.db.save()
    return this.findOne(id)
  }

  findOne(id: string) {
    const dispute = this.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as DisputeRow | undefined
    if (!dispute) return null

    const participants = this.db.prepare('SELECT * FROM participants WHERE dispute_id = ?').all(id) as ParticipantRow[]
    const options = this.db.prepare('SELECT * FROM options WHERE dispute_id = ?').all(id) as OptionRow[]

    return {
      ...dispute,
      config: JSON.parse(dispute.config || '{}'),
      result: JSON.parse(dispute.result || '{}'),
      participants,
      options
    }
  }

  // ==================== 加入争端 ====================

  join(disputeId: string, data: { name: string; weight?: number }) {
    const dispute = this.db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as DisputeRow | undefined
    if (!dispute) return null

    if (dispute.status === 'finished') {
      throw new Error('争端已结束')
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    this.db.run(
      'INSERT INTO participants (id, dispute_id, name, role, weight, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, disputeId, data.name, 'player', data.weight || 1.0, now]
    )

    this.db.run("UPDATE disputes SET status = 'playing' WHERE id = ? AND status = 'pending'", [disputeId])
    this.db.save()

    return this.findOne(disputeId)
  }

  // ==================== 运气服人：提交选择 ====================

  play(disputeId: string, data: { participantId: string; choice: string }) {
    const dispute = this.db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as DisputeRow | undefined
    if (!dispute) return null

    if (dispute.status === 'finished') {
      throw new Error('争端已结束')
    }

    const participant = this.db.prepare(
      'SELECT * FROM participants WHERE id = ? AND dispute_id = ?'
    ).get(data.participantId, disputeId) as ParticipantRow | undefined

    if (!participant) {
      throw new Error('参与方不存在')
    }

    if (participant.choice) {
      throw new Error('已提交过选择')
    }

    this.db.run("UPDATE disputes SET status = 'playing' WHERE id = ? AND status = 'pending'", [disputeId])
    this.db.run('UPDATE participants SET choice = ? WHERE id = ?', [data.choice, data.participantId])

    // 检查是否所有人都选了
    const allParticipants = this.db.prepare(
      'SELECT * FROM participants WHERE dispute_id = ?'
    ).all(disputeId) as ParticipantRow[]

    const allChosen = allParticipants.every(p => p.choice !== '')

    if (allChosen) {
      const result = this.resolveGame(disputeId, dispute.type, allParticipants)
      this.db.save()
      return result
    }

    this.db.save()
    return this.findOne(disputeId)
  }

  /**
   * 判定游戏结果
   */
  private resolveGame(disputeId: string, type: string, participants: ParticipantRow[]) {
    let result: any

    if (type === DisputeType.LUCK_RPS) {
      result = this.resolveRPS(participants)
    } else if (type === DisputeType.LUCK_DICE) {
      result = this.resolveDice(disputeId, participants)
    } else {
      throw new Error(`不支持的类型: ${type}`)
    }

    const now = new Date().toISOString()

    this.db.run(
      "UPDATE disputes SET status = 'finished', result = ?, finished_at = ? WHERE id = ?",
      [JSON.stringify(result), now, disputeId]
    )

    if (result.winners) {
      for (const winnerId of result.winners) {
        this.db.run('UPDATE participants SET is_winner = 1 WHERE id = ?', [winnerId])
      }
    }

    return this.findOne(disputeId)
  }

  /**
   * 剪刀石头布判定
   */
  private resolveRPS(participants: ParticipantRow[]) {
    const choices = participants.map(p => ({
      id: p.id,
      name: p.name,
      choice: p.choice
    }))

    if (choices.length === 2) {
      // 两人模式
      const { winner, reason } = this.rpsCompare(choices[0].choice, choices[1].choice)
      if (winner === 'draw') {
        const lucky = choices[Math.floor(Math.random() * 2)]
        return {
          type: 'luck_rps',
          choices,
          winners: [lucky.id],
          winnerId: lucky.id,
          winnerName: lucky.name,
          reason: '平局！随机决定 ' + lucky.name + ' 获胜 🎲',
          draw: true
        }
      }
      const w = winner === 'player1' ? choices[0] : choices[1]
      return {
        type: 'luck_rps',
        choices,
        winners: [w.id],
        winnerId: w.id,
        winnerName: w.name,
        reason: `${w.name} 出 ${this.choiceToEmoji(w.choice)} 赢了！${reason}`,
        draw: false
      }
    } else {
      return this.rpsMultiplayer(choices)
    }
  }

  private rpsCompare(c1: string, c2: string): { winner: string; reason: string } {
    if (c1 === c2) return { winner: 'draw', reason: '平局' }

    const wins: Record<string, string> = {
      rock: 'scissors',
      scissors: 'paper',
      paper: 'rock'
    }

    if (wins[c1] === c2) {
      return { winner: 'player1', reason: `${this.choiceToEmoji(c1)} > ${this.choiceToEmoji(c2)}` }
    }
    return { winner: 'player2', reason: `${this.choiceToEmoji(c2)} > ${this.choiceToEmoji(c1)}` }
  }

  private rpsMultiplayer(choices: { id: string; name: string; choice: string }[]) {
    const counts: Record<string, { id: string; name: string }[]> = {}
    for (const c of choices) {
      if (!counts[c.choice]) counts[c.choice] = []
      counts[c.choice].push(c)
    }

    if (Object.keys(counts).length === 1) {
      const lucky = choices[Math.floor(Math.random() * choices.length)]
      return {
        type: 'luck_rps',
        choices,
        winners: [lucky.id],
        winnerId: lucky.id,
        winnerName: lucky.name,
        reason: '所有人出的一样！随机决定 ' + lucky.name + ' 获胜 🎲',
        draw: true
      }
    }

    if (Object.keys(counts).length === 3) {
      const lucky = choices[Math.floor(Math.random() * choices.length)]
      return {
        type: 'luck_rps',
        choices,
        winners: [lucky.id],
        winnerId: lucky.id,
        winnerName: lucky.name,
        reason: '三种手势都有！随机决定 ' + lucky.name + ' 获胜 🎲',
        draw: true
      }
    }

    const [k1, k2] = Object.keys(counts)
    const { winner: wKey } = this.rpsCompare(k1, k2)
    const winningChoice = wKey === 'player1' ? k1 : k2
    const winners = counts[winningChoice]
    const finalWinner = winners[Math.floor(Math.random() * winners.length)]

    return {
      type: 'luck_rps',
      choices,
      winners: [finalWinner.id],
      winnerId: finalWinner.id,
      winnerName: finalWinner.name,
      reason: `${this.choiceToEmoji(winningChoice)} 赢了！${finalWinner.name} 从 ${winners.length} 人中脱颖而出 🏆`,
      draw: false
    }
  }

  /**
   * 骰子比大小判定
   */
  private resolveDice(disputeId: string, participants: ParticipantRow[]) {
    const choices = participants.map(p => {
      const val = parseInt(p.choice, 10)
      const value = isNaN(val) ? Math.floor(Math.random() * 6) + 1 : val
      return { id: p.id, name: p.name, choice: String(value), value }
    })

    // 更新随机值到数据库
    for (const c of choices) {
      this.db.run('UPDATE participants SET choice = ? WHERE id = ?', [c.choice, c.id])
    }

    const maxVal = Math.max(...choices.map(c => c.value))
    const winners = choices.filter(c => c.value === maxVal)
    const finalWinner = winners[Math.floor(Math.random() * winners.length)]

    return {
      type: 'luck_dice',
      choices,
      winners: [finalWinner.id],
      winnerId: finalWinner.id,
      winnerName: finalWinner.name,
      reason: `${finalWinner.name} 掷出 ${maxVal} 点，大获全胜！🎲`
    }
  }

  // ==================== 做决定：投票 ====================

  vote(disputeId: string, data: { participantId: string; optionId: string }) {
    const dispute = this.db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as DisputeRow | undefined
    if (!dispute) return null

    if (dispute.status === 'finished') {
      throw new Error('争端已结束')
    }

    const participant = this.db.prepare(
      'SELECT * FROM participants WHERE id = ? AND dispute_id = ?'
    ).get(data.participantId, disputeId) as ParticipantRow | undefined

    if (!participant) {
      throw new Error('参与方不存在')
    }

    const option = this.db.prepare(
      'SELECT * FROM options WHERE id = ? AND dispute_id = ?'
    ).get(data.optionId, disputeId) as OptionRow | undefined

    if (!option) {
      throw new Error('选项不存在')
    }

    if (participant.choice) {
      throw new Error('已投过票')
    }

    this.db.run("UPDATE disputes SET status = 'playing' WHERE id = ? AND status = 'pending'", [disputeId])
    this.db.run('UPDATE participants SET choice = ? WHERE id = ?', [data.optionId, data.participantId])

    const allParticipants = this.db.prepare(
      'SELECT * FROM participants WHERE dispute_id = ?'
    ).all(disputeId) as ParticipantRow[]

    const allVoted = allParticipants.every(p => p.choice !== '')

    if (allVoted) {
      const result = this.resolveVote(disputeId, allParticipants)
      this.db.save()
      return result
    }

    this.db.save()
    return this.findOne(disputeId)
  }

  /**
   * 做决定：加权投票结果
   */
  private resolveVote(disputeId: string, participants: ParticipantRow[]) {
    const allOptions = this.db.prepare(
      'SELECT * FROM options WHERE dispute_id = ?'
    ).all(disputeId) as OptionRow[]

    const scores: Record<string, number> = {}
    const votes: Record<string, { name: string; weight: number }[]> = {}

    for (const opt of allOptions) {
      scores[opt.id] = 0
      votes[opt.id] = []
    }

    for (const p of participants) {
      if (scores[p.choice] !== undefined) {
        scores[p.choice] += p.weight
        votes[p.choice].push({ name: p.name, weight: p.weight })
      }
    }

    const maxScore = Math.max(...Object.values(scores))
    const topOptionIds = Object.keys(scores).filter(id => scores[id] === maxScore)
    const winnerOptionId = topOptionIds[Math.floor(Math.random() * topOptionIds.length)]
    const winnerOption = allOptions.find(o => o.id === winnerOptionId)!

    const voteDetails = allOptions.map(opt => ({
      optionId: opt.id,
      content: opt.content,
      score: scores[opt.id],
      voters: votes[opt.id] || []
    }))

    const result = {
      type: 'decide',
      choices: voteDetails,
      voteDetails,
      winnerOptionId,
      winnerOptionContent: winnerOption.content,
      winnerScore: maxScore,
      reason: `「${winnerOption.content}」以 ${maxScore} 分获胜！🎉`
    }

    const now = new Date().toISOString()
    this.db.run(
      "UPDATE disputes SET status = 'finished', result = ?, finished_at = ? WHERE id = ?",
      [JSON.stringify(result), now, disputeId]
    )

    return this.findOne(disputeId)
  }

  // ==================== 获取结果 ====================

  getResult(id: string) {
    const dispute = this.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as DisputeRow | undefined
    if (!dispute) return null

    const participants = this.db.prepare('SELECT * FROM participants WHERE dispute_id = ?').all(id) as ParticipantRow[]
    const options = this.db.prepare('SELECT * FROM options WHERE dispute_id = ?').all(id) as OptionRow[]

    return {
      ...dispute,
      config: JSON.parse(dispute.config || '{}'),
      result: JSON.parse(dispute.result || '{}'),
      participants,
      options
    }
  }

  private choiceToEmoji(choice: string): string {
    const map: Record<string, string> = {
      rock: '✊',
      scissors: '✌️',
      paper: '🖐️'
    }
    return map[choice] || choice
  }
}
