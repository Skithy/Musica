// @flow
/* Constants and interfaces */
const GOOD_ENOUGH_CORRELATION = 0.9

interface IFrequencyData {
  octave: number,
  note: number,
  frequency: number
}

/* Functions */
export const autoCorrelateAudioData = (buffer: Array, sampleRate: number): number => {
  const MAX_SAMPLES = Math.floor(buffer.length / 2)
  let bestOffset = -1
  let bestCorrelation = 0
  let foundGoodCorrelation = false
  let correlations = new Array(MAX_SAMPLES)

  // Get RMS of buffer
  let rms = buffer.reduce((total, num) => total + Math.pow(num, 2))
  rms = Math.sqrt(rms / buffer.length)
  if (rms < 0.01) {
    return -1
  }

  let lastCorrelation = 1
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset])
    }

    correlation = 1 - (correlation / MAX_SAMPLES)
    correlations[offset] = correlation // store it, for the tweaking we need to do below.
    if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestOffset = offset
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
      // (anti-aliased) offset.

      // we know best_offset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      let shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset]
      return sampleRate / (bestOffset + (8 * shift))
    }
    lastCorrelation = correlation
  }
  if (bestCorrelation > 0.01) {
    // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate / bestOffset
  }
  return -1
}

export const frequencyData = (frequency: number): IFrequencyData => {
  let octave, note
  if (frequency === -1) {
    octave = -1
    note = -1
  } else {
    // Convert the most active frequency to linear, based on A440.
    let dominantFrequency = Math.log2(frequency / 440)

    // Figure out how many semitones that equates to.
    let semitonesFromA4 = 12 * dominantFrequency

    // The octave is A440 for 4, so start there, then adjust by the
    // number of semitones. Since we're at A, we need only 3 more to
    // push us up to octave 5, and 9 to drop us to 3. So there's the magic
    // 9 in that line below accounted for.
    octave = 4 + ((9 + semitonesFromA4) / 12)
    octave = Math.floor(octave)

    // The note is 0 for A, all the way to 11 for G#.
    note = (12 + (Math.round(semitonesFromA4) % 12)) % 12
  }

  return {
    octave,
    note,
    frequency
  }
}
