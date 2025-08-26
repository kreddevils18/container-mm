"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useState, useEffect, useId } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type RegisterActionState } from "@/app/(auth)/action";

function SubmitButton(): ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
    </Button>
  );
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">): ReactElement {
  const initialState: RegisterActionState = { success: false };
  const [state, formAction] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const usernameId = useId();
  const emailId = useId();
  const nameId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success("Tài khoản đã được tạo thành công!");
    }
  }, [state]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản mới</CardTitle>
          <CardDescription>
            Nhập thông tin bên dưới để tạo tài khoản cho hệ thống quản lý vận tải
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor={usernameId}>Tên đăng nhập</Label>
                <Input
                  id={usernameId}
                  name="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  required
                />
                {state?.fieldErrors?.username && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.username[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={emailId}>Email</Label>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
                {state?.fieldErrors?.email && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={nameId}>Tên</Label>
                <Input
                  id={nameId}
                  name="name"
                  type="text"
                  placeholder="Nhập tên của bạn"
                  autoComplete="name"
                  required
                />
                {state?.fieldErrors?.name && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.name[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={passwordId}>Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    autoComplete="new-password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {state?.fieldErrors?.password && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={confirmPasswordId}>Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id={confirmPasswordId}
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {state?.fieldErrors?.confirm_password && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.confirm_password[0]}
                  </p>
                )}
              </div>

              {state?.error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {state.error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <SubmitButton />
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}