import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Header } from "@/components/navigation/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Vận tải Container",
  description: "Hệ thống quản lý vận tải container cho doanh nghiệp",
};

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) redirect("login");

  return (
    <div className="space-y-8">
      <SessionProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <Header />
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-4 overflow-hidden">
              <main className="min-h-0 flex-1 overflow-auto">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SessionProvider>
    </div>
  );
}
