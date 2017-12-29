// @flow
/* Constants and interfaces */
const NOTEVALUES = {
  'A': 0,
  'B': 2,
  'C': 3,
  'D': 5,
  'E': 7,
  'F': 8,
  'G': 10
}

export const octaveNoteToValue = (octave: number, note: number): number => {
  // Note 3 is octave 4, note 4 is suddenly octave 5?
  const uniqueOctave = octave - Math.floor((note + 9) / 12)
  return note + uniqueOctave * 12
}

interface ITimeSignature {
  beats: number,
  beatType: number
}

interface INoteData {
  pitchValue: number,
  duration: number
}

interface IMusicXML {
  musicData: Array<INoteData>,
  timeSignature: ITimeSignature
}

/* Functions */
export const parseMusicXML = (xmlDoc: XMLDocument): IMusicXML => {
  // TODO: Detection of repeats, codas, etc
  // TODO: Recognise song name, composer name etc
  const baseNode = xmlDoc.getElementsByTagName('part')[0]
  return {
    musicData: getMusicData(baseNode),
    timeSignature: getTimeSignature(baseNode)
  }
}

const getMusicData = (baseNode): Array<INoteData> => {
  // returns data of every note, shows number of 1/12 beats
  const divisions = getElementNum(baseNode, 'divisions')
  let musicData = []
  for (let node of baseNode.getElementsByTagName('note')) {
    const duration = getElementNum(node, 'duration') / divisions * 12
    const pitchValue = getPitchValue(node)
    if (hasElement(node, 'tie') && getElementAttribute(getElementNode(node, 'tie'), 'type') === 'stop') {
      musicData[musicData.length - 1].duration += duration
    } else {
      musicData.push({ pitchValue, duration })
    }
  }
  return musicData
}

const getPitchValue = (node): number => {
  if (hasElement(node, 'rest')) {
    return 0
  }
  const octave = getElementNum(node, 'octave')
  const note = getElementText(node, 'step')
  const alter = hasElement(node, 'alter')
    ? getElementNum(node, 'alter')
    : 0

  const pitch = octaveNoteToValue(octave, NOTEVALUES[note] + alter)
  return pitch
}

const getTimeSignature = (baseNode): ITimeSignature => {
  const timeSignatureNode = baseNode.getElementsByTagName('time')[0]
  return {
    beats: getElementNum(timeSignatureNode, 'beats'),
    beatType: getElementNum(timeSignatureNode, 'beat-type')
  }
}

const getElementNode = (node, element: string) => node.getElementsByTagName(element)[0]
const getElementText = (node, element: string): string => getElementNode(node, element).textContent
const getElementNum = (node, element: string): number => parseInt(getElementText(node, element))
const getElementAttribute = (node, attributeName: string) => Array.from(node.attributes).find(attribute => attribute.nodeName === attributeName).value
const hasElement = (node, element: string): boolean => node.getElementsByTagName(element).length > 0
