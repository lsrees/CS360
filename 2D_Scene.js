

var gl;
var color;
var matrixStack = [];
let starPulseTime = 0.0;

var mMatrix = mat4.create();
var uMMatrixLocation;

var aPositionLocation;
var uColorLoc;

var animation;

// for back and forth motion of the boat
let translationX = 0.0;
const translationSpeed = 0.003;
const translationRange = 0.7;
let direction = 1;

// for rotation of the windmill 
let rotationAngle = 0.0;
const rotationSpeed = 0.02;
let rotationAngle1 = 0.0;
const rotationSpeed1 = 0.005;


const numSegments = 100; // Number of segments for the circle
const angleIncrement = (Math.PI * 2) / numSegments;

var mode = 's';  // mode for drawing

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
    gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
    gl_PointSize = 5.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;

void main() {
    fragColor = color;
}`;

function pushMatrix(stack, m) {
    
    var copy = mat4.create(m);
    stack.push(copy);
}

function popMatrix(stack) {
    if (stack.length > 0) return stack.pop();
    else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
    shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, vertexShaderCode);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function fragmentShaderSetup(fragShaderCode) {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, fragShaderCode);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    shaderProgram = gl.createProgram();
    var vertexShader = vertexShaderSetup(vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(fragShaderCode);

   
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    
    gl.linkProgram(shaderProgram);

    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

  
    gl.useProgram(shaderProgram);

    return shaderProgram;
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2"); 
        gl.viewportWidth = canvas.width; 
        gl.viewportHeight = canvas.height; 
    } catch (e) {}
    if (!gl) {
        alert("WebGL initialization failed");
    }
}

// drawing a square
function initSquareBuffer() {
    // buffer for point locations
    const sqVertices = new Float32Array([
        0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ]);
    sqVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
    sqVertexPositionBuffer.itemSize = 2;
    sqVertexPositionBuffer.numItems = 4;

    // buffer for point indices
    const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    sqVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
    sqVertexIndexBuffer.itemsize = 1;
    sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.uniform4fv(uColorLoc, color);

    // now draw the square
    // show the solid view
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    // show the wireframe view
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    // show the point view
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }    
}

// drawing a triangle
function initTriangleBuffer() {
    // buffer for point locations
    const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    triangleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    triangleBuf.itemSize = 2;
    triangleBuf.numItems = 3;

    // buffer for point indices
    const triangleIndices = new Uint16Array([0, 1, 2]);
    triangleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
    triangleIndexBuf.itemsize = 1;
    triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the triangle
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}

// drawing a circle
function initCircleBuffer() {
    // buffer for point locations
    const positions = [0, 0]; // take the center of the circle
    
    for (let i = 0; i < numSegments; i++) {
      const angle = angleIncrement * i;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      positions.push(x, y);
    }

    const circleVertices = new Float32Array(positions);
    circleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);
    circleBuf.itemSize = 2;
    circleBuf.numItems = numSegments + 1;

    // Create index buffer
    const indices = [0, 1, numSegments];
    for (let i = 0; i < numSegments; i++) {
      indices.push(0, i, i + 1);
    }

    // buffer for point indices
    const circleIndices = new Uint16Array(indices);
    circleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circleIndices, gl.STATIC_DRAW);
    circleIndexBuf.itemsize = 1;
    circleIndexBuf.numItems = indices.length;
}

function drawCircle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the circle
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}


function initRayBuffer() {
    // buffer for point locations
    const positions = [0, 0];
    
    // taking only 8 segments
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2) * i / 8;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      positions.push(x, y);
    }
    const rayVertices = new Float32Array(positions);
    rayBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.bufferData(gl.ARRAY_BUFFER, rayVertices, gl.STATIC_DRAW);
    rayBuf.itemSize = 2;
    rayBuf.numItems = 9;

    // Create index buffer
    const indices = [];
    for (let i = 0; i < 8; i++) {
      indices.push(0, i+1);
    }

    // buffer for point indices
    const rayIndices = new Uint16Array(indices);
    rayIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rayIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rayIndices, gl.STATIC_DRAW);
    rayIndexBuf.itemsize = 1;
    rayIndexBuf.numItems = indices.length;
}

function drawRays(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.vertexAttribPointer(aPositionLocation, rayBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rayIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    if (mode === 'p') {
        gl.drawElements(gl.POINTS, rayIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    
    else {
        gl.drawElements(gl.LINE_STRIP, rayIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}


function initFanBladesBuffer() {
    // buffer for point locations
    const positions = [0, 0];
    
    // based on manual calculations
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2) * i / 16;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      positions.push(x, y);
    }
    const bladeVertices = new Float32Array(positions);
    bladeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bladeVertices, gl.STATIC_DRAW);
    bladeBuf.itemSize = 2;
    bladeBuf.numItems = 9;

    // Create index buffer
    const indices = [];
    for (let i = 1; i < 16; i=i+4) {
      indices.push(0, i, i+1);
    }

    // buffer for point indices
    const bladeIndices = new Uint16Array(indices);
    bladeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bladeIndices, gl.STATIC_DRAW);
    bladeIndexBuf.itemsize = 1;
    bladeIndexBuf.numItems = indices.length;
}

function drawFanBlades(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.vertexAttribPointer(aPositionLocation, bladeBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the circle
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLE_FAN, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}



function drawSky() {
    
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.00, 0.00, 0.00, 1];  
    
    mMatrix = mat4.translate(mMatrix, [0.0, 0.6, 0]);
   
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


function drawMoon(rotationAngle) {
   
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [1, 1, 1, 1];
    
    mMatrix = mat4.translate(mMatrix, [-0.7, 0.84, 0]);
    
    mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    
    mMatrix = mat4.translate(mMatrix, [-0.7, 0.84, 0]);
   
    mMatrix = mat4.scale(mMatrix, [0.13, 0.13, 1.0]);
   
    mMatrix = mat4.rotate(mMatrix, rotationAngle, [0, 0, 1]);
    drawRays(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// function drawCloud() {
//     // initialize the model matrix to identity matrix
//     mat4.identity(mMatrix);
//     pushMatrix(matrixStack, mMatrix);
//      color = [0.4, 0.4, 0.4, 1.0];   // dark gray
//     // local translation operation for the circle
//     mMatrix = mat4.translate(mMatrix, [-0.8, 0.55, 0]);
//     // local scale operation for the circle
//     mMatrix = mat4.scale(mMatrix, [0.25, 0.13, 1.0]);
//     drawCircle(color, mMatrix);
//     mMatrix = popMatrix(matrixStack);

//     pushMatrix(matrixStack, mMatrix);
//     // local translation operation for the circle
//     mMatrix = mat4.translate(mMatrix, [-0.55, 0.52, 0]);
//     // local scale operation for the circle
//     color = [1.0, 1.0, 1.0, 1.0];   // light gray
//     mMatrix = mat4.scale(mMatrix, [0.2, 0.09, 1.0]);
//     drawCircle(color, mMatrix);
//     mMatrix = popMatrix(matrixStack);

//     pushMatrix(matrixStack, mMatrix);
//     // local translation operation for the circle
//     mMatrix = mat4.translate(mMatrix, [-0.3, 0.52, 0]);
//     // local scale operation for the circle
//      color = [0.8, 0.8, 0.8, 1.0];   // light grey
//     mMatrix = mat4.scale(mMatrix, [0.1, 0.05, 1.0]);
//     drawCircle(color, mMatrix);
//     mMatrix = popMatrix(matrixStack);
// }
function drawCloud() {
    
    mat4.identity(mMatrix);

    // Left big ellipse 
    pushMatrix(matrixStack, mMatrix);
    color = [0.5, 0.5, 0.5, 1.0];   // medium gray
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.22, 0.12, 1.0]);  
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // Middle ellipse 
    pushMatrix(matrixStack, mMatrix);
    color = [1.0, 1.0, 1.0, 1.0];   // white
    mMatrix = mat4.translate(mMatrix, [-0.55, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.16, 0.09, 1.0]);  
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //  Right smaller ellipse 
    pushMatrix(matrixStack, mMatrix);
    color = [0.7, 0.7, 0.7, 1.0];   // light gray
    mMatrix = mat4.translate(mMatrix, [-0.35, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.10, 0.06, 1.0]);  
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}





function drawMountain(t_x1, t_y1, s_x, s_y, t_x2 = 0, t_y2 = 0, single = false) {
  
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
     color = [0.46, 0.31, 0.22, 1.0]; 
     
    
    if (single) color = [0.55, 0.42, 0.28, 1.0]; 

    mMatrix = mat4.translate(mMatrix, [t_x1, t_y1, 0]);
    mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    
    if (!single) {
        pushMatrix(matrixStack, mMatrix);
        color = [0.55, 0.42, 0.28, 1.0];   
     
        mMatrix = mat4.translate(mMatrix, [t_x2, t_y2, 0]);
        mMatrix = mat4.rotate(mMatrix, 6.5, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}

function drawGround() {
   
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    // color = [0.15, 0.61, 0, 0.7];
    color = [0.26, 0.88, 0.51, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.6, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


function drawLines(move = false, x = 0, y = 0) {
   
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [x, y, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.9, 0.9, 0.8];
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.19, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.71, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.003, 0.4, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// const WATER_STREAK     = [0.82, 0.90, 1.00, 1];   // very light blue lines

function drawRiver() {
    
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.19, 0.41, 0.95, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.17, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    
    drawLines();
    drawLines(true, 0.85, 0.1);
    drawLines(true, 1.5, -0.06);
}

function drawRoad() {
    
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    // color = [0.30, 0.40, 0, 0.9];
    color = [0.40, 0.66, 0.27, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.6, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 7.2, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [1.6, 2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawTrees(move = false, t_x = 0, t_y= 0, s_x = 0, s_y = 0) {
    
    mat4.identity(mMatrix);
    if (move) {
        
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s_x, s_y, 0]);
    }

    pushMatrix(matrixStack, mMatrix);
    // color = [0.30, 0.41, 0, 0.9];
    color = [0.00, 0.55, 0.00, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.45, 0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    // color = [0.38, 0.51, 0, 0.9];
    color = [0.35, 0.66, 0.18, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.375, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    // color = [0.45, 0.60, 0, 0.9];
    color = [0.36, 0.76, 0.26, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //stem
    pushMatrix(matrixStack, mMatrix);
    // color = [0.57, 0.36, 0.15, 1.0];
    color = [0.45, 0.27, 0.26, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.14, 0]);
    mMatrix = mat4.scale(mMatrix, [0.04, 0.33, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}




function drawBoat(translationX, sailColor = [1, 0, 0, 0.9], scale = 1.0, baseOffset = [0,0]) {
 
  mat4.identity(mMatrix);

  // Apply global placement
  mMatrix = mat4.translate(mMatrix, [translationX + baseOffset[0], baseOffset[1], 0]);
  mMatrix = mat4.scale(mMatrix, [scale, scale, 1.0]);

  // Hull (gray)
  pushMatrix(matrixStack, mMatrix);
  color = [0.83, 0.83, 0.83, 1];
  mMatrix = mat4.translate(mMatrix, [0, -0.15, 0]);
  mMatrix = mat4.scale(mMatrix, [0.18, 0.06, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  //  Left triangle 
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [-0.09, -0.15, 0]);
  mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.1, 0.06, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  // Right triangle 
  pushMatrix(matrixStack, mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.09, -0.15, 0]);
  mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.1, 0.06, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  // Mast 
  pushMatrix(matrixStack, mMatrix);
  color = [0, 0, 0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.01, 0.006, 0]);
  mMatrix = mat4.scale(mMatrix, [0.01, 0.25, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  //  Support line 
  pushMatrix(matrixStack, mMatrix);
  color = [0, 0, 0, 1.0];
  mMatrix = mat4.translate(mMatrix, [-0.03, -0.01, 0]);
  mMatrix = mat4.rotate(mMatrix, 5.9, [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.005, 0.23, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  //  Sail 
  pushMatrix(matrixStack, mMatrix);
  color = sailColor;
  mMatrix = mat4.translate(mMatrix, [0.115, 0.006, 0]);
  mMatrix = mat4.rotate(mMatrix, 4.72, [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}





function drawFan(rotationAngle, x = 0.7, y = -0.25, s = 1.0) {
    // Base transform for this fan
    mat4.identity(mMatrix);
    mMatrix = mat4.translate(mMatrix, [x, y, 0]);   // fan base

    //  Pole 
    pushMatrix(matrixStack, mMatrix);
    let pole = mat4.scale(mMatrix, [0.03 * s, 0.55 * s, 1.0]);
    drawSquare([0, 0, 0, 1.0], pole);               // black pole
    mMatrix = popMatrix(matrixStack);

    // Blades 
   
    pushMatrix(matrixStack, mMatrix);
    let blades = mat4.translate(mMatrix, [0, 0.31 * s, 0]);
    blades = mat4.scale(blades, [0.20 * s, 0.20 * s, 1.0]);
    blades = mat4.rotate(blades, rotationAngle, [0, 0, 1]);
    drawFanBlades([0.8, 0.75, 0, 1.0], blades);
    mMatrix = popMatrix(matrixStack);

    // Hub 
    
    pushMatrix(matrixStack, mMatrix);
    let hub = mat4.translate(mMatrix, [0, 0.303 * s, 0]);
    hub = mat4.scale(hub, [0.03 * s, 0.03 * s, 1.0]);
    drawCircle([0, 0, 0, 1.0], hub);
    mMatrix = popMatrix(matrixStack);
}


function drawBush(move=false, t_x=0, t_y=0, s=0) {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s, s, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    // color = [0, 0.7, 0, 0.9];
    // color= [0.05, 0.65, 0.13, 1.0]
    // 
    color=[0.11, 0.82, 0.11, 1.0]


    mMatrix = mat4.translate(mMatrix, [-1, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.075, 0.055, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    // color = [0, 0.4, 0, 0.9];
    color =[0.09, 0.40, 0.10, 1.0]

    mMatrix = mat4.translate(mMatrix, [-0.72, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.07, 0.05, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    // color = [0, 0.51, 0, 0.9]
    // color=[1,1,1,1]
    color=[0.09, 0.63, 0.09, 1.0]

    mMatrix = mat4.translate(mMatrix, [-0.86, -0.53, 0]);
    mMatrix = mat4.scale(mMatrix, [0.13, 0.09, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawHouse() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);

    // roof 
    pushMatrix(matrixStack, mMatrix);
    // color = [0.9, 0, 0, 1];
    color = [1.0, 0.27, 0.0, 1.0];
   

    mMatrix = mat4.translate(mMatrix, [-0.55, -0.3, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.75, -0.3, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.35, -0.3, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // base 
    pushMatrix(matrixStack, mMatrix);
    // color = [0.83, 0.83, 0.83, 1];
    color = [0.83,0.83,0.83,1];
    
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.525, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // windows
    pushMatrix(matrixStack, mMatrix);
    // color = [0.85, 0.7, 0, 0.9];
    // color = [0.72, 0.5, 0.05, 0.9];
     color=[0.83, 0.66, 0.0, 1.0]
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.47, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.4, -0.47, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // door of the house
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.56, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.18, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// wheels 
function drawWheel(move = false, t_x = 0) {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    if (move) {
        // applying global translation for the other wheel
        mMatrix = mat4.translate(mMatrix, [t_x, 0, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.63, -0.87, 0]);
    mMatrix = mat4.scale(mMatrix, [0.04, 0.04, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.51, 0.51, 0.51, 1];
    mMatrix = mat4.translate(mMatrix, [-0.63, -0.87, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


function drawCar() {
    const cx = -0.50;

    // Base (light blue trapezoid)
    const baseY = -0.82;
    const baseW = 0.36;
    const baseH = 0.08;
    const triW  = 0.12;

    // Dome 
    // const domeY = -0.74;
    const domeY = -0.77;  
    const domeRX = 0.15;       
    const domeRY = 0.09;

    // Window (wider, starts above trapezoid)
    const winY = baseY + baseH - 0.015;
    // const winY = baseY + baseH;
    const winW = 0.16;         // wider than before
    const winH = 0.06;

    //  Dome 
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    const darkBlue = [0.10, 0.28, 0.72, 1.0];
    mMatrix = mat4.translate(mMatrix, [cx, domeY, 0]);
    mMatrix = mat4.scale(mMatrix, [domeRX, domeRY, 1.0]);
    drawCircle(darkBlue, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //  Base 
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    const lightBlue = [0.27, 0.56, 0.90, 1.0];
    mMatrix = mat4.translate(mMatrix, [cx, baseY, 0]);
    mMatrix = mat4.scale(mMatrix, [baseW, baseH, 1.0]);
    drawSquare(lightBlue, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // right slant
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [cx + baseW / 2, baseY, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [triW, baseH, 1.0]);
    drawTriangle(lightBlue, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // left slant
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [cx - baseW / 2, baseY, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [triW, baseH, 1.0]);
    drawTriangle(lightBlue, mMatrix);
    mMatrix = popMatrix(matrixStack);

    //  Wheels
    drawWheel();
    drawWheel(true, 0.27);

    //  Window 
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    const windowGray = [0.85, 0.86, 0.88, 1.0];
    mMatrix = mat4.translate(mMatrix, [cx, winY, 0]);
    mMatrix = mat4.scale(mMatrix, [winW, winH, 1.0]);
    drawSquare(windowGray, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


// 4-triangle star 
function drawStar(x, y, armLen = 0.12, baseWidth = 0.08, col = [1,1,1,1]) {
  const dirs = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
  for (let a of dirs) {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = col;
    mMatrix = mat4.translate(mMatrix, [x, y, 0]);
    mMatrix = mat4.rotate(mMatrix, a, [0,0,1]);
    mMatrix = mat4.translate(mMatrix, [0, 0.5 * armLen, 0]); // base at center
    mMatrix = mat4.scale(mMatrix, [baseWidth, armLen, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
  }
}


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //  Draw boats 
   let boat1 = { x: 0, baseX: 0.0, baseY: 0.0, speed: 0.0009, dir: 1, range: 0.7, scale: 1.0 };
   let boat2 = { x: 0, baseX: 0.0, baseY: 0.025, speed: 0.0009, dir: 1, range: 0.8, scale: 0.6 }; //violet boat

    // stop the current loop of animation
    if (animation) {
        window.cancelAnimationFrame(animation);
    }

    function animate() {
        // Update the rotation angle
        rotationAngle += rotationSpeed;
        rotationAngle1 += rotationSpeed1;
     

        // Update translation based on direction
        translationX += translationSpeed * direction;

        // Reverse direction at translationRange
        if (Math.abs(translationX) > translationRange) {
            direction *= -1;
        }
        drawSky();

        
        drawMoon(rotationAngle1);

        drawCloud();

          // Update big boat 

        // draw the 3 mountains
        drawMountain(-0.6, 0.09, 1.2, 0.4, -0.555, 0.095);
        drawMountain(-0.076, 0.09, 1.8, 0.55, -0.014, 0.096);
        drawMountain(0.7, 0.12, 1.0, 0.3, -0.545, -0.005, true);

        drawGround();
        drawRoad();
        drawRiver();

        // draw the trees
        drawTrees(true, 0.35, 0, 0.85, 0.85)
        drawTrees();
        drawTrees(true, -0.2, 0, 0.8, 0.8)
        starPulseTime += 0.12;  // smaller = slower pulse, try 0.05–0.1
    const pulse = 0.85 + 0.15 * Math.sin(starPulseTime);

        boat1.x += boat1.speed * boat1.dir;
        if (Math.abs(boat1.x) > boat1.range) {
          boat1.dir *= -1;
        //   boat2.dir = boat1.dir; // ensure both move in same direction
        }

// Update small boat 
        boat2.x += boat2.speed * boat2.dir;
        if (Math.abs(boat2.x) > boat2.range) {
          boat2.dir *= -1;
        //   boat1.dir = boat2.dir; // keep directions consistent
        }

//  Draw boats 
// Front boat (red sail)
      

// Back tiny boat (violet sail, farther back)
        drawBoat(boat2.x + boat2.baseX, [0.56, 0.0, 1.0, 0.9], boat2.scale, [0, boat2.baseY]);

        drawBoat(boat1.x + boat1.baseX, [1, 0, 0, 1.0], boat1.scale, [0, boat1.baseY]);


     
   
     drawStar( 0.32, 0.79, 0.04  * pulse, 0.015 * pulse, [1,    1,    1,    1]);
     drawStar( 0.50, 0.96, 0.03  * pulse, 0.012 * pulse, [0.95, 0.95, 1,    1]);
     drawStar(-0.30, 0.76, 0.035 * pulse, 0.014 * pulse, [1,    1,    1,    1]);// 3rd star
     drawStar(-0.12, 0.65, 0.025 * pulse, 0.010 * pulse, [0.98, 0.98, 1,    1]);// 2nd star
    //  drawStar(-0.20, 0.60, 0.020 * pulse, 0.008 * pulse, [1,    1,    1,    1]); //1st star
     drawStar(-0.17, 0.55, 0.020 * pulse, 0.008 * pulse, [1,    1,    1,    1]); //1st star
   
    



        drawFan(-rotationAngle, 0.70, -0.25, 1.0);

     // Second fan (smaller, to the left and back towards the sea)
     drawFan(-rotationAngle, 0.55, -0.15, 0.75);





        // draw the bushes
        drawBush();
        drawBush(true, 0.8, 0, 1.02);
        drawBush(true, 1.48, -0.13, 1.6);
        drawBush(true, 2.15, 0.25, 1.3);

        drawHouse();
        drawCar();

        // Request the next animation frame
        animation = window.requestAnimationFrame(animate);
    }
    animate();
}

// This is the entry point from the html
function webGLStart() {
    var canvas = document.getElementById("scenery");
    initGL(canvas);
    shaderProgram = initShaders();

    //get locations of attributes declared in the vertex shader
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");

    //enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);

    uColorLoc = gl.getUniformLocation(shaderProgram, "color");

    initSquareBuffer();
    initTriangleBuffer();
    initCircleBuffer();
    initRayBuffer();
    initFanBladesBuffer();

    drawScene();
}

function changeView(m) {
    mode = m;
    drawScene();
}