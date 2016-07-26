const sf = {};

(function SF (scalarfield) {
  'use strict'

  scalarfield.Vector2 = function (x, y) {
    this.x = x
    this.y = y
  }

  scalarfield.Vector2.prototype.toString = function () {
    return '(' + this.x + ', ' + this.y + ')'
  }

  scalarfield.Vector2.prototype.getLength = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
  }

  scalarfield.Vector2.prototype.getDirection = function () {
    return Math.atan2(this.y, this.x)
  }

  scalarfield.Vector2.prototype.makeArrow = function (two, x, y) {
    if (this.getLength() === 0) {
      two.makeLine(x, y, x + 1, y + 1)
      return
    }

    // TODO: Implement length as well as direction

    const main = two.makeLine(0, 0, 10, 0)
    const tick = two.makeLine(10, 0, 6, -2)

    const arrow = two.makeGroup(main, tick)
    arrow.translation.set(x, y)
    arrow.rotation = this.getDirection()
  }

  scalarfield.VectorField2 = function (x, y) {
    this.x = x
    this.y = y
  }

  scalarfield.VectorField2.prototype.toString = function () {
    return '(' + this.x.text() + ', ' + this.y.text() + ')'
  }

  scalarfield.VectorField2.prototype.evaluateAt = function (x, y) {
    return new scalarfield.Vector2(nerdamer(this.x, { x, y }).evaluate(),
      nerdamer(this.y, { x, y }).evaluate())
  }

  scalarfield.calculateGradient = function (scalarField) {
    return new scalarfield.VectorField2(nerdamer('diff(' + scalarField + ', x)'), nerdamer('diff(' + scalarField + ', y)'))
  }

  scalarfield.calculateCurl = function (vectorField) {
    return nerdamer('diff(' + vectorField.y + ', x) - diff(' + vectorField.x + ', y)')
  }

  scalarfield.plotScalarField = function (two, field) {
    const numCells = 30
    const cellWidth = two.width / numCells
    const cellHeight = two.height / numCells

    const v = this.generateScalarField(field, numCells, two.width, two.height)

    for (let x = 0; x < numCells; x++) {
      for (let y = 0; y < numCells; y++) {
        // Abs away negative values
        const b = Math.abs(Math.round((v.values[x + (y * numCells)].text() / v.max) * 255))
        const rect = two.makeRectangle(x * cellWidth, y * cellHeight, cellWidth + 1, cellHeight + 1)

        rect.fill = 'rgb(' + b + ', ' + b + ', ' + b + ')'
        rect.noStroke()
      }
    }

    two.update()
  }

  /* Return indexed scalar field values in an area of width, height divided into
   * numCells in each dimension, returning values + max */
  scalarfield.generateScalarField = function (field, numCells, width, height) {
    const cellWidth = width / numCells
    const cellHeight = height / numCells

    const values = []
    let max = 0

    for (let x = 0; x < numCells; x++) {
      for (let y = 0; y < numCells; y++) {
        const centered = {
          x: (x - (numCells / 2)) / cellWidth,
          y: (y - (numCells / 2)) / cellHeight
        }

        const v = nerdamer(field, centered).evaluate()
        values[x + (y * numCells)] = v

        if (v > max) {
          max = v
        }
      }
    }

    return {
      values,
      max
    }
  }

  scalarfield.plotVectorField = function (two, vectorField) {
    const numPoints = 30
    const xSpacing = two.width / numPoints
    const ySpacing = two.height / numPoints

    for (let x = 0; x < numPoints; x++) {
      for (let y = 0; y < numPoints; y++) {
        const centered = {
          x: (x - (numPoints / 2)) / xSpacing,
          y: (y - (numPoints / 2)) / ySpacing
        }

        vectorField.evaluateAt(centered.x, centered.y)
          .makeArrow(two, x * xSpacing, y * ySpacing)
      }
    }

    two.update()
  }

  scalarfield.plotCurlField = function (two, vectorField) {
    return scalarfield.plotScalarField(scalarfield.calculateCurl(vectorField))
  }

  scalarfield.runApp = function () {
    const scalarElem = $('#scalar_plot')[0]
    const vectorElem = $('#vector_plot')[0]
    const twoScalar = new Two({
      type: Two.Types.canvas,
      width: 500,
      height: 500
    }).appendTo(scalarElem)
    const twoVector = new Two({
      type: Two.Types.canvas,
      width: 500,
      height: 500
    }).appendTo(vectorElem)

    function update () {
      const expression = $('#scalar_field').val()
      const gradientField = scalarfield.calculateGradient(nerdamer(expression))
      $('#gradient').text(gradientField.toString())

      twoScalar.clear()
      twoVector.clear()
      scalarfield.plotScalarField(twoScalar, nerdamer(expression))
      scalarfield.plotVectorField(twoVector, gradientField)
    }

    $('#update').click(update)
    $('#scalar_field').keyup(function (e) {
      if (e.keyCode === 13) {
        update()
      }
    })

    update()
  }
})(sf)
