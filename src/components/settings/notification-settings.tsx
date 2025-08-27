"use client";

import { Bell, Mail, Settings, AlertCircle, Megaphone } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

/**
 * Notification Settings Component
 *
 * Allows users to configure their notification preferences for various types of updates
 * including email notifications, order updates, system alerts, and marketing communications.
 *
 * @component
 * @example
 * ```tsx
 * <NotificationSettings />
 * ```
 */
export const NotificationSettings = (): ReactElement => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderUpdates: true,
    systemNotifications: true,
    maintenanceAlerts: false,
    marketingEmails: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof typeof notifications): void => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      // Simulate API call - in real implementation, this would call an action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Cài đặt thông báo đã được cập nhật thành công!");
    } catch (_error) {
      toast.error("Có lỗi xảy ra khi cập nhật cài đặt thông báo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Cài đặt thông báo</h2>
        <p className="text-gray-600">
          Tùy chỉnh cách bạn nhận thông báo về các hoạt động trong hệ thống
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Thông báo qua email
            </CardTitle>
            <CardDescription>
              Nhận thông báo quan trọng qua địa chỉ email của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Bật thông báo email</Label>
                <p className="text-sm text-gray-500">
                  Nhận tất cả thông báo qua email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Thông báo đơn hàng
            </CardTitle>
            <CardDescription>
              Cập nhật về trạng thái và thay đổi đơn hàng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-updates">Cập nhật đơn hàng</Label>
                <p className="text-sm text-gray-500">
                  Thông báo khi có cập nhật về đơn hàng
                </p>
              </div>
              <Switch
                id="order-updates"
                checked={notifications.orderUpdates}
                onCheckedChange={() => handleToggle('orderUpdates')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Thông báo hệ thống
            </CardTitle>
            <CardDescription>
              Cảnh báo bảo mật và thông tin quan trọng từ hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-notifications">Thông báo hệ thống</Label>
                <p className="text-sm text-gray-500">
                  Cảnh báo bảo mật và cập nhật hệ thống
                </p>
              </div>
              <Switch
                id="system-notifications"
                checked={notifications.systemNotifications}
                onCheckedChange={() => handleToggle('systemNotifications')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance-alerts">Cảnh báo bảo trì</Label>
                <p className="text-sm text-gray-500">
                  Thông báo về lịch bảo trì hệ thống
                </p>
              </div>
              <Switch
                id="maintenance-alerts"
                checked={notifications.maintenanceAlerts}
                onCheckedChange={() => handleToggle('maintenanceAlerts')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Email tiếp thị
            </CardTitle>
            <CardDescription>
              Tin tức, cập nhật tính năng và ưu đãi đặc biệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails">Email tiếp thị</Label>
                <p className="text-sm text-gray-500">
                  Nhận thông tin về tính năng mới và ưu đãi
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={notifications.marketingEmails}
                onCheckedChange={() => handleToggle('marketingEmails')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu cài đặt thông báo"}
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Bạn có thể thay đổi cài đặt này bất cứ lúc nào</p>
        <p>• Một số thông báo bảo mật quan trọng sẽ luôn được gửi</p>
        <p>• Email tiếp thị có thể được hủy đăng ký trong email nhận được</p>
      </div>
    </div>
  );
};