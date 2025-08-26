"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { type ReactElement, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  type UpdateProfileActionState,
  updateProfileAction,
} from "@/app/(protected)/settings/updateProfileAction";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  type UpdateUserProfileRequest,
  UpdateUserProfileRequestSchema,
  type UserProfile,
} from "@/schemas/user";

interface ProfileFormProps {
  userProfile: UserProfile;
}

export const ProfileForm = ({
  userProfile,
}: ProfileFormProps): ReactElement => {
  const initialState: UpdateProfileActionState = {};
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState
  );

  const form = useForm<UpdateUserProfileRequest>({
    resolver: zodResolver(UpdateUserProfileRequestSchema),
    defaultValues: {
      name: userProfile.name || "",
      email: userProfile.email || "",
      username: userProfile.username || "",
      image: userProfile.image || "",
    },
  });

  // Handle server-side validation errors
  useEffect(() => {
    if (state.fieldErrors) {
      Object.entries(state.fieldErrors).forEach(([field, errors]) => {
        if (errors && errors.length > 0) {
          form.setError(field as keyof UpdateUserProfileRequest, {
            message: errors[0],
          });
        }
      });
    }
  }, [state.fieldErrors, form]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
        <p className="text-gray-600">
          Cập nhật thông tin cá nhân và cài đặt tài khoản của bạn
        </p>
      </div>

      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            Thông tin đã được cập nhật thành công!
          </p>
        </div>
      )}

      <Form {...form}>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập họ và tên"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập tên đăng nhập"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {!userProfile.emailVerified && (
                  <p className="text-xs text-amber-600">
                    Email chưa được xác minh
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL hình ảnh (tùy chọn)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500">
                  URL của ảnh đại diện (để trống nếu không muốn thay đổi)
                </p>
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
