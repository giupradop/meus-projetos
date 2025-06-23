// This file defines the functions and classes related to the 3D scene. It handles the creation of objects, setting up the camera, and managing the rendering of the scene.

class Scene {
    constructor(gl) {
        this.gl = gl;
        this.objects = [];
        this.camera = {
            position: [0, 0, 5],
            target: [0, 0, 0],
            up: [0, 1, 0],
            fov: Math.PI / 4,
            aspect: gl.canvas.clientWidth / gl.canvas.clientHeight,
            near: 0.1,
            far: 1000
        };
    }

    addObject(object) {
        this.objects.push(object);
    }

    updateCamera() {
        // Update camera logic here
    }

    render() {
        // Example clear color: a dark shade so the grey floor stands out.
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        
        // Set up projection and view matrices
        const projectionMatrix = this.createProjectionMatrix();
        const viewMatrix = this.createViewMatrix();

        // Render each object in the scene
        this.objects.forEach(object => {
            object.render(this.gl, projectionMatrix, viewMatrix);
        });
    }

    createProjectionMatrix() {
        const { fov, aspect, near, far } = this.camera;
        const top = near * Math.tan(fov / 2);
        const right = top * aspect;
        return [
            near / right, 0, 0, 0,
            0, near / top, 0, 0,
            0, 0, -(far + near) / (far - near), -1,
            0, 0, -(2 * far * near) / (far - near), 0
        ];
    }

    createViewMatrix() {
        const { position, target, up } = this.camera;
        return lookAt(position, target, up);
    }
}

function lookAt(eye, center, up) {
    const zAxis = normalize([
        eye[0] - center[0],
        eye[1] - center[1],
        eye[2] - center[2]
    ]);
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = normalize(cross(zAxis, xAxis));

    return [
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
    ];
}

function normalize(v) {
    const len = Math.hypot(...v);
    return v.map(i => i / len);
}

function cross(a, b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ];
}

function dot(a, b) {
    return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

class Floor {
    // Accept an optional texture parameter
    constructor(gl, texture = null) {
        this.gl = gl;
        this.texture = texture;

        // Define floor vertices with texture coordinates (interleaved: position X, Y, Z then texCoord u, v)
        this.vertices = new Float32Array([
            //  X      Y   Z      u   v
            -50.0, 0.0, -50.0,   0.0, 0.0,
            -50.0, 0.0,  50.0,   0.0, 1.0,
             50.0, 0.0,  50.0,   1.0, 1.0,
             50.0, 0.0, -50.0,   1.0, 0.0
        ]);
        // Two triangles
        this.indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);

        // Create and bind the vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Create and bind the index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        this.indexCount = this.indices.length;

        // Updated shader sources including texture support
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uModelMatrix;
            varying vec2 vTexCoord;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
                vTexCoord = aTexCoord;
            }
        `;
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 uColor;
            uniform sampler2D uTexture;
            varying vec2 vTexCoord;
            void main() {
                vec4 texColor = texture2D(uTexture, vTexCoord);
                gl_FragColor = texColor * uColor;
            }
        `;

        // Compile shaders and create the program
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);

        // Cache attribute and uniform locations
        this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
        this.aTexCoord = gl.getAttribLocation(this.program, 'aTexCoord');
        this.uProjectionMatrix = gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uViewMatrix = gl.getUniformLocation(this.program, 'uViewMatrix');
        this.uModelMatrix = gl.getUniformLocation(this.program, 'uModelMatrix');
        this.uColor = gl.getUniformLocation(this.program, 'uColor');
        this.uTexture = gl.getUniformLocation(this.program, 'uTexture');

        // Set the model matrix to identity (floor is placed at Y=0)
        this.modelMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vs, fs) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Program linking failed:", this.gl.getProgramInfoLog(program));
        }
        return program;
    }

    render(gl, projectionMatrix, viewMatrix) {
        gl.useProgram(this.program);

        // Optionally disable face culling to ensure the floor isn't culled
        gl.disable(gl.CULL_FACE);

        // Bind the vertex buffer and set attribute pointers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
        // Position: first 3 floats
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, stride, 0);
        // Texture coordinates: next 2 floats
        gl.enableVertexAttribArray(this.aTexCoord);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

        // Bind the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Set uniform matrices and floor color (for example, grey)
        gl.uniformMatrix4fv(this.uProjectionMatrix, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.uViewMatrix, false, new Float32Array(viewMatrix));
        gl.uniformMatrix4fv(this.uModelMatrix, false, this.modelMatrix);
        gl.uniform4fv(this.uColor, new Float32Array([0.5, 0.5, 0.5, 1.0]));

        // If a texture was provided, bind it; otherwise you might bind a white 1x1 texture
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }
        // Tell the shader to use texture unit 0
        gl.uniform1i(this.uTexture, 0);

        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
}

class Wall {
    constructor(gl, position = [0, 0, 0], width = 10, height = 10, depth = 1, texture = null) {
        this.gl = gl;
        this.texture = texture;

        // Save properties for collision testing.
        this.center = position;
        this.width = width;
        this.height = height;
        this.depth = depth;

        const [cx, cy, cz] = position;
        const hw = width / 2;
        const hh = height / 2;
        const hd = depth / 2;
        // Define vertices for a cuboid with 24 vertices (4 vertices per face).
        // Each face gets its own set of vertices for distinct texture coordinates.
        // Vertex format: positionX, positionY, positionZ, texU, texV
        this.vertices = new Float32Array([
            // Front face (Z+)
            cx - hw, cy - hh, cz + hd,   0.0, 0.0,
            cx + hw, cy - hh, cz + hd,   1.0, 0.0,
            cx + hw, cy + hh, cz + hd,   1.0, 1.0,
            cx - hw, cy + hh, cz + hd,   0.0, 1.0,
            // Back face (Z-)
            cx + hw, cy - hh, cz - hd,   0.0, 0.0,
            cx - hw, cy - hh, cz - hd,   1.0, 0.0,
            cx - hw, cy + hh, cz - hd,   1.0, 1.0,
            cx + hw, cy + hh, cz - hd,   0.0, 1.0,
            // Top face (Y+)
            cx - hw, cy + hh, cz + hd,   0.0, 0.0,
            cx + hw, cy + hh, cz + hd,   1.0, 0.0,
            cx + hw, cy + hh, cz - hd,   1.0, 1.0,
            cx - hw, cy + hh, cz - hd,   0.0, 1.0,
            // Bottom face (Y-)
            cx - hw, cy - hh, cz - hd,   0.0, 0.0,
            cx + hw, cy - hh, cz - hd,   1.0, 0.0,
            cx + hw, cy - hh, cz + hd,   1.0, 1.0,
            cx - hw, cy - hh, cz + hd,   0.0, 1.0,
            // Right face (X+)
            cx + hw, cy - hh, cz + hd,   0.0, 0.0,
            cx + hw, cy - hh, cz - hd,   1.0, 0.0,
            cx + hw, cy + hh, cz - hd,   1.0, 1.0,
            cx + hw, cy + hh, cz + hd,   0.0, 1.0,
            // Left face (X-)
            cx - hw, cy - hh, cz - hd,   0.0, 0.0,
            cx - hw, cy - hh, cz + hd,   1.0, 0.0,
            cx - hw, cy + hh, cz + hd,   1.0, 1.0,
            cx - hw, cy + hh, cz - hd,   0.0, 1.0,
        ]);
        // Define indices for 12 triangles (6 faces)
        this.indices = new Uint16Array([
            // Front face
            0, 1, 2,   0, 2, 3,
            // Back face
            4, 5, 6,   4, 6, 7,
            // Top face
            8, 9, 10,  8, 10,11,
            // Bottom face
            12,13,14,  12,14,15,
            // Right face
            16,17,18,  16,18,19,
            // Left face
            20,21,22,  20,22,23
        ]);
        // Create and load vertex and index buffers.
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        this.indexCount = this.indices.length;
        
        // Shader sources (using texture support)
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uModelMatrix;
            varying vec2 vTexCoord;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
                vTexCoord = aTexCoord;
            }
        `;
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 uColor;
            uniform sampler2D uTexture;
            varying vec2 vTexCoord;
            void main() {
                vec4 texColor = texture2D(uTexture, vTexCoord);
                gl_FragColor = texColor * uColor;
            }
        `;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Cache attribute and uniform locations.
        this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
        this.aTexCoord = gl.getAttribLocation(this.program, 'aTexCoord');
        this.uProjectionMatrix = gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uViewMatrix = gl.getUniformLocation(this.program, 'uViewMatrix');
        this.uModelMatrix = gl.getUniformLocation(this.program, 'uModelMatrix');
        this.uColor = gl.getUniformLocation(this.program, 'uColor');
        this.uTexture = gl.getUniformLocation(this.program, 'uTexture');
        // Set the model matrix to identity.
        this.modelMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vs, fs) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Program linking failed:", this.gl.getProgramInfoLog(program));
        }
        return program;
    }

    // Helper: Check if a point is inside this wall's AABB
    contains(point) {
        const minX = this.center[0] - this.width / 2;
        const maxX = this.center[0] + this.width / 2;
        const minZ = this.center[2] - this.depth / 2;
        const maxZ = this.center[2] + this.depth / 2;
        return (point[0] >= minX && point[0] <= maxX) &&
               (point[2] >= minZ && point[2] <= maxZ);
    }

    collidesWith(point, radius = 0.1) {
        const minX = this.center[0] - this.width / 2 - radius;
        const maxX = this.center[0] + this.width / 2 + radius;
        const minZ = this.center[2] - this.depth / 2 - radius;
        const maxZ = this.center[2] + this.depth / 2 + radius;
        return (point[0] >= minX && point[0] <= maxX) &&
               (point[2] >= minZ && point[2] <= maxZ);
    }

    render(gl, projectionMatrix, viewMatrix) {
        gl.useProgram(this.program);
        gl.disable(gl.CULL_FACE);
        // Bind the vertex buffer and set attribute pointers.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(this.aTexCoord);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
        // Bind the index buffer.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // Set uniforms
        gl.uniformMatrix4fv(this.uProjectionMatrix, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.uViewMatrix, false, new Float32Array(viewMatrix));
        gl.uniformMatrix4fv(this.uModelMatrix, false, this.modelMatrix);
        gl.uniform4fv(this.uColor, new Float32Array([1.0, 1.0, 1.0, 1.0]));
        // Bind texture if provided.
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }
        gl.uniform1i(this.uTexture, 0);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
}

class SpecialWall extends Wall {
    constructor(gl, position, width, height, depth, texture) {
        super(gl, position, width, height, depth, texture);
        this.visible = true; // initially visible
    }

    render(gl, projectionMatrix, viewMatrix) {
        if (!this.visible) return; // skip rendering if not visible
        super.render(gl, projectionMatrix, viewMatrix);
    }
}

class Doll {
    /**
     * Creates a doll with a body and a head.
     * @param {WebGLRenderingContext} gl - The WebGL context.
     * @param {number[]} position - The [x, y, z] position of the doll's body center.
     * @param {WebGLTexture|null} headTexture - (Optional) A texture for the head.
     */
    constructor(gl, position = [0, 0, 0], headTexture = null) {
        this.gl = gl;
        this.position = position;
        this.headTexture = headTexture;

        // Create a program for the colored (body) parts.
        const bodyVertexShaderSource = `
            attribute vec3 aPosition;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uModelMatrix;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
            }
        `;
        const bodyFragmentShaderSource = `
            precision mediump float;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = uColor;
            }
        `;
        this.bodyProgram = this._createProgram(bodyVertexShaderSource, bodyFragmentShaderSource);
        this.bodyAPosition = gl.getAttribLocation(this.bodyProgram, 'aPosition');
        this.bodyUProjection = gl.getUniformLocation(this.bodyProgram, 'uProjectionMatrix');
        this.bodyUView = gl.getUniformLocation(this.bodyProgram, 'uViewMatrix');
        this.bodyUModel = gl.getUniformLocation(this.bodyProgram, 'uModelMatrix');
        this.bodyUColor = gl.getUniformLocation(this.bodyProgram, 'uColor');

        // Create geometry for a unit cube (used for the body).
        // Use 36 vertices (6 faces * 2 triangles per face) with positions only.
        const bodyVertices = new Float32Array([
             // Front face
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            // Back face
            -0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5, -0.5, -0.5,
            // Left face
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5, -0.5, -0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
            // Right face
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5, -0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5, -0.5,  0.5,
            // Top face
            -0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5, -0.5,
            // Bottom face
            -0.5, -0.5,  0.5,
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
        ]);
        this.bodyVertexCount = bodyVertices.length / 3;
        this.bodyVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bodyVBO);
        gl.bufferData(gl.ARRAY_BUFFER, bodyVertices, gl.STATIC_DRAW);

        // If a head texture is provided, create a textured cube for the head.
        if (this.headTexture) {
            // Create a separate program for textured rendering.
            const headVertexShaderSource = `
                attribute vec3 aPosition;
                attribute vec2 aTexCoord;
                uniform mat4 uProjectionMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uModelMatrix;
                varying vec2 vTexCoord;
                void main() {
                    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
                    vTexCoord = aTexCoord;
                }
            `;
            const headFragmentShaderSource = `
                precision mediump float;
                uniform sampler2D uHeadTexture;
                varying vec2 vTexCoord;
                void main() {
                    gl_FragColor = texture2D(uHeadTexture, vTexCoord);
                }
            `;
            this.headProgram = this._createProgram(headVertexShaderSource, headFragmentShaderSource);
            this.headAPosition = gl.getAttribLocation(this.headProgram, 'aPosition');
            this.headATexCoord = gl.getAttribLocation(this.headProgram, 'aTexCoord');
            this.headUProjection = gl.getUniformLocation(this.headProgram, 'uProjectionMatrix');
            this.headUView = gl.getUniformLocation(this.headProgram, 'uViewMatrix');
            this.headUModel = gl.getUniformLocation(this.headProgram, 'uModelMatrix');
            this.headUTexture = gl.getUniformLocation(this.headProgram, 'uHeadTexture');

            // Define vertices (with texture coordinates) for a unit cube.
            // 24 vertices: 4 per face.
            const headVertices = new Float32Array([
                // Front face
                -0.5, -0.5,  0.5,  0.0, 0.0,
                 0.5, -0.5,  0.5,  1.0, 0.0,
                 0.5,  0.5,  0.5,  1.0, 1.0,
                -0.5,  0.5,  0.5,  0.0, 1.0,
                // Back face
                 0.5, -0.5, -0.5,  0.0, 0.0,
                -0.5, -0.5, -0.5,  1.0, 0.0,
                -0.5,  0.5, -0.5,  1.0, 1.0,
                 0.5,  0.5, -0.5,  0.0, 1.0,
                // Top face
                -0.5,  0.5,  0.5,  0.0, 0.0,
                 0.5,  0.5,  0.5,  1.0, 0.0,
                 0.5,  0.5, -0.5,  1.0, 1.0,
                -0.5,  0.5, -0.5,  0.0, 1.0,
                // Bottom face
                -0.5, -0.5, -0.5,  0.0, 0.0,
                 0.5, -0.5, -0.5,  1.0, 0.0,
                 0.5, -0.5,  0.5,  1.0, 1.0,
                -0.5, -0.5,  0.5,  0.0, 1.0,
                // Right face
                 0.5, -0.5,  0.5,  0.0, 0.0,
                 0.5, -0.5, -0.5,  1.0, 0.0,
                 0.5,  0.5, -0.5,  1.0, 1.0,
                 0.5,  0.5,  0.5,  0.0, 1.0,
                // Left face
                -0.5, -0.5, -0.5,  0.0, 0.0,
                -0.5, -0.5,  0.5,  1.0, 0.0,
                -0.5,  0.5,  0.5,  1.0, 1.0,
                -0.5,  0.5, -0.5,  0.0, 1.0,
            ]);
            // Define indices (36 total) for the textured cube.
            const headIndices = new Uint16Array([
                0, 1, 2,    0, 2, 3,      // front
                4, 5, 6,    4, 6, 7,      // back
                8, 9,10,    8,10,11,      // top
               12,13,14,   12,14,15,      // bottom
               16,17,18,   16,18,19,      // right
               20,21,22,   20,22,23       // left
            ]);
            this.headIndexCount = headIndices.length;
            // Create VBO for head vertices with texture coords.
            this.headVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.headVBO);
            gl.bufferData(gl.ARRAY_BUFFER, headVertices, gl.STATIC_DRAW);
            // Create IBO for head indices.
            this.headIBO = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.headIBO);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, headIndices, gl.STATIC_DRAW);
        }
    }

    // Helper to compile shader and create program.
    _createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
            gl.deleteShader(vertexShader);
            return null;
        }
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
            gl.deleteShader(fragmentShader);
            return null;
        }
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    /**
     * Renders the doll.
     * The body is rendered as a colored cube and the head as a (possibly textured) cube.
     * @param {WebGLRenderingContext} gl 
     * @param {number[]} projectionMatrix 
     * @param {number[]} viewMatrix 
     */
    render(gl, projectionMatrix, viewMatrix) {
        // Render body using the colored program.
        gl.useProgram(this.bodyProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bodyVBO);
        gl.enableVertexAttribArray(this.bodyAPosition);
        gl.vertexAttribPointer(this.bodyAPosition, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(this.bodyUProjection, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.bodyUView, false, new Float32Array(viewMatrix));
        // Create the body model matrix:
        // Scale to form a cuboid [1, 1.5, 0.5] and translate to this.position.
        const bodyScale = [1.0, 1.5, 0.5];
        const bodyModel = [
            bodyScale[0], 0,            0,            0,
            0,            bodyScale[1], 0,            0,
            0,            0,            bodyScale[2], 0,
            this.position[0], this.position[1], this.position[2], 1
        ];
        gl.uniformMatrix4fv(this.bodyUModel, false, new Float32Array(bodyModel));
        // Set body color (e.g., reddish).
        gl.uniform4fv(this.bodyUColor, new Float32Array([0.8, 0.4, 0.4, 1.0]));
        gl.drawArrays(gl.TRIANGLES, 0, this.bodyVertexCount);

        // Render head.
        // The head sits atop the body. Scale head to [0.5, 0.5, 0.5].
        const headScale = [0.5, 0.5, 0.5];
        const headPos = [
            this.position[0],
            this.position[1] + (bodyScale[1] / 2 + headScale[1] / 2),
            this.position[2]
        ];
        // If a head texture exists, use the textured program.
        if (this.headTexture) {
            gl.useProgram(this.headProgram);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.headVBO);
            gl.enableVertexAttribArray(this.headAPosition);
            gl.vertexAttribPointer(this.headAPosition, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
            gl.enableVertexAttribArray(this.headATexCoord);
            gl.vertexAttribPointer(this.headATexCoord, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.headIBO);
            gl.uniformMatrix4fv(this.headUProjection, false, new Float32Array(projectionMatrix));
            gl.uniformMatrix4fv(this.headUView, false, new Float32Array(viewMatrix));
            const headModel = [
                headScale[0], 0,            0,            0,
                0,            headScale[1], 0,            0,
                0,            0,            headScale[2], 0,
                headPos[0],   headPos[1],   headPos[2],   1
            ];
            gl.uniformMatrix4fv(this.headUModel, false, new Float32Array(headModel));
            // Bind texture unit 0 to headTexture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.headTexture);
            gl.uniform1i(this.headUTexture, 0);
            gl.drawElements(gl.TRIANGLES, this.headIndexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            // Otherwise, render the head as a colored cube using the body program.
            gl.useProgram(this.bodyProgram);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bodyVBO);
            gl.enableVertexAttribArray(this.bodyAPosition);
            gl.vertexAttribPointer(this.bodyAPosition, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(this.bodyUProjection, false, new Float32Array(projectionMatrix));
            gl.uniformMatrix4fv(this.bodyUView, false, new Float32Array(viewMatrix));
            const headModel = [
                headScale[0], 0,            0,            0,
                0,            headScale[1], 0,            0,
                0,            0,            headScale[2], 0,
                headPos[0],   headPos[1],   headPos[2],   1
            ];
            gl.uniformMatrix4fv(this.bodyUModel, false, new Float32Array(headModel));
            // Use a skin tone color.
            gl.uniform4fv(this.bodyUColor, new Float32Array([1.0, 0.8, 0.6, 1.0]));
            gl.drawArrays(gl.TRIANGLES, 0, this.bodyVertexCount);
        }
    }
}

class BlockyCharacter {
    constructor(gl, position = [0, 0, 0]) {
        this.gl = gl;
        this.position = position;
        
        // Simple colored shader program
        const vsSource = `
            attribute vec3 aPosition;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uModelMatrix;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
            }
        `;
        const fsSource = `
            precision mediump float;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = uColor;
            }
        `;
        this.program = this.createProgram(
            this.compileShader(gl.VERTEX_SHADER, vsSource),
            this.compileShader(gl.FRAGMENT_SHADER, fsSource)
        );
        
        // Look up attribute/uniform locations
        this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
        this.uProjection = gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uView = gl.getUniformLocation(this.program, 'uViewMatrix');
        this.uModel = gl.getUniformLocation(this.program, 'uModelMatrix');
        this.uColor = gl.getUniformLocation(this.program, 'uColor');

        // Create a buffer for a unit cube
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        const cubeVertices = new Float32Array([
            // Front face
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            // Back face
            -0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5, -0.5, -0.5,
            // Left face
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5, -0.5, -0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
            // Right face
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5, -0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5, -0.5,  0.5,
            // Top face
            -0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5, -0.5,
            // Bottom face
            -0.5, -0.5,  0.5,
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
        ]);
        this.vertexCount = cubeVertices.length / 3;
        gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        return shader;
    }

    createProgram(vs, fs) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Program linking failed:", this.gl.getProgramInfoLog(program));
        }
        return program;
    }

    // Renders a single cuboid part.
    renderPart(gl, projectionMatrix, viewMatrix, transform, color) {
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.uProjection, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.uView, false, new Float32Array(viewMatrix));
        gl.uniformMatrix4fv(this.uModel, false, transform);
        gl.uniform4fv(this.uColor, new Float32Array(color));

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    render(gl, projectionMatrix, viewMatrix) {
        // Body
        const bodyScale = [1, 1.5, 0.5];
        const bodyTransform = this.makeTransform(bodyScale, [0, 0, 0]);
        this.renderPart(gl, projectionMatrix, viewMatrix, bodyTransform, [0.8, 0.4, 0.4, 1]);

        // Head
        const headScale = [0.5, 0.5, 0.5];
        const headOffset = [0, bodyScale[1] / 2 + headScale[1] / 2, 0];
        const headTransform = this.makeTransform(headScale, headOffset);
        this.renderPart(gl, projectionMatrix, viewMatrix, headTransform, [1.0, 0.8, 0.6, 1.0]);
    
        // hat top
       const hatScale = [0.3, 0.8, 0.3];
       const hatOffset = [0, 0.27+bodyScale[1] / 2 + headScale[1] / 1.5, 0];
       const hatTransform = this.makeTransform(hatScale, hatOffset);
       this.renderPart(gl, projectionMatrix, viewMatrix, hatTransform, [0.58,0.29,0,1.0]);

        // hat down
        const hairScale = [0.9, 0.2, 0.9];
        const hairOffset = [0, 0.27+bodyScale[1] / 2 + headScale[1] / 1.5, 0];
        const hairTransform = this.makeTransform(hairScale, hairOffset);
        this.renderPart(gl, projectionMatrix, viewMatrix, hairTransform, [0.58,0.29,0,1.0]);

        // Eyes: two small black cubes on the head’s front face
        // Each eye sits slightly “in front” of the head using a small Z offset, and near the top corners.
        const eyeScale = [0.05, 0.05, 0.05];
        const leftEyeOffset = [
            -0.1,  // left
            headOffset[1] + 0.05,  // slightly lower than top
            0.26   // in front of the head’s front face
        ];
        const rightEyeOffset = [
            0.1,   
            headOffset[1] + 0.05,  
            0.26
        ];
        const leftEyeTransform = this.makeTransform(eyeScale, leftEyeOffset);
        const rightEyeTransform = this.makeTransform(eyeScale, rightEyeOffset);
        this.renderPart(gl, projectionMatrix, viewMatrix, leftEyeTransform, [0, 0, 0, 1]);
        this.renderPart(gl, projectionMatrix, viewMatrix, rightEyeTransform, [0, 0, 0, 1]);

        // Arms
        const armScale = [0.2, 0.8, 0.2];
        const leftArmOffset = [
            - (bodyScale[0] / 2 + armScale[0] / 2),
            bodyScale[1] / 4,
            0
        ];
        const rightArmOffset = [
            (bodyScale[0] / 2 + armScale[0] / 2),
            bodyScale[1] / 4,
            0
        ];
        const leftArmTransform = this.makeTransform(armScale, leftArmOffset);
        const rightArmTransform = this.makeTransform(armScale, rightArmOffset);
        this.renderPart(gl, projectionMatrix, viewMatrix, leftArmTransform, [0.7, 0.3, 0.3, 1]);
        this.renderPart(gl, projectionMatrix, viewMatrix, rightArmTransform, [0.7, 0.3, 0.3, 1]);

        // Legs
        const legScale = [0.3, 0.8, 0.3];
        const leftLegOffset = [
            -0.2, 
            - (bodyScale[1] / 2 + legScale[1] / 2),
            0
        ];
        const rightLegOffset = [
            0.2, 
            - (bodyScale[1] / 2 + legScale[1] / 2),
            0
        ];
        const leftLegTransform = this.makeTransform(legScale, leftLegOffset);
        const rightLegTransform = this.makeTransform(legScale, rightLegOffset);
        this.renderPart(gl, projectionMatrix, viewMatrix, leftLegTransform, [0.13, 0.13, 0.4, 1]);
        this.renderPart(gl, projectionMatrix, viewMatrix, rightLegTransform, [0.13, 0.13, 0.4, 1]);


        // shoes
        const shoeScale = [0.4, 0.2, 0.6];
        const leftshoeOffset = [
            -0.2, 
             (bodyScale[1] / 2 + 2+ shoeScale[1] / 2)-4.5,
            0.1
        ];
        const rightshoeOffset = [
            0.2, 
             (bodyScale[1] / 2 + 2+ shoeScale[1] / 2)-4.5,
            0.1
        ];
        const leftshoeTransform = this.makeTransform(shoeScale, leftshoeOffset);
        const rightshoeTransform = this.makeTransform(shoeScale, rightshoeOffset);
        this.renderPart(gl, projectionMatrix, viewMatrix, leftshoeTransform, [0, 0, 0, 1]);
        this.renderPart(gl, projectionMatrix, viewMatrix, rightshoeTransform, [0, 0, 0, 1]);
    
    }

    makeTransform(scaleVec, offsetVec) {
        // Identity row-major matrix, then scale, then translate
        return new Float32Array([
            scaleVec[0],        0,             0,             0,
            0,                  scaleVec[1],   0,             0,
            0,                  0,             scaleVec[2],   0,
            this.position[0] + offsetVec[0],
            this.position[1] + offsetVec[1],
            this.position[2] + offsetVec[2],
            1
        ]);
    }

}