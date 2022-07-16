import { ICard } from './ICard'
import { IPlayerDTO } from './IPlayer'

export interface IGameState {
  players: IPlayerDTO[]
  tableCards: ICard[]
  bettingRoundNum: number
  maxBetCurrentRound: number
  currentPlayer?: IPlayerDTO
  potAmount: number
}
