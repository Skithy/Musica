import Phaser from 'phaser'
import firebase from '../firebase'

export default class extends Phaser.State {
  init () {
    this.downloadFile = this.downloadFile.bind(this)
  }

  preload () {
    this.downloadFile()

    this.banner = this.add.text(this.world.centerX, this.world.centerY, 'Loading...')
    this.banner.font = 'Bangers'
    this.banner.padding.set(10, 16)
    this.banner.fontSize = 40
    this.banner.fill = '#77BFA3'
    this.banner.smoothed = false
    this.banner.anchor.setTo(0.5)
  }

  render () {
    if (this.fileDownloaded) {
      this.state.start('Game')
    }
  }

  async downloadFile () {
    this.fileDownloaded = false
    const storage = firebase.storage()
    const fileRef = storage.ref('songs/the-entertainer/The Entertainer sax only.xml')
    const url = await fileRef.getDownloadURL()
    const response = await fetch(url)
    const text = await response.text()
    this.cache.addText('musicxml', null, text)
    this.fileDownloaded = true
  }
}
