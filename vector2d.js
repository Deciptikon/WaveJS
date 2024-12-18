//умножает вектор на число
export function multipleToScalarVec2d(vec, scalar = 1) {
    return {
        x: vec.x * scalar, 
        y: vec.y * scalar
    };
}

//складывает два вектора
export function additionVec2d(vecA, vecB) {
    return {
        x: vecA.x + vecB.x,
        y: vecA.y + vecB.y
    }
}

//скалярное произведение двух векторов
export function dotVec2d(vecA, vecB) {
    return vecA.x * vecB.x + vecA.y * vecB.y;
}

//вектороное произведение двух векторов
export function crossVec3d(vecA, vecB) {
    return {
        x:vecA.y * vecB.z - vecA.z * vecB.y,
        y:vecA.z * vecB.x - vecA.x * vecB.z,
        z:vecA.x * vecB.y - vecA.y * vecB.x
    };
}

//функция считает длину радиус-вектора
export function lengthVec2d(vec) {
    return Math.sqrt(Math.pow(vec.x,2) + Math.pow(vec.y,2));
}

// функция делает вектор единичным
export function unitVec2d(vec) {
    const len = lengthVec2d(vec);
    if(len !== 0) {
        return {
            x: vec.x / len,
            y: vec.y / len
        };
    } else {
        return {
            x: 0,
            y: 0
        };
    }
}

// возвращает ортогональный вектор (повернутый на 90 градусов против часовой стрелки)
export function orthoVec2d(vec) {
    return {
        x: -vec.y,
        y: vec.x
    };
}