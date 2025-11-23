import './style.css'
import { startGame } from './game'
import { InsertCoin } from 'insert-coin'

const amountSats = import.meta.env.VITE_AMOUNT_SATS || 500
const arkAddress = import.meta.env.VITE_ARK_ADDRESS || ''
const arkServerUrl = import.meta.env.VITE_ARK_SERVER_URL || 'https://arkade.computer'
const boltzApiUrl = import.meta.env.VITE_BOLTZ_API_URL || 'https://api.ark.boltz.exchange'
const privateKey = import.meta.env.VITE_PRIVATE_KEY || ''

class UI {
  button: HTMLButtonElement | undefined
  readonly game: HTMLDivElement
  readonly paywall: HTMLDivElement
  readonly canvas: HTMLCanvasElement
  readonly container: HTMLDivElement

  constructor() {
    const game = document.querySelector<HTMLDivElement>('#game')
    const paywall = document.querySelector<HTMLDivElement>('#paywall')
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas')
    const container = document.querySelector<HTMLDivElement>('#container')
    if (!paywall) throw new Error('Paywall div not found')
    if (!container) throw new Error('Container not found')
    if (!canvas) throw new Error('Canvas not found')
    if (!game) throw new Error('Game div not found')
    this.container = container
    this.paywall = paywall
    this.canvas = canvas
    this.game = game
  }

  addPayButton(): void {
    const button = document.createElement('button')
    button.textContent = `Pay ${amountSats} sats to play`
    button.style.marginTop = '3rem'
    button.id = 'insertCoin'
    this.button = button
    this.container.appendChild(button)
  }

  // show game if user has already paid
  // game will add joysticks if touch screen
  showGame(): void {
    this.paywall.style.display = 'none'
    this.game.style.display = 'block'
    startGame({ canvas: this.canvas, autoPlay: true })
  }

  // show loading message
  showLoadingMessage(): void {
    this.container.innerHTML = `
      <div style="padding-top: 3rem">
        <img src="/loading.svg" alt="Loading..." />
        <p>Preparing your invoice...</p>
      </div>
    `
  }

  // show QR code for invoice
  showQrCode(options: { invoice: string; qrCodeHtml: string }): void {
    this.container.innerHTML = `
      <div id="qrCode">
        ${options.qrCodeHtml}
        <p>Scan to pay ${amountSats} sats or<br />click to copy the invoice below</p>
      </div>
    `
    const qrData = document.createElement('div')
    qrData.id = 'qrData'
    qrData.textContent = options.invoice
    qrData.addEventListener('click', () => {
      navigator.clipboard.writeText(options.invoice)
      qrData.textContent = 'Invoice copied to clipboard!'
      setTimeout(() => {
        qrData.textContent = options.invoice
      }, 2100)
    })
    this.container.appendChild(qrData)
  }
}

const ui = new UI()

ui.addPayButton()

// add event listener to pay button
ui.button!.addEventListener('click', async () => {
  return ui.showGame() // TEMPORARY BYPASS PAYMENT
  ui.showLoadingMessage()

  // create InsertCoin provider
  const provider = await InsertCoin.create({
    arkAddress,
    arkServerUrl,
    boltzApiUrl,
    privateKey,
  })

  // request payment
  provider.requestPayment({
    amountSats,
    description: 'Arkade invaders',
    onInvoice: ui.showQrCode.bind(ui),
    onPayment: ui.showGame.bind(ui),
  })
})
