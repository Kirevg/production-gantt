const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Начало миграции данных...\n');

    try {
        // 1. Миграция ProjectManager -> Person
        console.log('1️⃣ Миграция ProjectManager -> Person...');
        const projectManagers = await prisma.projectManager.findMany();
        
        const personMapping = {};
        for (const pm of projectManagers) {
            const person = await prisma.person.create({
                data: {
                    lastName: pm.lastName,
                    firstName: pm.firstName,
                    middleName: pm.middleName,
                    email: pm.email,
                    phone: pm.phone,
                    isProjectManager: true,
                    isActive: true
                }
            });
            personMapping[pm.id] = person.id;
            console.log(`   ✓ ${pm.lastName} ${pm.firstName} -> Person ID: ${person.id}`);
        }

        // 2. Обновление связей в Project
        console.log('\n2️⃣ Обновление проектов...');
        const projects = await prisma.project.findMany();
        for (const project of projects) {
            if (project.managerId && personMapping[project.managerId]) {
                await prisma.project.update({
                    where: { id: project.id },
                    data: { projectManagerId: personMapping[project.managerId] }
                });
                console.log(`   ✓ Проект "${project.name}" обновлен`);
            }
        }

        // 3. Миграция Contractor -> Counterparty
        console.log('\n3️⃣ Миграция Contractor -> Counterparty...');
        const contractors = await prisma.contractor.findMany();
        
        const counterpartyMapping = {};
        for (const contractor of contractors) {
            const counterparty = await prisma.counterparty.create({
                data: {
                    name: contractor.name,
                    contactName: contractor.contactName,
                    phone: contractor.phone,
                    email: contractor.email,
                    isContractor: true,
                    isActive: contractor.isActive
                }
            });
            counterpartyMapping[contractor.id] = counterparty.id;
            console.log(`   ✓ ${contractor.name} -> Counterparty ID: ${counterparty.id}`);
        }

        // 4. Обновление связей в WorkStage
        console.log('\n4️⃣ Обновление этапов работ...');
        const workStages = await prisma.workStage.findMany();
        for (const stage of workStages) {
            if (stage.assigneeId && counterpartyMapping[stage.assigneeId]) {
                await prisma.workStage.update({
                    where: { id: stage.id },
                    data: { assigneeId: counterpartyMapping[stage.assigneeId] }
                });
            }
        }
        console.log(`   ✓ Обновлено ${workStages.length} этапов работ`);

        // 5. Миграция WorkType -> NomenclatureItem
        console.log('\n5️⃣ Миграция WorkType -> NomenclatureItem...');
        const workTypes = await prisma.workType.findMany();
        
        const workTypeMapping = {};
        for (const workType of workTypes) {
            const nomenclatureItem = await prisma.nomenclatureItem.create({
                data: {
                    name: workType.name,
                    description: workType.description,
                    type: 'Work',
                }
            });
            workTypeMapping[workType.id] = nomenclatureItem.id;
            console.log(`   ✓ ${workType.name} -> NomenclatureItem ID: ${nomenclatureItem.id}`);
        }

        // 6. Обновление workTypeId -> nomenclatureItemId в WorkStage
        console.log('\n6️⃣ Обновление связи WorkStage с номенклатурой...');
        for (const stage of workStages) {
            if (stage.workTypeId && workTypeMapping[stage.workTypeId]) {
                // Если уже есть nomenclatureItemId, не перезаписываем
                if (!stage.nomenclatureItemId) {
                    await prisma.workStage.update({
                        where: { id: stage.id },
                        data: { nomenclatureItemId: workTypeMapping[stage.workTypeId] }
                    });
                }
            }
        }
        console.log(`   ✓ Связи обновлены`);

        console.log('\n✅ Миграция завершена успешно!');
        console.log('\n📊 Статистика:');
        console.log(`   - РП -> Person: ${Object.keys(personMapping).length}`);
        console.log(`   - Contractor -> Counterparty: ${Object.keys(counterpartyMapping).length}`);
        console.log(`   - WorkType -> NomenclatureItem: ${Object.keys(workTypeMapping).length}`);

    } catch (error) {
        console.error('\n❌ Ошибка миграции:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrate();

