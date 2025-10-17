const { v4: uuidv4 } = require('uuid');

console.log('🎯 11 UUID для недостающих записей Person:');
console.log('');

for (let i = 1; i <= 11; i++) {
    const uuid = uuidv4();
    console.log(uuid);
}

console.log('');
console.log('✅ Готово!');
