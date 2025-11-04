-- Добавление внешнего ключа между ProjectProductSpecificationList.projectproductId и ProjectProduct.id
ALTER TABLE "ProjectProductSpecificationList" 
ADD CONSTRAINT "ProjectProductSpecificationList_projectproductId_fkey" 
FOREIGN KEY ("projectproductId") 
REFERENCES "ProjectProduct"("id") 
ON DELETE CASCADE;

