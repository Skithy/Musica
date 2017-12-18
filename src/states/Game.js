import Phaser from 'phaser'
import { autoCorrelateAudioData, frequencyData } from '../pitchDetection'
import { parseMusicXML, octaveNoteToValue } from '../musicXMLParser'

const FFTSize = 2048
const MIC_STATUS = {
  REQUESTED: 0,
  ALLOWED: 1,
  DENIED: 2
}
const BOX_SIZE = 20
const BPS = 12
const BOX_SPEED = 4 // <-- ceebs for now

const START_POS = 100 // Start position of music score

export default class extends Phaser.State {
  // init -> preload -> create -> render loop
  init () {
    this.getMusicData = this.getMusicData.bind(this)
    this.requestUserMedia = this.requestUserMedia.bind(this)
    this.createBanner = this.createBanner.bind(this)
    this.createMusicSheet = this.createMusicSheet.bind(this)
    this.createIncomingMusic = this.createIncomingMusic.bind(this)
    this.animateNotes = this.animateNotes.bind(this)
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

    this.notesdata = {
      38: { colour: 0x880000, pos: 250, note: 'B' },
      39: { colour: 0xFF0000, pos: 235, note: 'C' }, // Middle C
      40: { colour: 0x008800, pos: 235, note: 'C#' },
      41: { colour: 0x888800, pos: 220, note: 'D' },
      42: { colour: 0xFF8800, pos: 220, note: 'D#' },
      43: { colour: 0x00FF00, pos: 205, note: 'E' },
      44: { colour: 0x88FF00, pos: 190, note: 'F' },
      45: { colour: 0xFFFF00, pos: 190, note: 'F#' },
      46: { colour: 0x000088, pos: 175, note: 'G' },
      47: { colour: 0x880088, pos: 175, note: 'G#' },
      48: { colour: 0xFF0088, pos: 160, note: 'A' },
      49: { colour: 0x008888, pos: 160, note: 'A#' },
      50: { colour: 0x888888, pos: 145, note: 'B' },
      51: { colour: 0xFF8888, pos: 130, note: 'C' }, // Better C
      52: { colour: 0x00FF88, pos: 130, note: 'C#' },
      53: { colour: 0x88FF88, pos: 115, note: 'D' },
      54: { colour: 0xFFFF88, pos: 115, note: 'D#' },
      55: { colour: 0x0000FF, pos: 100, note: 'E' },
      56: { colour: 0x8800FF, pos: 85, note: 'F' },
      57: { colour: 0xFF00FF, pos: 85, note: 'F#' },
      58: { colour: 0x0088FF, pos: 70, note: 'G' },
      59: { colour: 0x8888FF, pos: 70, note: 'G#' },
      60: { colour: 0xFF88FF, pos: 55, note: 'A' },
      61: { colour: 0x00FFFF, pos: 55, note: 'A#' },
      62: { colour: 0x88FFFF, pos: 40, note: 'B' }
    }

    this.beats = 0
  }

  createBanner () {
    this.banner = this.add.text(this.world.centerX, this.game.height - 80, 'Loading...', { font: '16px Arial', fill: '#dddddd', align: 'center' })
    this.banner.font = 'Bangers'
    this.banner.padding.set(10, 16)
    this.banner.fontSize = 40
    this.banner.fill = '#77BFA3'
    this.banner.smoothed = false
    this.banner.anchor.setTo(0.5)
  }

  createMusicSheet () {
    const createBarLines = (gfx) => {
      gfx.beginFill(0xFF0000)
      gfx.lineStyle(2, 0x000000, 1)
      for (let i = 0; i < 5; i++) {
        gfx.moveTo(0, START_POS + i * 30)
        gfx.lineTo(this.world.width, START_POS + i * 30)
      }
    }

    const createStartLine = (gfx) => {
      gfx = this.add.graphics(0, 0)
      gfx.beginFill(0xFF0000)
      gfx.lineStyle(2, 0x000000, 1)

      gfx.moveTo(100, 100)
      gfx.lineTo(100, 220)
    }

    this.barLinesGfx = this.add.graphics(0, 0)
    createBarLines(this.barLinesGfx)

    this.gfx = this.add.graphics(0, 0)

    this.startLineGfx = this.add.graphics(0, 0)
    createStartLine(this.startLineGfx)
  }

  createIncomingMusic () {
    const createIncomingBarLines = (gfx) => {
      const totalBeats = this.musicData.reduce((total, note) => total + note.duration, 0)
      for (let i = 0; i < totalBeats; i += this.timeSignature.beats * 12) {
        gfx.moveTo(i * BOX_SIZE, 100)
        gfx.lineTo(i * BOX_SIZE, 220)
      }
    }

    const createIncomingNotes = (gfx) => {
      gfx.lineStyle(2, 0x000234, 1)
      gfx.beginFill(0x00f754)

      this.noteLabels = []

      let currentBeat = 0
      for (let note of this.musicData) {
        const {pitchValue, duration} = note
        if (pitchValue != 0 && this.notesdata[pitchValue]) {
          const height = this.notesdata[pitchValue].pos
          gfx.drawRect(currentBeat * BOX_SIZE, height + 2, duration * BOX_SIZE - 2, 26)

          const labelX = START_POS + currentBeat * BOX_SIZE + (duration * BOX_SIZE) / 2
          const labelY = height
          const labelText = this.notesdata[pitchValue].note
          this.noteLabels.push(this.add.text(labelX, labelY, labelText))
        }
        currentBeat += note.duration
      }
    }

    this.playBox = this.add.graphics(100, 0)

    createIncomingBarLines(this.playBox)
    createIncomingNotes(this.playBox)
  }

  create () {
    this.getMusicData()
    this.requestUserMedia()

    this.createBanner()
    this.createMusicSheet()

    this.createIncomingMusic()

    // Metronome circle showing beats
    this.metronome = game.add.graphics(0, 0)
    this.metronome.beginFill(0x000000)
    this.metronome.lineStyle(1, 0x000000, 1)

    this.timerText = this.add.text(0, 0, ' ')

    this.beatText = this.add.text(this.world.centerX, this.game.height - 160, ' ')
  }

  getMusicData () {
    const xmlText = this.cache.getText('musicxml')
    const xml = (new DOMParser()).parseFromString(xmlText, 'text/xml')
    const { musicData, timeSignature } = parseMusicXML(xml)
    this.musicData = musicData
    this.timeSignature = timeSignature
    console.log(this.musicData)
    console.log(this.timeSignature)
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
      // Microphone rejected
      this.sendingAudioData = MIC_STATUS.DENIED
    }
  }

  animateNotes () {
    this.playBox.x -= BOX_SPEED
    // for (let label in this.noteLabels) {
    //  label.x -= BOX_SPEED
    // }
  }

  render () {
    // Removes previous draw and redraws when needed
    this.gfx.clear()

    this.animateNotes()

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
        // No note detected
        this.banner.text = 'Frequency: N/A  -  Octave: N/A  -  Note: N/A'
      } else {
        // Note detected
        this.banner.text = `Frequency: ${frequency}  -  Octave: ${octave}  -  Note: ${note}`

        // Draw rect
        const num = octaveNoteToValue(octave, note)
        if (this.notesdata[num]) {
          const data = this.notesdata[num]
          this.gfx.beginFill(data.colour, 0.65)
          this.gfx.lineStyle(2, data.colour, 1)
          this.gfx.drawRect(0, data.pos + 2, this.world.width, 26)
          this.gfx.endFill()
        }
      }

      this.timerText.text = `Elapsed time: ${this.time.totalElapsedSeconds()}`
      const beatCounter = Math.floor(this.time.totalElapsedSeconds() * BPS)
      this.beats = beatCounter
      this.beatText.text = `Beat: ${beatCounter} `
    }
  }
}
