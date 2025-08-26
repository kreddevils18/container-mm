"use client";

import type { ReactElement } from "react";
import {
  dashboardConfig,
  type IconName,
  iconMapping,
} from "./dashboard-config";
import { QuickActionButton } from "./quick-action-button";
import { QuickActionCategory } from "./quick-action-category";

const renderIcon = (iconName: string): ReactElement => {
  const IconComponent = iconMapping[iconName as IconName];

  if (!IconComponent) {
    const FallbackIcon = iconMapping.Package;
    return <FallbackIcon className="h-6 w-6" />;
  }

  return <IconComponent className="h-6 w-6" />;
};

export const QuickActionsSection = (): ReactElement => {
  return (
    <div className="space-y-12">
      <QuickActionCategory
        title="Danh sách"
        description="Xem và quản lý dữ liệu hiện có trong hệ thống"
      >
        {dashboardConfig.lists.map((action) => (
          <QuickActionButton
            key={action.id}
            title={action.title}
            {...(action.description && { description: action.description })}
            href={action.href}
            icon={renderIcon(action.icon)}
          />
        ))}
      </QuickActionCategory>

      <QuickActionCategory
        title="Tạo mới"
        description="Thêm dữ liệu mới vào hệ thống"
      >
        {dashboardConfig.creates.map((action) => (
          <QuickActionButton
            key={action.id}
            title={action.title}
            {...(action.description && { description: action.description })}
            href={action.href}
            icon={renderIcon(action.icon)}
          />
        ))}
      </QuickActionCategory>
    </div>
  );
};
