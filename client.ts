import clientIo from 'socket.io-client'
import dayjs from 'dayjs'

const clientSocket = clientIo('ws://localhost:3000/client', {
  query: { name: 'mypc', token: 'OO8MH' },
})

clientSocket.on('connect', response => {
  console.log('connected')
})

clientSocket.on('error', response => {
  console.log(response)
})

clientSocket.on('update', response => {
  console.log(response)
})
