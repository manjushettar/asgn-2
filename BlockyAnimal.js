var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
     gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
     gl_FragColor = u_FragColor;
    }`


// globals
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_size;
function setupWebGL() {
    canvas = document.getElementById('webgl');

    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL(){
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        // ...
        console.log('Failed to initialize shaders.');
        return;
    }
    
    // Get the storage location of a_Position variable
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0){
        // ...
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    // Get the storage location of u_FragColor variable
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if(!u_FragColor){
        // ...
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2; 
const STAR = 3;
const HEART = 4;

let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_segment = 10;
let g_selectedType = POINT;
let draw = false;

let g_globalAngle = 0;
let g_leftArmAngle = 10;
let g_rightArmAngle = -10;
let g_leftLegAngle = 160;
let g_rightLegAngle = -160;
let g_tailAngle = 100;
let g_leftEarAngle = 100;

let g_animation = false;
let g_poke = false;
let g_rotateX = 0;
let g_rotateY = 0;

function addActionsForHTMLUI(){
    document.getElementById('angleSlide').addEventListener('mousemove', function(){g_globalAngle = this.value; renderAllShapes();});

    document.getElementById('lArm').addEventListener('mousemove', function(){g_leftArmAngle = this.value; renderAllShapes();});
    document.getElementById('rArm').addEventListener('mousemove', function(){g_rightArmAngle = this.value; renderAllShapes();});
    document.getElementById('lLeg').addEventListener('mousemove', function(){g_leftLegAngle = this.value; renderAllShapes();});
    document.getElementById('rLeg').addEventListener('mousemove', function(){g_rightLegAngle = this.value; renderAllShapes();});
    document.getElementById('tail').addEventListener('mousemove', function(){g_tailAngle = this.value; renderAllShapes();});

    document.getElementById('animOn').onclick = function() {g_animation=true};
    document.getElementById('animOff').onclick = function() {g_animation=false};



    document.getElementById('poke').addEventListener('click', function(){g_poke = !g_poke; renderAllShapes();});
}


function main() {
    // ...
    // Initialize shaders
    setupWebGL() 
    
    connectVariablestoGLSL()

    addActionsForHTMLUI()
    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) }};
    //canvas.onmousemove

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    // ...
    requestAnimationFrame(tick)
}

var g_shapesList = [];
var g_startAnim = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startAnim;
function tick(){
    g_seconds=performance.now()/1000.0-g_startAnim;

    updateAnimationAngles();
    //console.log("Animation done")
    renderScene();
    //console.log("Render done")
    requestAnimationFrame(tick);
}

function updateAnimationAngles(){
    if(g_animation){
        g_leftLegAngle = -(20*Math.sin(g_seconds));
        g_rightLegAngle = 20*Math.sin(g_seconds);
    }
    if(g_poke){

    }
}


function click(ev) {
    let [x,y] = convertCoordinatesEventToGL(ev)

    let point;
    if(g_selectedType == POINT){
        point = new Point();
    }
    else if(g_selectedType == TRIANGLE){
        point = new Triangle();
    }
    else if(g_selectedType == CIRCLE){
        point = new Circle();
    }
    else if(g_selectedType == STAR){
        point = new Star();
    }
    else if(g_selectedType == HEART){
        point = new Heart();
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point)

}

function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

   return ([x,y])
}

function renderScene(){
    var startTime = performance.now()
    // Clear <canvas>

    var globalRotMatrix = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    globalRotMatrix.rotate(g_rotateX,0,1,0);
    globalRotMatrix.rotate(g_rotateY,1,0,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //drawTriangle3D([-1.0, 0.0, 0.0,  -0.5, -1.0, 0.0,  0.0, 0.0, 0.0]);
    // (239, 207, 227);, 1
    var head = new Matrix4();
    head.translate(-0.125,0.2,-0.05);
    head.scale(0.35,0.3,0.2);
    drawCube(head, [0.937,0.811,0.890,1.0]);
  
    
  
    var leftEye = new Matrix4();
    leftEye.translate(-0.08,0.3,-0.125);
    leftEye.scale(0.075,0.075,0.2);
    drawCube(leftEye, [135/255, 206/255, 250/255,1.0]);
  
    var rightEye = new Matrix4();
    rightEye.translate(0.11,0.3,-0.125);
    rightEye.scale(0.075,0.075,0.2);
    drawCube(rightEye, [135/255, 206/255, 250/255,1.0]);

    var left_eyebrow = new Matrix4();
    left_eyebrow.translate(-0.05,0.4,-0.125);
    left_eyebrow.rotate(-25,0,0,1);
    left_eyebrow.scale(0.07,0.015,0.2);
    drawCube(left_eyebrow, [119/255, 136/255, 153/255,1.0]);

    var right_eyebrow = new Matrix4();
    right_eyebrow.translate(0.09,0.373,-0.125);
    right_eyebrow.rotate(25,0,0,1);
    right_eyebrow.scale(0.07,0.015,0.2);
    drawCube(right_eyebrow, [119/255, 136/255, 153/255,1.0]);

    var neck = new Matrix4();
    neck.translate(-0.025,0.07,-0.05);
    neck.scale(0.15,0.13,0.2);
    drawCube(neck, [0.8496, 0.7488, 0.812, 1.0]);


    var body = new Matrix4();
    body.translate(-0.133,-0.24,-0.05);
    body.scale(0.37,0.35,0.2);
    drawCube(body, [0.8496, 0.7488, 0.812, 1.0]);

    var leftArm = new Matrix4();
    leftArm.translate(-0.1,-0.15,-0.125);
    leftArm.rotate(10,0,0,1)
    leftArm.scale(0.08,0.15,0.2);
    drawCube(leftArm, [0.937,0.811,0.890,1.0]);

    var rightArm = new Matrix4();
    rightArm.translate(0.12,-0.14,-0.125);
    rightArm.rotate(-10,0,0,1)
    rightArm.scale(0.08,0.15,0.2);
    drawCube(rightArm, [0.937,0.811,0.890,1.0]);



    var leftFoot = new Matrix4();
    leftFoot.translate(-0.05,-0.28,0.055);
    leftFoot.rotate(160,g_leftLegAngle,0,1)
    leftFoot.scale(0.15,0.15,0.2);
    drawCone(leftFoot, [0.937,0.811,0.890,1.0]);

    var rightFoot = new Matrix4();
    rightFoot.translate(0.15,-0.28,0.055);
    rightFoot.rotate(-160,g_rightLegAngle,0,1)
    rightFoot.scale(0.15,0.15,0.2);
    drawCone(rightFoot, [0.937,0.811,0.890,1.0]);


    var leftEar = new Matrix4();
    leftEar.translate(-0.15,0.4,-0.05);
    leftEar.rotate(30,0,0,1)
    leftEar.scale(0.1,0.1,0.2);
    drawCube(leftEar, [0.937,0.811,0.890,1.0]);

    var rightEar = new Matrix4();
    rightEar.translate(0.16,0.45,-0.05);
    rightEar.rotate(-30,0,0,1)
    rightEar.scale(0.1,0.1,0.2);
    drawCube(rightEar, [0.937,0.811,0.890,1.0]);

    var tail = new Matrix4();
    tail.translate(0.15,-0.15,0.14);
    tail.rotate(g_tailAngle,0,0,1)
    tail.scale(0.1,0.1,0.2);
    drawCube(tail, [0.937,0.811,0.890,1.0]);

    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps " + Math.floor(1000/duration), "numdot");

}

function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
      console.log("Failed to get " + htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text;
}

function drawCube(m, color){
    var rgba = color;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, m.elements);
    //front
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0]);
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    //right
    drawTriangle3D([0,1,1,0,0,1,0,0,0]);
    drawTriangle3D([0,1,1,0,0,0,0,1,0]);
    gl.uniform4f(u_FragColor, rgba[0]*0.85, rgba[1]*0.85, rgba[2]*0.85, rgba[3]);
    //back
    drawTriangle3D([0,1,1,1,1,1,1,0,1]);
    drawTriangle3D([0,1,1,1,0,1,0,0,1]);
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    //left
    drawTriangle3D([1,1,1,1,1,0,1,0,0]);
    drawTriangle3D([1,1,1,1,0,0,1,0,1]);
    gl.uniform4f(u_FragColor, rgba[0]*0.75, rgba[1]*0.75, rgba[2]*0.75, rgba[3]);
    //bottom
    drawTriangle3D([0,0,1,1,0,1,1,0,0]);
    drawTriangle3D([0,0,1,1,0,0,0,0,0]);
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    //top
    drawTriangle3D([1,1,1,0,1,1,0,1,0]);
    drawTriangle3D([1,1,1,0,1,0,1,1,0]);
}

function drawCone(m, color){
    var rgba = color;
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);

  gl.uniformMatrix4fv(u_ModelMatrix, false, m.elements);

  var n = 16; // Number of segments
  var radius = 0.5; // Radius of the base
  var height = 1.0; // Height of the cone

  // Draw the base
  for (var i = 0; i < n; i++) {
    var angle1 = (i / n) * Math.PI * 2;
    var angle2 = ((i + 1) / n) * Math.PI * 2;

    var x1 = Math.cos(angle1) * radius;
    var z1 = Math.sin(angle1) * radius;
    var x2 = Math.cos(angle2) * radius;
    var z2 = Math.sin(angle2) * radius;

    drawTriangle3D([0.0, 0.0, 0.0, x1, 0.0, z1, x2, 0.0, z2]);
  }
  gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

  // Draw the sides
  for (var i = 0; i < n; i++) {
    var angle1 = (i / n) * Math.PI * 2;
    var angle2 = ((i + 1) / n) * Math.PI * 2;

    var x1 = Math.cos(angle1) * radius;
    var z1 = Math.sin(angle1) * radius;
    var x2 = Math.cos(angle2) * radius;
    var z2 = Math.sin(angle2) * radius;

    drawTriangle3D([x1, 0.0, z1, 0.0, height, 0.0, x2, 0.0, z2]);
  }
}
