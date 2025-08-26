import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { SettingsTabs } from "@/components/settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { settingsLogger } from "@/lib/logger";
import { getUserProfile } from "@/services/users";

export const metadata: Metadata = {
  title: "Cài đặt tài khoản - Hệ thống Quản lý Vận tải Container",
  description: "Quản lý thông tin cá nhân, bảo mật và cài đặt tài khoản",
};

function AuthErrorComponent(): React.ReactElement {
  return (
    <div className="container mx-auto py-6 px-4">
      <Alert className="max-w-md mx-auto">
        <AlertDescription>
          Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại để truy cập trang
          cài đặt.
        </AlertDescription>
      </Alert>
      <div className="flex justify-center mt-4">
        <Link href="/login">
          <Button>Đăng nhập</Button>
        </Link>
      </div>
    </div>
  );
}

function ProfileErrorComponent({
  userId,
}: {
  userId: string;
}): React.ReactElement {
  return (
    <div className="container mx-auto py-6 px-4">
      <Alert className="max-w-md mx-auto">
        <AlertDescription>
          Không tìm thấy thông tin người dùng. Vui lòng liên hệ quản trị viên.
        </AlertDescription>
      </Alert>
      <div className="flex justify-center mt-4 space-x-2">
        <Link href="/dashboard">
          <Button variant="outline">Về trang chính</Button>
        </Link>
        <Link href="/login">
          <Button>Đăng nhập lại</Button>
        </Link>
      </div>
      <div className="text-center mt-2 text-sm text-gray-500">
        User ID: {userId}
      </div>
    </div>
  );
}

export default async function SettingsPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    settingsLogger.error("No valid session or user ID - showing auth error");
    return <AuthErrorComponent />;
  }

  settingsLogger.debug("Fetching user profile", { userId: session.user.id });

  try {
    const userProfile = await getUserProfile(
      session.user.id as import("@/schemas/user").UserId
    );
    settingsLogger.debug("User profile query result", {
      profileFound: !!userProfile,
      userId: session.user.id,
    });

    if (!userProfile) {
      settingsLogger.error("No user profile found - showing profile error", {
        userId: session.user.id,
      });
      return <ProfileErrorComponent userId={session.user.id} />;
    }

    settingsLogger.info("Successfully loaded settings page", {
      userId: session.user.id,
    });
    return (
      <div className="container mx-auto py-6 px-4">
        <SettingsTabs userProfile={userProfile} />
      </div>
    );
  } catch (error) {
    settingsLogger.logError(error, "Exception in settings page");
    return <ProfileErrorComponent userId={session.user.id} />;
  }
}
