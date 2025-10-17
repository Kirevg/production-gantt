const { v4: uuidv4 } = require('uuid');

console.log('🎯 Генерируем 11 UUID для недостающих записей Person:');
console.log('');

for (let i = 1; i <= 11; i++) {
    const uuid = uuidv4();
    console.log(`${i.toString().padStart(2, '0')}. ${uuid}`);
}

console.log('');
console.log('✅ Готово! Скопируйте эти UUID и используйте для обновления записей.');
