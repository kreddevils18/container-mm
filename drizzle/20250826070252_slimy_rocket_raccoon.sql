ALTER TABLE "orders" DROP CONSTRAINT "orders_driver_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "driver_id";