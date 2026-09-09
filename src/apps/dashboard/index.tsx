import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Main } from "@/components/layout/main";
import { ChartBarInteractive } from "./components/chart-bar-interactive";
import { ChartPieDonutText } from "./components/chart-radial-shape";
import { SectionCards } from "./components/section-cards";
import { ChartBarMultiple } from "./components/chart-bar-multiple";
import { ChartRadarLinesOnly } from "./components/chart-radar-lines";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export function Dashboard() {
    const { t } = useTranslation();

  return (
    <Main>
      <div className="mb-2 flex items-center  space-x-2">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <IconLayoutDashboard className="size-5" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
      </div>
      <Tabs
        orientation="vertical"
        defaultValue="overview"
        className="mt-6 space-y-4"
      >
        {/*  <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
        </div> */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SectionCards />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
            <ChartBarInteractive />
            <ChartPieDonutText />
          </div>

          <div className="grid grid-cols-6 gap-5 lg:grid-cols-12">
            <ChartRadarLinesOnly />
            <ChartBarMultiple />
          </div>
        </TabsContent>
      </Tabs>
    </Main>
  );
}

const topNav = [
  {
    title: "Overview",
    href: "dashboard/overview",
    isActive: true,
    disabled: false,
  },
  {
    title: "Customers",
    href: "dashboard/customers",
    isActive: false,
    disabled: true,
  },
  {
    title: "Products",
    href: "dashboard/products",
    isActive: false,
    disabled: true,
  },
  {
    title: "Settings",
    href: "dashboard/settings",
    isActive: false,
    disabled: true,
  },
];
