/* eslint-env jest */
import { frequencyData } from './pitchDetection'

// TODO: Add tests for pitchDetection(?)

describe('frequencyData', () => {
  test('gives correct frequency data', () => {
    expect(frequencyData(220)).toEqual({ note: 0, octave: 3 })
    expect(frequencyData(233)).toEqual({ note: 1, octave: 3 })
    expect(frequencyData(246)).toEqual({ note: 2, octave: 3 })
    expect(frequencyData(261)).toEqual({ note: 3, octave: 3 })
    expect(frequencyData(277)).toEqual({ note: 4, octave: 4 })
    expect(frequencyData(293)).toEqual({ note: 5, octave: 4 })
    expect(frequencyData(311)).toEqual({ note: 6, octave: 4 })
    expect(frequencyData(329)).toEqual({ note: 7, octave: 4 })
    expect(frequencyData(349)).toEqual({ note: 8, octave: 4 })
    expect(frequencyData(369)).toEqual({ note: 9, octave: 4 })
    expect(frequencyData(391)).toEqual({ note: 10, octave: 4 })
    expect(frequencyData(415)).toEqual({ note: 11, octave: 4 })
    expect(frequencyData(440)).toEqual({ note: 0, octave: 4 })
    expect(frequencyData(466)).toEqual({ note: 1, octave: 4 })
    expect(frequencyData(493)).toEqual({ note: 2, octave: 4 })
    expect(frequencyData(523)).toEqual({ note: 3, octave: 4 })
    expect(frequencyData(554)).toEqual({ note: 4, octave: 5 })
    expect(frequencyData(587)).toEqual({ note: 5, octave: 5 })
    expect(frequencyData(622)).toEqual({ note: 6, octave: 5 })
    expect(frequencyData(659)).toEqual({ note: 7, octave: 5 })
    expect(frequencyData(698)).toEqual({ note: 8, octave: 5 })
    expect(frequencyData(739)).toEqual({ note: 9, octave: 5 })
    expect(frequencyData(783)).toEqual({ note: 10, octave: 5 })
    expect(frequencyData(830)).toEqual({ note: 11, octave: 5 })

    expect(frequencyData(-1)).toEqual({ note: -1, octave: -1 })
  })

  test('edge cases', () => {
    expect(frequencyData(452)).toEqual({ note: 0, octave: 4 })
    expect(frequencyData(453)).toEqual({ note: 1, octave: 4 })
  })
})
