"use client";

import { Bell, Lock, Settings, User } from "lucide-react";
import type { ReactElement } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserProfile } from "@/schemas/user";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

interface SettingsTabsProps {
  userProfile: UserProfile;
}

export const SettingsTabs = ({
  userProfile,
}: SettingsTabsProps): ReactElement => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cài đặt tài khoản
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin và bảo mật tài khoản của bạn
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger
            value="change-password"
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Đổi mật khẩu
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Thông báo
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bảo mật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="p-8 bg-white rounded-lg border">
            <ProfileForm userProfile={userProfile} />
          </div>
        </TabsContent>

        <TabsContent value="change-password" className="mt-6">
          <div className="p-8 bg-white rounded-lg border">
            <ChangePasswordForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
