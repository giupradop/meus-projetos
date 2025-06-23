// adjust canvas to screen size

const canvas = document.getElementById('webgl-canvas');
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;

const gl = canvas.getContext('webgl');
gl.viewport(0, 0, canvas.width, canvas.height);

if (!gl) {
    console.error('Unable to initialize WebGL. Your browser may not support it.');
}

// Request pointer lock on canvas click
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

let points = 0;

// Update mousemove event using movementX/Y, so the cursor is hidden
canvas.addEventListener('mousemove', (e) => {
    let offsetX = e.movementX * 0.1;
    let offsetY = e.movementY * 0.1;

    yaw += offsetX;
    pitch -= offsetY; // subtract to match typical mouse drifting upward

    if (pitch > 89) pitch = 89;
    if (pitch < -89) pitch = -89;

    const radYaw = yaw * Math.PI / 180;
    const radPitch = pitch * Math.PI / 180;
    const front = [
        Math.cos(radYaw) * Math.cos(radPitch),
        Math.sin(radPitch),
        Math.sin(radYaw) * Math.cos(radPitch)
    ];

    const len = Math.hypot(front[0], front[1], front[2]);
    const normFront = front.map(v => v / len);

    scene.camera.target = [
        scene.camera.position[0] + normFront[0],
        scene.camera.position[1] + normFront[1],
        scene.camera.position[2] + normFront[2]
    ];
});

// Set the viewport and enable depth testing
gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.53, 0.80, 0.92, 1.0);

// Load shaders and initialize attribute buffers
function initShaders() {
    // Load and compile shaders here
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Placeholder blue pixel
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    width, height, border, srcFormat, srcType,
                    pixel);

    const image = new Image();
    image.crossOrigin = "anonymous"; // Allow cross-origin requests
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Flip the Y axis if needed.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // Set parameters for non power-of-2 images.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
    };
    image.src = url;
    
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

// Create a global scene variable for the render loop
let scene;
function initScene() {
    scene = new Scene(gl);
    
    // Create the floor and cube as before.
    const floorTexture = loadTexture(gl, './grama.png'); // ensure correct path
    const floor = new Floor(gl, floorTexture);


    scene.addObject(floor);

    // Walls for the perimeter of the scene
    const wallTexture = loadTexture(gl, './parede.png');
    const wall = new Wall(gl, [0, 5, -50], 100, 10, 1, wallTexture);
    scene.addObject(wall);
    const wall2 = new Wall(gl, [0, 5, 50], 100, 10, 1, wallTexture);
    scene.addObject(wall2);
    const wall3 = new Wall(gl, [-50, 5, 0], 1, 10, 100, wallTexture);
    scene.addObject(wall3);
    const wall4 = new Wall(gl, [50, 5, 0], 1, 10, 100, wallTexture);
    scene.addObject(wall4);

    // The maze itself
    const Wall5 = new Wall(gl, [-5, 5, -30], 1, 10, 40, wallTexture);
    scene.addObject(Wall5);
    const Wall6 = new Wall(gl, [5, 5, -30], 1, 10, 40, wallTexture);
    scene.addObject(Wall6);
    const Wall7 = new SpecialWall(gl, [-10, 5, -10], 10, 10, 1, wallTexture);
    scene.addObject(Wall7);
    const Wall8 = new Wall(gl, [-15, 5, -25], 1, 10, 30, wallTexture);
    scene.addObject(Wall8);
    const Wall9 = new Wall(gl, [-29, 5, -40], 27.5, 10, 1, wallTexture);
    scene.addObject(Wall9);
    const Wall10 = new Wall(gl, [-42.5, 5, 5], 1, 10, 90, wallTexture);
    scene.addObject(Wall10);
    const Wall11 = new Wall(gl, [32.5, 5, -10], 35, 10, 1, wallTexture);
    scene.addObject(Wall11);
    const Wall12 = new Wall(gl, [15, 5, -25], 1, 10, 30, wallTexture);
    scene.addObject(Wall12);
    const Wall13 = new Wall(gl, [29, 5, -40], 27, 10, 1, wallTexture);
    scene.addObject(Wall13);
    const Wall14 = new Wall(gl, [42.5, 5, -29], 1, 10, 22.5, wallTexture);
    scene.addObject(Wall14);
    const Wall15 = new Wall(gl, [32, 5, -18], 22, 10, 1, wallTexture);
    scene.addObject(Wall15);
    const Wall16 = new Wall(gl, [15, 5, 20], 1, 10, 40, wallTexture);
    scene.addObject(Wall16);
    const Wall17 = new Wall(gl, [29, 5, 40], 27, 10, 1, wallTexture);
    scene.addObject(Wall17);
    const Wall18 = new Wall(gl, [42.5, 5, 10], 1, 10, 40, wallTexture);
    scene.addObject(Wall18);
    const Wall19 = new Wall(gl, [32, 5, 30], 22, 10, 1, wallTexture);
    scene.addObject(Wall19);
    const Wall20 = new Wall(gl, [15, 5, 40], 1, 10, 20, wallTexture);
    scene.addObject(Wall20);
    const Wall21 = new Wall(gl, [5, 5, 30], 1, 10, 20, wallTexture);
    scene.addObject(Wall21);
    const Wall22 = new Wall(gl, [-5, 5, 16], 1, 10, 32, wallTexture);
    scene.addObject(Wall22);
    const Wall23 = new Wall(gl, [-15, 5, 40], 40, 10, 1, wallTexture);
    scene.addObject(Wall23);
    const Wall24 = new Wall(gl, [-35, 5, 10], 1, 10, 60, wallTexture);
    scene.addObject(Wall24);
    const Wall25 = new Wall(gl, [-15, 5, 0], 20, 10, 1, wallTexture);
    scene.addObject(Wall25);
    const Wall26 = new Wall(gl, [-25, 5, 5.75], 1, 10, 52, wallTexture);
    scene.addObject(Wall26);



    // Set the camera position and target to look straight ahead
    scene.camera.position = [0, 4, 7.4];
    scene.camera.target = [0, 2, -50]; // Adjust the Z-coordinate to look straight ahead

    // Add the doll object to the scene
    const headTex = loadTexture(gl, './cabeca_boneca.jpg'); // ensure the correct relative path
    const doll1 = new Doll(gl, [0, 0, -45], headTex);
    scene.addObject(doll1);

    // Add the BlockyCharacter object to the scene
    const myCharacter = new BlockyCharacter(gl, [-9.5, 2, -8]);
    scene.addObject(myCharacter);
}

// Create an object to track pressed keys
const keysPressed = {};
document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

// Initialize mouse control variables for camera rotation
let yaw = -90;            // Facing -Z
let pitch = 0;
let lastMouseX = 0;
let lastMouseY = 0;

// Mouse rotation events (using clientX/Y for non-pointer lock mode)
canvas.addEventListener('mousedown', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
canvas.addEventListener('mousemove', (e) => {
    let offsetX = e.clientX - lastMouseX;
    let offsetY = lastMouseY - e.clientY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    const sensitivity = 0.1;
    offsetX *= sensitivity;
    offsetY *= sensitivity;
    yaw += offsetX;
    pitch += offsetY;
    if (pitch > 89) pitch = 89;
    if (pitch < -89) pitch = -89;
    
    const radYaw = yaw * Math.PI / 180;
    const radPitch = pitch * Math.PI / 180;
    const front = [
        Math.cos(radYaw) * Math.cos(radPitch),
        Math.sin(radPitch),
        Math.sin(radYaw) * Math.cos(radPitch)
    ];
    
    const len = Math.hypot(front[0], front[1], front[2]);
    const normFront = front.map(v => v / len);
    scene.camera.target = [
        scene.camera.position[0] + normFront[0],
        scene.camera.position[1] + normFront[1],
        scene.camera.position[2] + normFront[2]
    ];
});

// Function that updates camera position based on pressed keys (allows diagonal movement)
function updateCameraMovement() {
    if (!scene) return;

    let moveSpeed = keysPressed['shift'] ? 1 : 0.2;
    const camera = scene.camera;
    let forward = [
        camera.target[0] - camera.position[0],
        0,
        camera.target[2] - camera.position[2]
    ];
    let fLen = Math.hypot(forward[0], forward[1], forward[2]);
    if (fLen > 0) {
        forward = forward.map(v => v / fLen);
    }
    
    let up = [0, 1, 0];
    let right = cross(forward, up);
    let rLen = Math.hypot(right[0], right[1], right[2]);
    if (rLen > 0) {
        right = right.map(v => v / rLen);
    }
    
    // Movement direction based on pressed keys
    let moveDir = [0, 0, 0];
    if (keysPressed['w']) moveDir = moveDir.map((v, i) => v + forward[i]);
    if (keysPressed['s']) moveDir = moveDir.map((v, i) => v - forward[i]);
    if (keysPressed['a']) moveDir = moveDir.map((v, i) => v - right[i]);
    if (keysPressed['d']) moveDir = moveDir.map((v, i) => v + right[i]);
    
    // Declare newPos in outer scope
    let newPos;
    const len = Math.hypot(moveDir[0], moveDir[1], moveDir[2]);
    if (len > 0) {
        moveDir = moveDir.map(v => v / len);
        // Calculate the proposed new positions
        newPos = [
            camera.position[0] + moveDir[0] * moveSpeed,
            camera.position[1],
            camera.position[2] + moveDir[2] * moveSpeed
        ];
        
        // Check collision with all walls
        let collision = false;
        scene.objects.forEach(obj => {
            // For regular walls, always test.
            if (obj instanceof Wall && !(obj instanceof SpecialWall) && obj.collidesWith(newPos, 0.5)) {
                 collision = true;
            }
            // For special walls, only test if the wall is visible.
            if (obj instanceof SpecialWall && obj.visible && obj.collidesWith(newPos, 0.5)) {
                 collision = true;
            }
        });
        
        // Only update if no collision is detected
        if (!collision) {
            camera.position[0] += moveDir[0] * moveSpeed;
            camera.position[2] += moveDir[2] * moveSpeed;
            camera.target[0]   += moveDir[0] * moveSpeed;
            camera.target[2]   += moveDir[2] * moveSpeed;
        }
    }
    
    // Using newPos outside of the if block is now safe
    if (newPos) {
        scene.objects.forEach(obj => {
            if (obj instanceof SpecialWall && obj.collidesWith(newPos, 0.5)) {
                 obj.visible = false;
                 // Optionally: add a new object behind the wall to reveal a passage.
            }
        });
    }
}

// The rendering loop using the single camera
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Set the viewport to the full canvas
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Update camera movement each frame
    updateCameraMovement();

    // Generate matrices from scene.camera
    const projectionMatrix = scene.createProjectionMatrix();
    const viewMatrix = scene.createViewMatrix();

    // Check for collisions with dolls and remove them if necessary
    const collisionThreshold = 2.0; // Adjust threshold as needed
    scene.objects = scene.objects.filter(object => {
        if (object instanceof Doll) {
            const dx = scene.camera.position[0] - object.position[0];
            const dz = scene.camera.position[2] - object.position[2];
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance < collisionThreshold) {
                points += 1;
                if(points < 5){
                    object.position = [
                        Math.random() * 100 - 50, 
                        object.position[1],      
                        Math.random() * 100 - 50      
                    ];
                } 
                else{
                    return false;
                }
            }
        }
        return true;
    });

    // Render each object
    scene.objects.forEach(object => {
        object.render(gl, projectionMatrix, viewMatrix);
    });

    document.getElementById('score').innerText = 'Bonecas coletadas: ' + points;

     if (points >= 5) {
        document.getElementById('win-screen').style.display = 'flex';
        return; // Stop the loop
    }

    requestAnimationFrame(render);
}

// Utility function: cross product
function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}


// Start the application
initShaders();
initScene();
render();



Floor.prototype.render = function(gl, projectionMatrix, viewMatrix) {
    gl.useProgram(this.program);
    gl.disable(gl.CULL_FACE);

    // Bind vertex data using the correct vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Bind texture coordinates attribute
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    // Bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // Set uniforms
    gl.uniformMatrix4fv(this.uProjectionMatrix, false, new Float32Array(projectionMatrix));
    gl.uniformMatrix4fv(this.uViewMatrix, false, new Float32Array(viewMatrix));
    gl.uniformMatrix4fv(this.uModelMatrix, false, this.modelMatrix);
    gl.uniform4fv(this.uColor, new Float32Array([0.5, 0.5, 0.5, 1.0]));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
};

Wall.prototype.collidesWith = function(point, radius = 0.1) {
    // Expand the wall bounds by the radius
    const minX = this.center[0] - this.width / 2 - radius;
    const maxX = this.center[0] + this.width / 2 + radius;
    const minZ = this.center[2] - this.depth / 2 - radius;
    const maxZ = this.center[2] + this.depth / 2 + radius;
    return (point[0] >= minX && point[0] <= maxX) &&
           (point[2] >= minZ && point[2] <= maxZ);
};