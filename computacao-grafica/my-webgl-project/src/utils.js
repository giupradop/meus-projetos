function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function createIdentityMatrix() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

function multiplyMatrices(a, b) {
    const result = new Array(16).fill(0);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            for (let i = 0; i < 4; i++) {
                result[row * 4 + col] += a[row * 4 + i] * b[i * 4 + col];
            }
        }
    }
    return result;
}

function createTranslationMatrix(tx, ty, tz) {
    const matrix = createIdentityMatrix();
    matrix[12] = tx;
    matrix[13] = ty;
    matrix[14] = tz;
    return matrix;
}

function createRotationMatrix(angle, axis) {
    const rad = degToRad(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const [x, y, z] = axis;

    const matrix = createIdentityMatrix();
    matrix[0] = cos + (1 - cos) * x * x;
    matrix[1] = (1 - cos) * x * y + sin * z;
    matrix[2] = (1 - cos) * x * z - sin * y;

    matrix[4] = (1 - cos) * y * x - sin * z;
    matrix[5] = cos + (1 - cos) * y * y;
    matrix[6] = (1 - cos) * y * z + sin * x;

    matrix[8] = (1 - cos) * z * x + sin * y;
    matrix[9] = (1 - cos) * z * y - sin * x;
    matrix[10] = cos + (1 - cos) * z * z;

    return matrix;
}

function createScalingMatrix(sx, sy, sz) {
    const matrix = createIdentityMatrix();
    matrix[0] = sx;
    matrix[5] = sy;
    matrix[10] = sz;
    return matrix;
}