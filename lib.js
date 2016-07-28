var sf = {};

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

  /* If you want the arrow to depend on length you need to pass an object as the
   * fourth parameter of the form:
   * { length: true, minLength, maxLength, maxFieldLength } */
  scalarfield.Vector2.prototype.makeArrow = function (two, x, y, params) {
    if (this.getLength() === 0) {
      two.makeLine(x, y, x + 1, y + 1)
      return
    }

    var main
    var tick

    if (params !== undefined && params.length) {
      // var averageLength = (params.maxLength + params.minLength) / 2;
      var scaledLength = (this.getLength() / params.maxFieldLength) * params.maxLength
      var length = clamp(scaledLength, params.minLength, params.maxLength)

      main = two.makeLine(0, 0, length, 0)
      tick = two.makeLine(length, 0, length - 4, -2)
    } else {
      main = two.makeLine(0, 0, 10, 0)
      tick = two.makeLine(10, 0, 6, -2)
    }

    var arrow = two.makeGroup(main, tick)
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
    return new scalarfield.Vector2(nerdamer(this.x, { x: x, y: y }).evaluate(),
      nerdamer(this.y, { x: x, y: y }).evaluate())
  }

  scalarfield.calculateGradient = function (scalarField) {
    return new scalarfield.VectorField2(nerdamer('diff(' + scalarField + ', x)'), nerdamer('diff(' + scalarField + ', y)'))
  }

  scalarfield.calculateCurl = function (vectorField) {
    return nerdamer('diff(' + vectorField.y + ', x) - diff(' + vectorField.x + ', y)')
  }

  scalarfield.plotScalarField = function (two, field) {
    var numCells = 30
    var cellWidth = two.width / numCells
    var cellHeight = two.height / numCells

    var v = this.generateScalarField(field, numCells, two.width, two.height)

    for (var x = 0; x < numCells; x++) {
      for (var y = 0; y < numCells; y++) {
        // Abs away negative values
        var b = Math.abs(Math.round((v.values[x + (y * numCells)].text() / v.max) * 255))
        var rect = two.makeRectangle(x * cellWidth, y * cellHeight, cellWidth + 1, cellHeight + 1)

        rect.fill = 'rgb(' + b + ', ' + b + ', ' + b + ')'
        rect.noStroke()
      }
    }

    two.update()
  }

  /* Return indexed scalar field values in an area of width, height divided into
   * numCells in each dimension, returning values + max */
  scalarfield.generateScalarField = function (field, numCells, width, height) {
    var cellWidth = width / numCells
    var cellHeight = height / numCells

    var values = []
    var max = 0

    for (var x = 0; x < numCells; x++) {
      for (var y = 0; y < numCells; y++) {
        var centered = {
          x: (x - (numCells / 2)) / cellWidth,
          y: (y - (numCells / 2)) / cellHeight
        }

        var v = nerdamer(field, centered).evaluate()
        values[x + (y * numCells)] = v

        if (v > max) {
          max = v
        }
      }
    }

    return {
      values: values,
      max: max
    }
  }

  scalarfield.plotVectorField = function (two, vectorField, variableLength) {
    var numPoints = 30
    var xSpacing = two.width / numPoints
    var ySpacing = two.height / numPoints

    // Get max vector length and values
    var values = []
    var maxFieldLength = 0

    for (var x = 0; x < numPoints; x++) {
      for (var y = 0; y < numPoints; y++) {
        var centered = {
          x: (x - (numPoints / 2)) / xSpacing,
          y: (y - (numPoints / 2)) / ySpacing
        }

        var vector = vectorField.evaluateAt(centered.x, centered.y)
        values[x + y * numPoints] = vector

        if (variableLength) {
          var length = vector.getLength()
          if (length > maxFieldLength) {
            maxFieldLength = length
          }
        }
      }
    }

    // Render arrows
    for (x = 0; x < numPoints; x++) {
      for (y = 0; y < numPoints; y++) {
        if (variableLength) {
          var params = { length: true, minLength: 6, maxLength: 10, maxFieldLength: maxFieldLength }
        }

        values[x + y * numPoints].makeArrow(two, x * xSpacing, y * ySpacing, params)
      }
    }

    two.update()
  }

  scalarfield.plotCurlField = function (two, vectorField) {
    return scalarfield.plotScalarField(scalarfield.calculateCurl(vectorField))
  }

  scalarfield.runApp = function () {
    var scalarElem = $('#scalar_plot')[0]
    var vectorElem = $('#vector_plot')[0]
    var twoScalar = new Two({
      type: Two.Types.canvas,
      width: 500,
      height: 500
    }).appendTo(scalarElem)
    var twoVector = new Two({
      type: Two.Types.canvas,
      width: 500,
      height: 500
    }).appendTo(vectorElem)

    function update () {
      var expression = $('#scalar_field').val()
      var gradientField = scalarfield.calculateGradient(nerdamer(expression))
      $('#gradient').text(gradientField.toString())

      twoScalar.clear()
      twoVector.clear()
      scalarfield.plotScalarField(twoScalar, nerdamer(expression))
      scalarfield.plotVectorField(twoVector, gradientField, false)
    }

    $('#update').click(update)
    $('#scalar_field').keyup(function (e) {
      if (e.keyCode === 13) {
        update()
      }
    })

    update()
  }

  // Helper functions
  function clamp (x, min, max) {
    if (x < min) {
      return min
    } else if (x > min && x < max) {
      return x
    } else if (x > max) {
      return max
    }
  }
})(sf)
