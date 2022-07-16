import { ICard } from './ICard'

export interface IPlayer {
  name: string
  money: number
  betAmountSum: number
  betAmountCurrentRound: number
  folded: boolean
  checked?: boolean
  cards?: ICard[]
}

export type IPlayerDTO = Omit<IPlayer, 'cards'>
