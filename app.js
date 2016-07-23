
var scalarfield = {};

scalarfield.Vector2 = function(x, y) {
    this.x = x, this.y = y;
};

scalarfield.Vector2.prototype.toString = function(x, y) {
    return '(' + this.x + ', ' + this.y + ')';
};

scalarfield.Vector2.prototype.getLength = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

scalarfield.Vector2.prototype.getDirection = function() {
    return Math.atan2(this.y, this.x);
};

scalarfield.Vector2.prototype.makeArrow = function(two, x, y) {
    if (this.getLength() === 0) {
        two.makeLine(x, y, x + 1, y + 1);
        return;
    }

    // TODO: Implement length as well as direction

    var main = two.makeLine(0, 0, 10, 0),
        tick = two.makeLine(10, 0, 6, -2);

    var arrow = two.makeGroup(main, tick);
    arrow.translation.set(x, y);
    arrow.rotation = this.getDirection();
};

scalarfield.VectorField2 = function(x, y) {
    this.x = x, this.y = y;
};

scalarfield.VectorField2.prototype.toString = function() {
    return '(' + this.x.text() + ', ' + this.y.text() + ')';
};

scalarfield.VectorField2.prototype.evaluateAt = function(x, y) {
    return new scalarfield.Vector2(nerdamer(this.x, {x: x, y: y}).evaluate(),
                                   nerdamer(this.y, {x: x, y: y}).evaluate());
};

scalarfield.calculateGradient = function(scalarField) {
    return new scalarfield.VectorField2(nerdamer('diff(' + scalarField + ', x)'), nerdamer('diff(' + scalarField + ', y)'));
};

scalarfield.calculateCurl = function(vectorField) {
    return nerdamer('diff(' + vectorField.y + ', x) - diff(' + vectorField.x + ', y)');
};

scalarfield.plotScalarField = function(two, field) {
    var numCells = 30,
        cellWidth = two.width / numCells,
        cellHeight = two.height / numCells;

    var v = this.generateScalarField(field, numCells, two.width, two.height);

    for (var x = 0; x < numCells; x++) {
        for (var y = 0; y < numCells; y++) {
            // TODO: Fix negative values
            var b = Math.round((v.values[x + y * numCells].text() / v.max) * 255);
            var rect = two.makeRectangle(x * cellWidth, y * cellHeight, cellWidth + 1, cellHeight + 1);

            rect.fill = 'rgb(' + b + ', ' + b + ', ' + b + ')';
            rect.noStroke();
        }
    }

    two.update();
};

/* Return indexed scalar field values in an area of width, height divided into
 * numCells in each dimension, returning values + max */
scalarfield.generateScalarField = function(field, numCells, width, height) {
    var cellWidth = width / numCells, cellHeight = height / numCells;

    var values = [], max = 0;

    for (var x = 0; x < numCells; x++) {
        for (var y = 0; y < numCells; y++) {
            var centered = {x: (x - numCells / 2) / cellWidth, y: (y - numCells / 2) / cellHeight};

            var v = nerdamer(field, centered).evaluate();
            values[x + y * numCells] = v;

            if (v > max) {
                max = v;
            }
        }
    }

    return {values: values, max: max};
};

scalarfield.plotVectorField = function(two, vectorField) {
    var numPoints = 30,
        xSpacing = two.width / numPoints,
        ySpacing = two.height / numPoints;

    for (var x = 0; x < numPoints; x++) {
        for (var y = 0; y < numPoints; y++) {
            var centered = {x: (x - numPoints / 2) / xSpacing, y: (y - numPoints / 2) / ySpacing};

            vectorField.evaluateAt(centered.x, centered.y)
                       .makeArrow(two, x * xSpacing, y * ySpacing);
        }
    }

    two.update();
};

scalarfield.plotCurlField = function(two, vectorField) {
    return scalarfield.plotScalarField(scalarfield.calculateCurl(vectorField));
};

// TODO: Move to main.js
var scalarElem = $('#scalar_plot')[0],
    vectorElem = $('#vector_plot')[0],
    twoScalar = new Two({ type: Two.Types.canvas, width: 500, height: 500 }).appendTo(scalarElem),
    twoVector = new Two({ type: Two.Types.canvas, width: 500, height: 500 }).appendTo(vectorElem);

function update() {
    var expression = $('#scalar_field').val();
    var gradientField = scalarfield.calculateGradient(nerdamer(expression));
    $('#gradient').text(gradientField.toString());

    twoScalar.clear();
    twoVector.clear();
    scalarfield.plotScalarField(twoScalar, nerdamer(expression));
    scalarfield.plotVectorField(twoVector, gradientField);
}

$('#update').click(update);
$('#scalar_field').keyup(function (e) {
    if (e.keyCode === 13) {
        update();
    }
});

update();
