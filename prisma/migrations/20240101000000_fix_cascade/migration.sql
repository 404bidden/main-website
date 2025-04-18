-- Drop the existing foreign key constraint
ALTER TABLE "RequestLog" DROP CONSTRAINT "RequestLog_routeId_fkey";

-- Recreate the foreign key constraint with CASCADE
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_routeId_fkey" 
FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE; 