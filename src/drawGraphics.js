// @flow
export const drawLine = (gfx: any, x1: number, y1: number, x2: number, y2: number): void => {
  gfx.moveTo(x1, y1)
  gfx.lineTo(x2, y2)
}

export const drawDottedLine = (gfx: any, x1: number, y1: number, x2: number, y2: number, lineLength: number, spaceLength: number): void => {
  const angle = Math.atan((y2 - y1) / (x2 - x1))
  const dx = (lineLength + spaceLength) * Math.cos(angle)
  const dy = (lineLength + spaceLength) * Math.sin(angle)

  const checkX = (x, x2) => (x1 > x2) ? x > x2 : x < x2
  const checkY = (y, y2) => (y1 > y2) ? y > y2 : y < y2

  let x, y
  for (x = x1, y = y1; checkX(x, x2) || checkY(y, y2); x += dx, y += dy) {
    drawLine(gfx, x, y, x + lineLength * Math.cos(angle), y + lineLength * Math.sin(angle))
  }
  drawLine(gfx, x, y, x2, y2)
}
