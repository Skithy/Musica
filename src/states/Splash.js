import Phaser from 'phaser'
import firebase from '../firebase'

export default class extends Phaser.State {
  init () {
    this.fileDownloaded = false
  }

  preload () {
    // this.downloadFile()
    this.loadFileFromAssets()

    const fontStyle = {
      font: '40px Bangers',
      fill: '#77BFA3',
      align: 'center'
    }
    this.banner = this.add.text(this.world.centerX, this.world.centerY, 'Loading...', fontStyle)
    this.banner.padding.set(10, 16)
    this.banner.anchor.setTo(0.5, 0.5)
    this.banner.smoothed = false
  }

  render () {
    if (this.fileDownloaded) {
      this.state.start('Game')
    }
  }

  loadFileFromAssets = () => {
    this.load.text('musicxml', 'assets/musicxml/The Entertainer sax only.xml')
    this.fileDownloaded = true
  }

  downloadFile = async () => {
    const storage = firebase.storage()
    const fileRef = storage.ref('songs/the-entertainer/The Entertainer sax only.xml')
    const url = await fileRef.getDownloadURL()
    const response = await fetch(url)
    const text = await response.text()
    this.cache.addText('musicxml', null, text)
    this.fileDownloaded = true
  }
}
