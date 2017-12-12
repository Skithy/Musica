import Phaser from 'phaser'
import { autoCorrelateAudioData, frequencyData } from '../pitchDetection'
import { parseMusicXML } from '../musicXMLParser'

const FFTSize = 2048
const MIC_STATUS = {
	REQUESTED: 0,
	ALLOWED: 1,
	DENIED: 2
}
const OFFScreen = 40
const HITSize = 4
const HITZone = 100

// Test data
var notes = [36, 37, 36, 37]

export default class extends Phaser.State {
	// init -> preload -> create -> render loop
	init () {
		this.getMusicData = this.getMusicData.bind(this)
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

		this.notesdata = {
			26: { colour: 0x880000, pos: 250, note: 'B' },
			27: { colour: 0xFF0000, pos: 235, note: 'C' }, // Middle C
			28: { colour: 0x008800, pos: 235, note: 'C#' },
			29: { colour: 0x888800, pos: 220, note: 'D' },
			30: { colour: 0xFF8800, pos: 220, note: 'D#' },
			31: { colour: 0x00FF00, pos: 205, note: 'E' },
			32: { colour: 0x88FF00, pos: 190, note: 'F' },
			33: { colour: 0xFFFF00, pos: 190, note: 'F#' },
			34: { colour: 0x000088, pos: 175, note: 'G' },
			35: { colour: 0x880088, pos: 175, note: 'G#' },
			36: { colour: 0xFF0088, pos: 160, note: 'A' },
			37: { colour: 0x008888, pos: 160, note: 'A#' },
			38: { colour: 0x888888, pos: 145, note: 'B' },
			39: { colour: 0xFF8888, pos: 130, note: 'C' }, // Better C
			40: { colour: 0x00FF88, pos: 130, note: 'C#' },
			41: { colour: 0x88FF88, pos: 115, note: 'D' },
			42: { colour: 0xFFFF88, pos: 115, note: 'D#' },
			43: { colour: 0x0000FF, pos: 100, note: 'E' },
			44: { colour: 0x8800FF, pos: 85, note: 'F' },
			45: { colour: 0xFF00FF, pos: 85, note: 'F#' },
			46: { colour: 0x0088FF, pos: 70, note: 'G' },
			47: { colour: 0x8888FF, pos: 70, note: 'G#' },
			48: { colour: 0xFF88FF, pos: 55, note: 'A' },
			49: { colour: 0x00FFFF, pos: 55, note: 'A#' },
			50: { colour: 0x88FFFF, pos: 40, note: 'B' }
		}

		// Set timer
		//this.time.create(false)
		//this.timeCounter = 0

	}

	create () {
		this.getMusicData()
		this.requestUserMedia()

		this.banner = this.add.text(this.world.centerX, this.game.height - 80, 'Loading...')
		this.banner.font = 'Bangers'
		this.banner.padding.set(10, 16)
		this.banner.fontSize = 40
		this.banner.fill = '#77BFA3'
		this.banner.smoothed = false
		this.banner.anchor.setTo(0.5)

		// Drawing stuff with canvas
		this.staticgfx = this.add.graphics(0, 0)
		this.staticgfx.beginFill(0xFF0000)
		this.staticgfx.lineStyle(2, 0x000000, 1)
		this.gfx = this.add.graphics(0, 0)
		this.staticgfx2 = this.add.graphics(0, 0)
		this.staticgfx2.beginFill(0xFF0000)
		this.staticgfx2.lineStyle(2, 0x000000, 1)

		for (let i = 0; i < 5; i++) {
			this.staticgfx.moveTo(0, 100 + i * 30)
			this.staticgfx.lineTo(this.world.width, 100 + i * 30)
		}
		this.staticgfx2.moveTo(100, 100)
		this.staticgfx2.lineTo(100, 220)

		// Set time to iterate every 1/16th second (each beat)
		//this.time.loop(1000/16, this.timeCounter++, this)
		//this.time.start

		// set box in static location
		this.testBox = game.add.graphics(this.world.width + OFFScreen,115)
		this.testBox.beginFill(0x00ffff)
		this.testBox.lineStyle(10, 0x000234, 1)
		this.testBox.drawRect(10, 10, 10, 10)	

		// Box appears when timing is correct 
		this.hitBox = game.add.graphics(100, 0)

		// Incoming notes
		this.playBox = game.add.graphics(100, 0)
		
		// Metronome circle showing beats
		this.metroCircle = game.add.graphics(0,0)
		this.metroCircle.beginFill(0x000000)
		this.metroCircle.lineStyle(1, 0x000000, 1)
		this.metroCircle.drawCircle(50, 50, 20)

		//this.timerText = this.add.text(0,0, this.time)

	}

	getMusicData () {
		const xmlText = this.cache.getText('musicxml')
		const xml = (new DOMParser()).parseFromString(xmlText, 'text/xml')
		const musicData = parseMusicXML(xml)
		console.log(musicData)
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

/*
	// Converts array of numbers representing notesdata into position values
	arrayConvert (songArr, currTime) {
		var note = songArr[currTime]
		var dict = this.notesdata[note]
		return dict.pos
	}
*/

	// Iterates through one beat
//	beatIterate () {
//		this.timeCounter ++
//	} 


	render () {
		this.gfx.clear()
		// Removes previous draw and redraws when needed
		this.hitBox.clear()
		this.hitBox.beginFill(0xffe500)
		this.hitBox.lineStyle(10, 0xfffb42, 1)

		this.testBox.x -= 11

		// Resets moving box to right of screen (TESTING PURPOSES)
		if (this.testBox.x < -OFFScreen) {
			this.testBox.x = this.world.width + OFFScreen
		}

		// Detects when moving box moves pass detection line
		if (this.testBox.x < 100 && this.testBox.x > 0) {
			this.hitBox.drawRect(0, this.testBox.y + 5 - HITSize, 
								 HITSize,
								 this.testBox.height + 5 + HITSize )	
			this.hitBox.endFill()
		}
		
		// Display time
		//this.debug.text('Time now: ' + this.time.totalElapsedSeconds(), 32, 32)

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
				this.banner.text = 'Frequency: N/A	-	Octave: N/A	-	Note: N/A'
			} else {
				// Note detected
				this.banner.text = `Frequency: ${frequency}	-	Octave: ${octave}	-	Note: ${note}`
				
				// Draw rect
				const num = note + 12 * octave
				if (num >= 26 && num <= 50) {
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
