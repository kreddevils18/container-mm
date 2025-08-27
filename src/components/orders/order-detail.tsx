"use client";

import {
    Anchor,
    Calendar,
    CalendarClock,
    DollarSign,
    FileText,
    Fuel,
    Hash,
    Info,
    MapPin,
    Package,
    Truck,
    User,
    UserCheck,
} from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { CostSection } from "@/components/costs/cost-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/drizzle/schema";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderStatusHistory } from "./order-status-history";

interface Cost {
    id: string;
    costTypeId: string;
    costTypeName: string;
    costTypeCategory: "vehicle" | "order";
    orderId: string | null;
    vehicleId: string | null;
    amount: string;
    costDate: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface CostType {
    id: string;
    name: string;
    description: string | null;
    category: string;
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
}

interface OrderDetailProps {
    order: Order & {
        customerName?: string | null;
        emptyPickupVehicleLabel?: string | null;
        emptyPickupDriverName?: string | null;
        deliveryVehicleLabel?: string | null;
        deliveryDriverName?: string | null;
        statusHistory?: Array<{
            id: string;
            previousStatus: string | null;
            newStatus: string;
            changedBy: string | null;
            changedByName: string | null;
            changedAt: Date;
        }>;
        costs?: Cost[];
        containers?: Array<{
            containerType: "D2" | "D4" | "R2" | "R4";
            quantity: number;
        }>;
    };
    costTypes: CostType[];
}

function fmtDateTime(input?: Date | string | null) {
    if (!input) return null;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fmtMoneyVND(value?: string | number | null) {
    if (value == null) return null;
    const n = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(n)) return `${value} ₫`;
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(n);
}

export function OrderDetail({
    order,
    costTypes,
}: OrderDetailProps): ReactElement {
    const [orderCosts, setOrderCosts] = useState<Cost[]>(order.costs || []);
    const [isLoadingCosts, setIsLoadingCosts] = useState(false);
    const emptyPickupDate = fmtDateTime(order.emptyPickupDate);
    const deliveryDate = fmtDateTime(order.deliveryDate);
    const price = fmtMoneyVND(order.price);
    const handleCostCreated = async (): Promise<void> => {
        setIsLoadingCosts(true);
        try {
            const response = await fetch(`/api/orders/${order.id}/costs`);
            if (response.ok) {
                const result = await response.json();
                setOrderCosts(result.data.costs);
            }
        } catch {
            // Error handling is managed by the cost components
        } finally {
            setIsLoadingCosts(false);
        }
    };


    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Thông tin đơn hàng
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                                Mã đơn hàng (UUID)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{order.customerId}</p>
                            <p className="text-sm text-muted-foreground">
                                Khách hàng{order.customerName ? `: ${order.customerName}` : ""}
                            </p>
                        </div>
                    </div>

                    {order.containerCode && (
                        <div className="flex items-center gap-3">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{order.containerCode}</p>
                                <p className="text-sm text-muted-foreground">Mã container</p>
                            </div>
                        </div>
                    )}

                    {order.shippingLine && (
                        <div className="flex items-center gap-3">
                            <Anchor className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{order.shippingLine}</p>
                                <p className="text-sm text-muted-foreground">Hãng tàu</p>
                            </div>
                        </div>
                    )}

                    {order.bookingNumber && (
                        <div className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{order.bookingNumber}</p>
                                <p className="text-sm text-muted-foreground">Số Booking</p>
                            </div>
                        </div>
                    )}

                    {order.oilQuantity && (
                        <div className="flex items-center gap-3">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{order.oilQuantity} lít</p>
                                <p className="text-sm text-muted-foreground">Dầu</p>
                            </div>
                        </div>
                    )}

                    {order.containers && order.containers.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">Container</p>
                            <div className="flex items-start gap-3">
                                <Package className="h-4 w-4 text-muted-foreground mt-1" />
                                <div>
                                    <div className="space-y-1">
                                        {order.containers.map((container) => (
                                            <p key={container.containerType} className="font-medium">
                                                {container.containerType}: {container.quantity} containers
                                            </p>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Loại và số lượng container
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(order.emptyPickupVehicleId ||
                        order.emptyPickupDate ||
                        order.emptyPickupStart ||
                        order.emptyPickupEnd) && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Lịch lấy container rỗng</p>

                                {order.emptyPickupVehicleId && (
                                    <div className="flex items-center gap-3">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{order.emptyPickupVehicleId}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Xe lấy rỗng
                                                {order.emptyPickupVehicleLabel
                                                    ? `: ${order.emptyPickupVehicleLabel}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {order.emptyPickupDriverName && (
                                    <div className="flex items-center gap-3">
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{order.emptyPickupDriverName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Tài xế kéo về
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {emptyPickupDate && (
                                    <div className="flex items-center gap-3">
                                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{emptyPickupDate}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Ngày/giờ lấy rỗng
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(order.emptyPickupStart || order.emptyPickupEnd) && (
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">
                                                {order.emptyPickupStart ?? "—"}
                                                {order.emptyPickupEnd ? ` → ${order.emptyPickupEnd}` : ""}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Lộ trình (điểm lấy → bãi/điểm kết thúc)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {(order.deliveryVehicleId ||
                        order.deliveryDate ||
                        order.deliveryStart ||
                        order.deliveryEnd) && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Lịch giao hàng</p>

                                {order.deliveryVehicleId && (
                                    <div className="flex items-center gap-3">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{order.deliveryVehicleId}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Xe giao
                                                {order.deliveryVehicleLabel
                                                    ? `: ${order.deliveryVehicleLabel}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {order.deliveryDriverName && (
                                    <div className="flex items-center gap-3">
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{order.deliveryDriverName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Tài xế kéo đi
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {deliveryDate && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{deliveryDate}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Ngày/giờ giao
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(order.deliveryStart || order.deliveryEnd) && (
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">
                                                {order.deliveryStart ?? "—"}
                                                {order.deliveryEnd ? ` → ${order.deliveryEnd}` : ""}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Lộ trình giao (điểm lấy → điểm giao)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {price && (
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{price}</p>
                                <p className="text-sm text-muted-foreground">
                                    Giá trị đơn hàng
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <OrderStatusBadge status={order.status} />
                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                        </div>
                    </div>

                    {order.description && (
                        <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="font-medium whitespace-pre-wrap">
                                    {order.description}
                                </p>
                                <p className="text-sm text-muted-foreground">Mô tả</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {order.statusHistory && order.statusHistory.length > 0 && (
                <OrderStatusHistory statusHistory={order.statusHistory} />
            )}

            <CostSection
                title="Chi phí đơn hàng"
                entityId={order.id}
                entityType="order"
                costs={orderCosts}
                costTypes={costTypes}
                allowEditing={true}
                showCreateButton={true}
                isLoading={isLoadingCosts}
                onCostChange={handleCostCreated}
            />
        </div>
    );
}
