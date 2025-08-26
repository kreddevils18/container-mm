import type { ReactElement } from "react";
import { getCostType } from "@/services/cost-types";
import { CostTypeDetail } from "@/components/cost-types/cost-type-detail";
import {
  DetailErrorState,
} from "@/components/common/detail-views";
import { Tag } from "lucide-react";
import { dbLogger as logger } from "@/lib/logger";

interface CostTypeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CostTypeDetailPage({
  params,
}: CostTypeDetailPageProps): Promise<ReactElement> {
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

    return <CostTypeDetail costType={costType} />;
  } catch (error) {
    logger.error("Error loading cost type", { error, id });
    
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