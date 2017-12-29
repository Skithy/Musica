/* eslint-env jest */
import { parseMusicXML, octaveNoteToValue } from './musicXMLParser'

describe('octaveNoteToValue', () => {
  test('converts to value properly', () => {
    expect(octaveNoteToValue(4, 0)).toBe(48)
    expect(octaveNoteToValue(4, 1)).toBe(49)
    expect(octaveNoteToValue(4, 2)).toBe(50)
    expect(octaveNoteToValue(5, 3)).toBe(51)
    expect(octaveNoteToValue(5, 4)).toBe(52)
    expect(octaveNoteToValue(5, 5)).toBe(53)
    expect(octaveNoteToValue(4, -1)).toBe(47)
    expect(octaveNoteToValue(5, -1)).toBe(59)
  })
})

describe('parseMusicXML', () => {
  test('parses musicxml correctly', () => {
    const xml = (new DOMParser()).parseFromString(testXML, 'text/xml')
    const { musicData, timeSignature } = parseMusicXML(xml)
    const expectedMusicData = [
      { pitchValue: 0, duration: 6 },
      { pitchValue: 48, duration: 6 },
      { pitchValue: 47, duration: 6 },
      { pitchValue: 54, duration: 18 }
    ]
    const expectedTimeSignature = {
      beats: 4,
      beatType: 4
    }
    expect(musicData).toEqual(expectedMusicData)
    expect(timeSignature).toEqual(expectedTimeSignature)
  })
})

const testXML = `
<score-partwise version="3.0">
  <work>
    <work-title>Testiest Title</work-title>
  </work>
  <identification>
    <creator type="composer">Composer McComposerface</creator>
  </identification>
  <part id="P1">
    <!--============== Test: Getting divisions + rests ==============-->
    <measure number="1">
      <attributes>
        <divisions>512</divisions>
        <key>
          <fifths>0</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
      </attributes>
      
      <note>
        <rest />
        <duration>128</duration>
      </note>
      <note>
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>128</duration>
      </note>
      <note>
        <pitch>
          <step>A</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>128</duration>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <alter>1</alter>
          <octave>5</octave>
        </pitch>
        <duration>128</duration>
        <tie type="start" />
      </note>
    </measure>
     <!--============== Test: Tied notes ==============-->
    <measure number="2">
      <note>
        <pitch>
          <step>D</step>
          <alter>1</alter>
          <octave>5</octave>
        </pitch>
        <duration>512</duration>
        <tie type="stop" />
      </note>
    </measure>
  </part>
</score-partwise>
`
