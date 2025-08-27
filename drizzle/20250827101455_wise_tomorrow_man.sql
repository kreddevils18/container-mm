CREATE TYPE "public"."container_type" AS ENUM('D2', 'D4', 'R2', 'R4');--> statement-breakpoint
CREATE TABLE "order_containers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"container_type" "container_type" NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_line" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "booking_number" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "oil_quantity" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_containers" ADD CONSTRAINT "order_containers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;