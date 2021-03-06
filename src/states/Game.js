// @flow
import Phaser from 'phaser'
import { autoCorrelateAudioData, frequencyData } from '../pitchDetection'
import { parseMusicXML, octaveNoteToValue } from '../musicXMLParser'
import { drawLine, drawDottedLine } from '../drawGraphics'

const FFTSize = 2048
const MIC_STATUS = {
  REQUESTED: 0,
  ALLOWED: 1,
  DENIED: 2
}

const GAME_STATE = {
  GAME: 0,
  MENU: 1,
  RESUME_COUNTDOWN: 2
}

const BOX_SIZE = 20 // width of 1/12 of beat
const START_POS = 100 // Start position of music score

const calculateScrollSpeed = (bpm: number, boxSize: number): number => {
  // how many pixels a minute?
  // scroll speed * 60 * 60 = boxSize * 12 * bpm
  return boxSize * 12 * bpm / 3600
}

const destroy = (item) => { if (item) item.destroy() }

const playSound = (audioCtx: AudioContext) => {
  const osc = audioCtx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 440
  osc.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.1)
}

export default class extends Phaser.State {
  notesdata = {
    '38': { colour: 0x880000, pos: 250, note: 'B' },
    '39': { colour: 0xFF0000, pos: 235, note: 'C' }, // Middle C
    '40': { colour: 0x008800, pos: 235, note: 'C#' },
    '41': { colour: 0x888800, pos: 220, note: 'D' },
    '42': { colour: 0xFF8800, pos: 220, note: 'D#' },
    '43': { colour: 0x00FF00, pos: 205, note: 'E' },
    '44': { colour: 0x88FF00, pos: 190, note: 'F' },
    '45': { colour: 0xFFFF00, pos: 190, note: 'F#' },
    '46': { colour: 0x000088, pos: 175, note: 'G' },
    '47': { colour: 0x880088, pos: 175, note: 'G#' },
    '48': { colour: 0xFF0088, pos: 160, note: 'A' },
    '49': { colour: 0x008888, pos: 160, note: 'A#' },
    '50': { colour: 0x888888, pos: 145, note: 'B' },
    '51': { colour: 0xFF8888, pos: 130, note: 'C' }, // Better C
    '52': { colour: 0x00FF88, pos: 130, note: 'C#' },
    '53': { colour: 0x88FF88, pos: 115, note: 'D' },
    '54': { colour: 0xFFFF88, pos: 115, note: 'D#' },
    '55': { colour: 0x0000FF, pos: 100, note: 'E' },
    '56': { colour: 0x8800FF, pos: 85, note: 'F' },
    '57': { colour: 0xFF00FF, pos: 85, note: 'F#' },
    '58': { colour: 0x0088FF, pos: 70, note: 'G' },
    '59': { colour: 0x8888FF, pos: 70, note: 'G#' },
    '60': { colour: 0xFF88FF, pos: 55, note: 'A' },
    '61': { colour: 0x00FFFF, pos: 55, note: 'A#' },
    '62': { colour: 0x88FFFF, pos: 40, note: 'B' }
  }

  preload () {
    this.bpm = 60
    this.boxSpeed = calculateScrollSpeed(this.bpm, BOX_SIZE)
    this.beats = 0
    this.gameState = GAME_STATE.GAME

    this.loadGameSettings()
    this.loadAudioContext()
    this.getMusicData()
    this.requestUserMedia()
  }

  loadGameSettings = () => {
    this.stage.disableVisibilityChange = true

    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    this.game.scale.pageAlignHorizontally = true
    this.game.scale.pageAlignVertically = true

    this.game.time.advancedTiming = true
  }

  loadAudioContext = () => {
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

  getMusicData = () => {
    const xmlText = this.cache.getText('musicxml')
    const xml = (new DOMParser()).parseFromString(xmlText, 'text/xml')
    const { musicData, timeSignature } = parseMusicXML(xml)
    this.musicData = musicData
    this.timeSignature = timeSignature
    console.log(this.musicData)
    console.log(this.timeSignature)
  }

  requestUserMedia = async () => {
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

  openMenu = () => {
    this.gameState = GAME_STATE.MENU

    this.timer.pause()

    this.menu = this.add.graphics(0, 0)
    this.menu.beginFill(0xFF0000)
    this.menu.lineStyle(2, 0x000000, 1)  
    this.menu.drawRect(10, 10, this.world.width - 20, this.world.height - 20)

    this.menuConfigButton = this.add.button(this.world.centerX, 50, 'configImage', '', this, 2, 5, 0)
    this.menuOptionButton = this.add.button(this.world.centerX, 90, 'dottedOptionImage', '', this, 2, 5, 0)
    this.menuDisplayButton = this.add.button(this.world.centerX, 130, 'displayImage', '', this, 2, 5, 0)

    destroy(this.pauseButton)
    this.pauseButton = this.add.button(this.world.width - 200, 10, 'pauseButton', this.closeMenu, this, 2, 5, 0)    
  }

  closeMenu = () => {
    this.gameState = GAME_STATE.RESUME_COUNTDOWN
    destroy(this.menuConfigButton)
    destroy(this.menuOptionButton)
    destroy(this.menuDisplayButton)
    destroy(this.pauseButton)
    this.pauseButton = this.add.button(this.world.width - 200, 10, 'pauseButton', this.openMenu, this, 2, 5, 0)
    this.menu.clear()

    destroy(this.resumeCountdownText)
    this.resumeCountdownText = this.add.text(this.world.centerX, this.world.centerY, 'cat', { font: '10px Arial' })
    destroy(this.resumeTimer)
    this.resumeTimer = this.time.create()
    this.resumeTimer.add(60 / this.bpm * this.timeSignature.beats * Phaser.Timer.SECOND, this.resumePlay, this)
    this.resumeTimer.start()
  }

  resumePlay = () => {
    this.gameState = GAME_STATE.GAME
    destroy(this.resumeCountdownText)
    this.timer.resume()
  }

  create () {
    this.startTimer()
    this.createBanner()
    this.createBeatText()
    this.createMusicSheet()
    this.createIncomingMusic()
    this.createDebugText()

    this.pauseButton = this.add.button(this.world.width - 200, 10, 'pauseButton', this.openMenu, this, 2, 5, 0)
  }

  startTimer = () => {
    this.timer = this.time.create(false)
    this.timer.loop(60 / this.bpm / 12 * Phaser.Timer.SECOND, this.updateSubBeat, this)
    this.timer.start()
  }

  createBanner = () => {
    const fontStyle = {
      font: '40px Bangers',
      fill: '#77BFA3',
      align: 'center'
    }
    this.banner = this.add.text(this.world.centerX, this.game.height - 80, 'Loading...', fontStyle)
    this.banner.padding.set(10, 16)
    this.banner.smoothed = false
    this.banner.anchor.setTo(0.5)
  }

  createBeatText = () => {
    const fontStyle = {
      font: '40px Bangers',
      fill: '#77BFA3',
      align: 'center'
    }
    this.beatText = this.add.text(this.world.centerX, this.game.height - 160, ' ', fontStyle)
    this.beatText.padding.set(10, 16)
    this.beatText.smoothed = false
    this.beatText.anchor.setTo(0.5)
  }

  createMusicSheet = () => {
    const createBarLines = (gfx) => {
      gfx.beginFill(0xFF0000)
      gfx.lineStyle(2, 0x000000, 1)
      for (let i = 0; i < 5; i++) {
        drawLine(gfx, 0, 100 + i * 30, this.world.width, 100 + i * 30)
      }
    }

    const createStartLine = (gfx) => {
      gfx.beginFill(0xFF0000)
      gfx.lineStyle(2, 0x000000, 1)
      drawLine(gfx, 100, 100, 100, 220)
    }

    this.barLinesGfx = this.add.graphics(0, 0)
    createBarLines(this.barLinesGfx)

    this.gfx = this.add.graphics(0, 0)

    this.startLineGfx = this.add.graphics(0, 0)
    createStartLine(this.startLineGfx)
  }

  createIncomingMusic = () => {
    const createIncomingBarLines = (gfx) => {
      gfx.lineStyle(2, 0x000234, 1)
      gfx.beginFill(0x00f754)
      const totalBeats = this.musicData.reduce((total, note) => total + note.duration, 0)
      for (let i = 0; i < totalBeats; i += 12) {
        if (i % (this.timeSignature.beats * 12) === 0) {
          drawLine(gfx, i * BOX_SIZE, 100, i * BOX_SIZE, 220)
        } else {
          drawDottedLine(gfx, i * BOX_SIZE, 100, i * BOX_SIZE, 220, 4, 4)
        }
      }
    }

    const createIncomingNotes = (gfx, noteLabels) => {
      gfx.lineStyle(2, 0x000234, 1)
      gfx.beginFill(0x00f754)
      const fontStyle = {
        font: '14px Arial',
        fill: '#000000',
        align: 'center'
      }

      let currentBeat = 0
      for (let note of this.musicData) {
        const {pitchValue, duration} = note
        if (pitchValue !== 0 && this.notesdata[pitchValue]) {
          const height = this.notesdata[pitchValue].pos
          const rect = {
            x: currentBeat * BOX_SIZE,
            y: height,
            width: duration * BOX_SIZE,
            height: 30
          }
          gfx.drawRect(rect.x, rect.y, rect.width, rect.height)

          const label = {
            x: START_POS + currentBeat * BOX_SIZE + 2,
            y: height + 2,
            text: this.notesdata[pitchValue].note,
            style: fontStyle
          }
          noteLabels.add(this.add.text(label.x, label.y, label.text, label.style))
        }
        currentBeat += note.duration
      }
    }

    this.playBox = this.add.graphics(START_POS, 0)
    this.noteLabels = this.add.group()
    createIncomingBarLines(this.playBox)
    createIncomingNotes(this.playBox, this.noteLabels)
    this.incomingNotes = this.add.group()
    this.incomingNotes.add(this.playBox)
    this.incomingNotes.add(this.noteLabels)
  }

  createDebugText = () => {
    this.debugText = this.add.text(0, 0, '', { font: '10px Arial' })
    this.debugText.padding.set(10, 16)
    this.debugText.smoothed = false
  }

  updateSubBeat = () => {
    this.beatText.text = `Beat: ${Math.floor(this.beats / 12)}`
    if (this.beats % 12 === 0) {
      playSound(this.audioCtx)
    }
    this.beats++
  }

  animateNotes = () => {
    this.incomingNotes.x -= this.boxSpeed
  }

  update () {
    if (this.gameState === GAME_STATE.RESUME_COUNTDOWN) {
      const beatCounter = Math.floor((this.bpm * this.resumeTimer.seconds / 60).toFixed(2))
      this.resumeCountdownText.text = `Countdown: ${beatCounter}...`
      return
    }

    if (this.gameState === GAME_STATE.MENU) {
      return
    }

    // Removes previous draw and redraws when needed
    this.gfx.clear()

    this.animateNotes()

    this.debugText.text = `Elapsed time: ${this.timer.seconds.toFixed(2)} FPS: ${this.time.fps}`

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
        const num = octaveNoteToValue(octave, note) + 9 // Saxaphones are transposed instruments
        if (this.notesdata[num]) {
          const data = this.notesdata[num]
          this.gfx.beginFill(data.colour, 0.65)
          this.gfx.lineStyle(2, data.colour, 1)
          this.gfx.drawRect(0, data.pos + 2, this.world.width, 26)
          this.gfx.endFill()
        }
      }
    }
  }
}
