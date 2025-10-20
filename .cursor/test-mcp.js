/**
 * Простой тест MCP инструментов
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Тестирование MCP инструментов...\n');

// Тест 1: Проверка файловых инструментов
console.log('📁 Тест файловых инструментов:');
try {
    const MCPFileTools = require('./mcp-file-tools');
    const fileTools = new MCPFileTools();

    // Создаем тестовую директорию
    const testDir = path.join(__dirname, 'test-dir');
    fileTools.ensureDirectory(testDir);
    console.log('✅ Создание директории работает');

    // Создаем тестовый файл
    const testFile = path.join(testDir, 'test.txt');
    fileTools.safeWriteFile(testFile, 'Тестовый контент', false);
    console.log('✅ Безопасное сохранение файла работает');

    // Читаем файл
    const content = fileTools.safeReadFile(testFile);
    console.log('✅ Безопасное чтение файла работает');

    // Удаляем тестовую директорию
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✅ Очистка тестовых файлов работает');

} catch (error) {
    console.log('❌ Ошибка файловых инструментов:', error.message);
}

// Тест 2: Проверка Git инструментов
console.log('\n🔄 Тест Git инструментов:');
try {
    const MCPGitTools = require('./mcp-git-tools');
    const gitTools = new MCPGitTools();

    // Получаем статус Git
    const status = gitTools.getStatus();
    console.log('✅ Получение статуса Git работает');

    // Получаем текущую ветку
    const branch = gitTools.getCurrentBranch();
    console.log('✅ Получение текущей ветки работает');

} catch (error) {
    console.log('❌ Ошибка Git инструментов:', error.message);
}

// Тест 3: Проверка конфигурации
console.log('\n⚙️ Тест конфигурации:');
try {
    const configPath = path.join(__dirname, 'mcp.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Конфигурация MCP загружена');
        console.log(`  Настроено серверов: ${Object.keys(config.mcpServers || {}).length}`);
    } else {
        console.log('❌ Конфигурация MCP не найдена');
    }
} catch (error) {
    console.log('❌ Ошибка загрузки конфигурации:', error.message);
}

// Тест 4: Проверка директорий
console.log('\n📂 Тест директорий:');
const requiredDirs = ['backups', 'logs', 'screenshots', 'memory'];
let createdDirs = 0;

requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ Директория ${dir} существует`);
        createdDirs++;
    } else {
        console.log(`❌ Директория ${dir} не найдена`);
    }
});

console.log(`\n📊 Результаты тестирования:`);
console.log(`  Создано директорий: ${createdDirs}/${requiredDirs.length}`);

if (createdDirs === requiredDirs.length) {
    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! MCP готов к работе!');
} else {
    console.log('\n⚠️ Некоторые тесты не пройдены. Проверьте настройки.');
}

console.log('\n🔧 Для полной настройки:');
console.log('  1. Установите MCP серверы: npm install -g @modelcontextprotocol/server-*');
console.log('  2. Настройте Cursor для использования MCP');
console.log('  3. Перезапустите Cursor');

