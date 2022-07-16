import './App.css'
import { useEffect, useState } from 'react'
import { IPlayer } from './models/IPlayer'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { IGameState } from './models/IGameState'
import poker_chip from './assets/poker-chip.svg'
import card_back_blue from './assets/card back blue.png'

const WS_URL = 'ws://localhost:7999'
let websocket: WebSocket

enum GameStatus {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  START_GAME = 'START_GAME',
  ENTER_GAME = 'ENTER_GAME',
  END_GAME = 'END_GAME',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAY = 'PLAY',
  UPDATE_GAME_STATE = 'UPDATE_GAME_STATE',
  NOTIFICATION = 'NOTIFICATION',
  WAIT_YOUR_TURN = 'WAIT_YOUR_TURN',
  UPDATE_PLAYER_STATE = 'UPDATE_PLAYER_STATE',
}

enum ActionType {
  CHECK = 'CHECK',
  CALL = 'CALL',
  RAISE = 'RAISE',
  FOLD = 'FOLD',
}

const App = () => {
  const [gameStatus, setGameStatus] = useState(GameStatus.WAITING_FOR_PLAYERS)
  const [player, setPlayer] = useState({} as IPlayer)
  const [raiseInput, setRaiseInput] = useState(1)
  const [gameState, setGameState] = useState({} as IGameState)
  const [notificationHistory, setNotificationHistory] = useState([] as string[])

  useEffect(() => {
    console.log(gameState)
    console.log(player)

    console.log(player.folded)
  }, [gameState, player])

  useEffect(() => {
    websocket = new WebSocket(WS_URL)

    websocket.onmessage = (message) => {
      const messageObject = JSON.parse(message.data)
      if (messageObject.type === GameStatus.PLAYER_LEFT) {
        notify(messageObject.player + ' has left the game')
      }
      if (messageObject.type === GameStatus.START_GAME) {
        setGameStatus(GameStatus.START_GAME)
        notify('Game started')
      }
      if (messageObject.type === GameStatus.END_GAME) {
        setGameStatus(GameStatus.END_GAME)
        notify('Game ended')
      }
      if (messageObject.type === GameStatus.NOTIFICATION) {
        notify(messageObject.payload.notification)
      }
      if (messageObject.type === GameStatus.PLAY) {
        setGameStatus(GameStatus.PLAY)
        setRaiseInput(1)
      }
      if (messageObject.type === GameStatus.UPDATE_GAME_STATE) {
        setGameState(messageObject.payload.gameState)
      }
      if (messageObject.type === GameStatus.UPDATE_PLAYER_STATE) {
        setPlayer(messageObject.payload.playerState)
      }
      if (messageObject.type === GameStatus.WAIT_YOUR_TURN) {
        setGameStatus(GameStatus.WAIT_YOUR_TURN)
      }
    }
  }, [])

  const notify = (notification: string) => {
    toast(notification, { position: 'top-center' })
    setNotificationHistory((prevState) => [...prevState, notification])
  }

  const enterGame = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    websocket.send(JSON.stringify({ type: GameStatus.ENTER_GAME, player }))
  }

  const handleCheck = () => {
    websocket.send(
      JSON.stringify({
        type: GameStatus.PLAY,
        action: ActionType.CHECK,
      })
    )
  }

  const handleCall = () => {
    websocket.send(
      JSON.stringify({
        type: GameStatus.PLAY,
        action: ActionType.CALL,
      })
    )
  }

  const handleRaise = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    if (
      player.money <
      gameState.maxBetCurrentRound - player.betAmountCurrentRound + raiseInput
    ) {
      toast(
        `Can't raise more than ${
          player.money -
          (gameState.maxBetCurrentRound - player.betAmountCurrentRound)
        }`,
        { position: 'top-center' }
      )
    } else {
      websocket.send(
        JSON.stringify({
          type: GameStatus.PLAY,
          action: ActionType.RAISE,
          amount: raiseInput,
        })
      )
    }
  }

  const handleFold = () => {
    websocket.send(
      JSON.stringify({
        type: GameStatus.PLAY,
        action: ActionType.FOLD,
      })
    )
  }

  return (
    <div>
      <ToastContainer />

      {gameStatus === GameStatus.WAITING_FOR_PLAYERS && (
        <form>
          <label> name </label>
          <input
            required
            onChange={(e) =>
              setPlayer((prevState) => ({
                ...prevState,
                name: e.target.value,
              }))
            }
          />
          <label> money </label>
          <input
            required
            type='number'
            onChange={(e) =>
              setPlayer((prevState) => ({
                ...prevState,
                money: Number(e.target.value),
              }))
            }
          />
          <button onClick={enterGame}> ENTER GAME </button>
        </form>
      )}

      {gameState.currentPlayer && (
        <div>
          <p>
            Playing -
            <span className='font-bold'>{gameState.currentPlayer.name}</span>
          </p>
        </div>
      )}

      {player.cards && (
        <div
          className={`flex flex-col gap-4 items-center fixed bottom-0 right-1/2 translate-x-1/2 p-2 ${
            gameState.currentPlayer!.name === player.name ? 'bg-green-400' : ''
          }`}
        >
          {player.betAmountCurrentRound !== 0 && (
            <div className='relative w-fit h-fit'>
              <span className='absolute bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 text-white'>
                {player.betAmountCurrentRound}
              </span>
              <img src={poker_chip} alt='poker_chip' className='w-14' />
            </div>
          )}
          <div className='flex gap-4 items-center'>
            <div className='flex gap-2'>
              {player.cards.map((card) => (
                <img
                  key={card.number + card.suit}
                  src={`./cards/${card.number}_${card.suit}.png`}
                  alt='card'
                  className='w-32'
                />
              ))}
            </div>
            <div className='relative w-fit h-fit'>
              <span className='absolute bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 text-white'>
                {player.money}
              </span>
              <img src={poker_chip} alt='poker_chip' className='w-14' />
            </div>
          </div>
        </div>
      )}

      {gameState.players && (
        <>
          {gameState.players
            .filter((player1) => player1.name !== player.name)
            .map((player) => (
              <div
                key={player.name}
                className={`flex flex-col-reverse gap-4 items-center fixed top-0 right-1/2 translate-x-1/2 p-2 ${
                  gameState.currentPlayer!.name === player.name
                    ? 'bg-green-400'
                    : ''
                }`}
              >
                {player.betAmountCurrentRound !== 0 && (
                  <div className='relative w-fit h-fit'>
                    <span className='absolute bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 text-white'>
                      {player.betAmountCurrentRound}
                    </span>
                    <img src={poker_chip} alt='poker_chip' className='w-14' />
                  </div>
                )}
                <div className='flex gap-4 items-center'>
                  <div className='flex gap-2'>
                    <img src={card_back_blue} alt='card' className='w-32' />
                    <img src={card_back_blue} alt='card' className='w-32' />
                  </div>
                  <div className='relative w-fit h-fit'>
                    <span className='absolute bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 text-white'>
                      {player.money}
                    </span>
                    <img src={poker_chip} alt='poker_chip' className='w-14' />
                  </div>
                </div>
              </div>
            ))}
        </>
      )}

      {gameState.tableCards && (
        <div className='test flex flex-col items-center gap-2 fixed bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 max-w-xl'>
          <div className='flex gap-2'>
            {gameState.tableCards.map((card) => (
              <img
                key={card.number + card.suit}
                src={`./cards/${card.number}_${card.suit}.png`}
                alt='card'
                className='w-32'
              />
            ))}
          </div>
          {gameState.potAmount !== 0 && (
            <div className='relative w-fit h-fit'>
              <span className='absolute bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 text-white'>
                {gameState.potAmount}
              </span>
              <img src={poker_chip} alt='poker_chip' className='w-14' />
            </div>
          )}
        </div>
      )}

      {gameStatus === GameStatus.PLAY && (
        <div className='flex flex-col gap-4 fixed bottom-0 p-2'>
          {gameState.maxBetCurrentRound === player.betAmountCurrentRound && (
            <button
              onClick={handleCheck}
              className='border-0 bg-blue-400 rounded-md text-white font-bold text-xl p-2'
            >
              CHECK
            </button>
          )}
          {gameState.maxBetCurrentRound > player.betAmountCurrentRound && (
            <>
              <button
                onClick={handleCall}
                className='border-0 bg-orange-400 rounded-md text-white font-bold text-xl p-2'
              >
                CALL{' '}
                {gameState.maxBetCurrentRound - player.betAmountCurrentRound}
              </button>
            </>
          )}

          {player.money -
            (gameState.maxBetCurrentRound - player.betAmountCurrentRound) !==
            0 && (
            <form className='text-center'>
              <button
                onClick={handleRaise}
                className='border-0 bg-green-400 rounded-md text-white font-bold text-xl p-2 w-full'
              >
                RAISE{' '}
                {gameState.maxBetCurrentRound !== 0
                  ? gameState.maxBetCurrentRound -
                    player.betAmountCurrentRound +
                    '+' +
                    raiseInput
                  : raiseInput}
              </button>
              <input
                type='range'
                min={1}
                value={raiseInput}
                max={
                  player.money -
                  (gameState.maxBetCurrentRound - player.betAmountCurrentRound)
                }
                onChange={(e) => setRaiseInput(Number(e.target.value))}
                className='w-full border-0 border-b-2 border-gray-500'
              />
            </form>
          )}
          <button
            onClick={handleFold}
            className='border-0 bg-red-400 rounded-md text-white font-bold text-xl p-2'
          >
            FOLD
          </button>
        </div>
      )}

      <div className='flex flex-col fixed bottom-0 right-0 border w-52 text-center max-h-64 overflow-auto bg-white'>
        {notificationHistory.map((notification, i) => (
          <p key={i}> {notification} </p>
        ))}
      </div>
    </div>
  )
}

export default App
