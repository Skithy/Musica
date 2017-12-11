import * as firebase from 'firebase'
const config = {
  apiKey: 'AIzaSyBb6_dXC2z-Eu3MrR6ZJxU0zxTl7V6YQBE',
  authDomain: 'musica-game.firebaseapp.com',
  databaseURL: 'https://musica-game.firebaseio.com',
  projectId: 'musica-game',
  storageBucket: 'musica-game.appspot.com',
  messagingSenderId: '153099256577'
}
firebase.initializeApp(config)
export default firebase
