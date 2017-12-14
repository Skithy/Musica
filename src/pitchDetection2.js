$(
  function () {
    //$('#tuner-wave').css('box-sizing', 'border-box')
    //$('#tuner-la').spinner({ min: 220, max: 880 })
    //var p = true
    //$('#tuner-wave').click(function () { p = !p })
    //var l = document.getElementById('tuner-wave')
    //var a = l.getContext('2d')
    //var o = document.getElementById('tuner-cents')
    //var f = o.getContext('2d')
    var r
    var n
    var i = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
    /*
    function q (y) {
      var t = o.width, x = o.height;
      f.clearRect(0, 0, t, x)
      if (y > 0) {
        //$('#tuner-freq').text(y.toFixed(1) + ' Hz')
        var u = Math.log(y / $('#tuner-la').val()) / Math.LN2 * 12
        var s = u - Math.floor(u)
        if (s >= 0.5) { s -= 1 }
        var z = 12 * 4 + 9 + Math.round(u)
        var v = ~~(z / 12)
        if (z < 0) { --v } z -= 12 * v
        //$('#tuner-notename').html(i[z])
        //$('#tuner-octave').text(v)
        f.lineWidth = 3
        f.strokeStyle = '#c10'
        f.beginPath()
        var e = (0.5 + s) * t
        f.moveTo(e, 0)
        f.lineTo(e, x)
        f.stroke()
      } else {
        $('#tuner-notename').text('?')
        $('#tuner-octave').empty()
        $('#tuner-freq').empty()
      }
    } 
      
    function m (e) {
      $('#tuner-loudness div').css('width', (e * 100) + '%')
    }
      
    function h (e) {
      $('#tuner-clarity div').css('width', (e * 100) + '%')
    }
    */
    
    var c = function (x) {
      var w = new Array(x / 2)
      var s = new Array(x / 2)
      for (var e = 0; e < x / 2; e++) {
        w[e] = Math.cos(2 * Math.PI * e / x)
        s[e] = Math.sin(2 * Math.PI * e / x)
      }
        
      function v (y, z) {
        y = (y & 2863311530) >>> 1 | (y & 1431655765) << 1
        y = (y & 3435973836) >>> 2 | (y & 858993459) << 2
        y = (y & 4042322160) >>> 4 | (y & 252645135) << 4
        y = (y & 4278255360) >>> 8 | (y & 16711935) << 8
        return (y >>> 16 | y << 16) >>> (32 - z)
      }
        
      var u = Math.round(Math.log(x) / Math.LN2)
      
      var t = new Array(x)
      for (var e = 0; e < x; e++) {
        t[e] = v(e, u)
      }
        
      this.transform = function (E, z) {
        var C, B, G, A, D, y, F
        for (C = 0; C < x; C++) {
          B = t[C]
          if (B > C) {
            y = E[C]
            E[C] = E[B]
            E[B] = y
            F = z[C]
            z[C] = z[B]
            z[B] = F
          }
        }
        for (G = 2, A = 1; G <= x; A = G, G += G) {
          D = x / G
          for (C = 0; C < x; C += G) {
            for (B = C, k = 0; B < C + A; B++, k += D) {
              y = E[B + A] * w[k] + z[B + A] * s[k]
              F = -E[B + A] * s[k] + z[B + A] * w[k]
              E[B + A] = E[B] - y; z[B + A] = z[B] - F
              E[B] += y
              z[B] += F
            }
          }
        }
      }
    }
    
    function d (u, s, e, v) {
      var t = e + e - v - s
      if (!t) { return u }
      return u + (v - s) / (2 * t)
    }
      
    function b () {
      var t = r.fftSize
      var z = 2 * t
      var v = new Float32Array(z)
      var x = new Array(z)
      var e = new Array(z)
      var w = new c(z)
      var y = Date.now()
      var u = 67
      
      function s () {
        var F
        requestAnimationFrame(s)
        now = Date.now()
        if (now - y < u) { return }
        y = now
        r.getFloatTimeDomainData(v)
        var B = 0
        for (F = 0; F < z; F++) {
          x[F] = F < t ? v[F] : 0
          if (Math.abs(x[F]) > B) {
            B = Math.abs(x[F])
          }
          e[F] = 0
        }
        w.transform(x, e)
        for (F = 0; F < z; F++) {
          x[F] = (x[F] * x[F] + e[F] * e[F]) / z
          e[F] = 0
        }
        w.transform(e, x)
        var J = 2 * x[0]
        x[0] = 1
        for (F = 1; F < t; F++) {
          J -= v[F - 1] * v[F - 1] + v[t - F] * v[t - F]
          x[F] = 2 * x[F] / J
        }
        for (F = t; F < z; F++) {
          x[F] /= x[z - 1]
        }
        var C = []
        var I = 0, D = 1, K = 0
        for (F = 1; F < t - 100; F++) {
          if (x[F] > D && x[F] >= x[F + 1]) {
            I = F
            D = x[F]
            if (D > K) { K = D }
          }
          if (D > 0 && (x[F] < 0 || F == t - 101)) {
            if (I) {
              C.push(d(I, x[I - 1], D, x[I + 1]))
            }
            D = 0
          }
        }
        var G = K * 0.9
        var A = 0
        for (F = 0; F < C.length; F++) {
          if (x[Math.round(C[F])] >= G) {
            A = g.sampleRate / C[F]; break
          }
        }
        var Q = A ? x[Math.round(g.sampleRate / A)] : 0
        if (Q < 0.85) { A = 0 }
        q(A)
        h(Q)
        m(Math.max(0, 1 + 0.5 * Math.log10(B)))
        var O = l.width, H = l.height
        a.clearRect(0, 0, O, H)
        a.strokeStyle = '#555'
        a.beginPath()
        a.moveTo(0, (H + 1) / 2)
        a.lineTo(O, (H + 1) / 2)
        a.stroke()
        if (p) {
          a.strokeStyle = '#ff0'
          a.beginPath()
          var E = t
          var N = O / E
          var M = 0
          for (var F = 0; F < E; F++) {
            var P = 0.5 * (1 - v[F])
            var L = Math.round(P * H)
            if (F === 0) { a.moveTo(M, L) } else { a.lineTo(M, L) } M += N
          }
          a.stroke()
        }
      }
        
      s()
    }
      
    try {
      var g = new AudioContext()
    } catch (j) {
      $('#tuner-error').html('<strong>ERROR:</strong> Your browser does not support the Web Audio standard. Please update your browser or install a more modern browser such as <a href="http://www.google.com/chrome/">Google Chrome</a>.')
      return
    }
      
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
    if (navigator.getUserMedia) {
      navigator.getUserMedia({ audio: true },
        function (e) {
          r = g.createAnalyser()
          r.smoothingTimeConstant = 0.75
          r.fftSize = 1024
          n = g.createMediaStreamSource(e)
          window.source = n
          n.connect(r)
          b()
        },
        function (s) {
          alert('Error accessing the microphone.')
        })
    } else {
      $('#tuner-error').html('<strong>ERROR:</strong> Your browser does not support microphone input. Please update your browser or install a more modern browser such as <a href="http://www.google.com/chrome/">Google Chrome</a>')
    }
  }
)
