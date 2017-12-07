import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import { autoCorrelateAudioData, frequencyData } from '../pitchDetection'

const FFTSize = 2048
const MIC_STATUS = {
  REQUESTED: 0,
  ALLOWED: 1,
  DENIED: 2
}

export default class extends Phaser.State {
  // init -> preload -> create -> render loop
  init () {
    this.requestUserMedia = this.requestUserMedia.bind(this)
  }

  preload () {
    // Setup AudioContext and Analysers
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftsize = FFTSize
    this.analyser.smoothingTimeConstant = 0

    this.gainNode = this.audioCtx.createGain()
    this.gainNode.gain.value = 0

    this.sendingAudioData = MIC_STATUS.REQUESTED
    this.stream = null
    this.microphone = null
    this.frequencyBuffer = new Float32Array(FFTSize)
  }

  create () {
    const bannerText = 'Loading...'
    this.banner = this.add.text(this.world.centerX, this.game.height - 80, bannerText)
    this.banner.font = 'Bangers'
    this.banner.padding.set(10, 16)
    this.banner.fontSize = 40
    this.banner.fill = '#77BFA3'
    this.banner.smoothed = false
    this.banner.anchor.setTo(0.5)

    this.mushroom = new Mushroom({
      game: this.game,
      x: this.world.centerX,
      y: this.world.centerY,
      asset: 'mushroom'
    })

    this.game.add.existing(this.mushroom)
    this.requestUserMedia()
  }

  async requestUserMedia () {
    try {
      // Try get user's microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.stream = stream
      this.microphone = this.audioCtx.createMediaStreamSource(stream)

      // Connect everything together
      // microphone -> analyser -> gainNode -> audioCtx.destination
      this.microphone.connect(this.analyser)
      this.analyser.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)

      // Successfully connected, starting the app
      this.sendingAudioData = MIC_STATUS.ALLOWED
    } catch (err) {
      this.sendingAudioData = MIC_STATUS.DENIED
    }
  }

  render () {
    if (this.sendingAudioData === MIC_STATUS.REQUESTED) {
      this.banner.text = 'Waiting for microphone...'
    } else if (this.sendingAudioData === MIC_STATUS.DENIED) {
      this.banner.text = 'Got rejected, feelsbad'
    } else {
      // Pitch detection
      this.analyser.getFloatTimeDomainData(this.frequencyBuffer)
      const frequency = Math.floor(autoCorrelateAudioData(this.frequencyBuffer, this.audioCtx.sampleRate))
      const { octave, note } = frequencyData(frequency)

      if (frequency === -1) {
        this.banner.text = 'Frequency: N/A  -  Octave: N/A  -  Note: N/A'
      } else {
        this.banner.text = `Frequency: ${frequency}  -  Octave: ${octave}  -  Note: ${note}`
      }
    }
  }
}
