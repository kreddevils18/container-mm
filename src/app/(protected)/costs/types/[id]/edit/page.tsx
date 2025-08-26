import type { ReactElement } from "react";
import { getCostType } from "@/services/cost-types";
import { CostTypeEditForm } from "@/components/cost-types/cost-type-edit-form";
import { PageHeader } from "@/components/common/page-header";
import {
  DetailErrorState,
} from "@/components/common/detail-views";
import { Tag } from "lucide-react";
import { dbLogger as logger } from "@/lib/logger";

interface EditCostTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCostTypePage({
  params,
}: EditCostTypePageProps): Promise<ReactElement> {
  const { id } = await params;

  if (!id) {
    return (
      <DetailErrorState
        title="Không tìm thấy loại chi phí"
        description="ID loại chi phí không hợp lệ"
        backHref="/costs/types"
        entityName="loại chi phí"
        icon={Tag}
        cardMessage="ID loại chi phí không hợp lệ."
      />
    );
  }

  try {
    const costType = await getCostType(id);

    return (
      <div className="container mx-auto py-6 max-w-2xl space-y-6">
        <PageHeader
          title="Chỉnh sửa loại chi phí"
          description={`Cập nhật thông tin cho ${costType.name}`}
          backButton={{
            href: `/costs/types/${costType.id}`,
            label: "Quay lại",
          }}
        />

        <CostTypeEditForm costType={costType} costTypeId={id} />
      </div>
    );
  } catch (error) {
    logger.error("Error loading cost type for edit", { error, id });
    
    return (
      <DetailErrorState
        title="Không tìm thấy loại chi phí"
        description="Loại chi phí không tồn tại hoặc đã bị xóa"
        backHref="/costs/types"
        entityName="loại chi phí"
        icon={Tag}
        cardMessage="Không tìm thấy loại chi phí."
      />
    );
  }
}