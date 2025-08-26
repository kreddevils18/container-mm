import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/common/page-header";
import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { getVehicle } from "@/services/vehicles";
import { getCostTypes } from "@/services/cost-types";

interface VehicleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const vehicle = await getVehicle(id);
    if (!vehicle) {
      return {
        title: "Khách hàng không tồn tại | Container MM",
        description:
          "Không tìm thấy thông tin khách hàng trong hệ thống quản lý vận tải Container MM.",
        robots: { index: false, follow: false },
      };
    }

    return {
      title: `${vehicle.licensePlate} - Chi tiết phương tiện | Container MM`,
      description: `Thông tin chi tiết của phương tiện ${vehicle.licensePlate}. Hệ thống quản lý vận tải Container MM.`,
      keywords: [
        "phương tiện",
        "xe tải",
        vehicle.licensePlate,
        "vận tải",
        "container",
        "logistics",
        "quản lý phương tiện",
      ],
      openGraph: {
        title: `${vehicle.licensePlate} - Container MM`,
        description: `Thông tin phương tiện: ${vehicle.licensePlate}`,
        type: "website",
        locale: "vi_VN",
      },
      twitter: {
        card: "summary",
        title: `${vehicle.licensePlate} - Container MM`,
        description: `Thông tin phương tiện: ${vehicle.licensePlate}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch (_error) {
    return {
      title: "Phương tiện không tồn tại | Container MM",
      description:
        "Không tìm thấy thông tin phương tiện trong hệ thống quản lý vận tải Container MM.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps): Promise<ReactElement> {
  const { id } = await params;

  try {
    const [vehicle, costTypesResult] = await Promise.all([
      getVehicle(id),
      getCostTypes({ category: ["vehicle"], status: ["active"], per_page: 100 })
    ]);
    
    if (!vehicle) notFound();

    return (
      <div className="container mx-auto py-6 max-w-4xl space-y-6">
        <PageHeader
          title={`${vehicle.licensePlate}`}
          description="Chi tiết thông tin phương tiện"
          backButton={{
            href: "/vehicles",
            label: "Quay lại",
          }}
        />

        <VehicleDetail 
          vehicle={vehicle} 
          costTypes={costTypesResult.rows}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Vehicle not found") {
      notFound();
    }
    throw error;
  }
}
