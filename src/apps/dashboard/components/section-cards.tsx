import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SectionCards() {
  const { t } = useTranslation();
  
  return (
    <>
      <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02]  hover:bg-chart-3/10   hover:shadow-md  dark:hover:bg-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
          <div className="bg-chart-3/10 text-chart-3 flex h-8 w-8 items-center justify-center rounded-full dark:bg-chart-3/15">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-muted-foreground text-xs mt-1">
            <span className="text-emerald-500"> +20.1% </span>
            &nbsp;{t('from_last_month')}
          </p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:bg-chart-1/10 hover:shadow-md  dark:hover:bg-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('subscriptions')}</CardTitle>

          <div className="bg-chart-1/10 text-chart-1 flex h-8 w-8 items-center justify-center rounded-full dark:bg-chart-1/15">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2350</div>
          <p className="text-muted-foreground text-xs mt-1">
            <span className="text-emerald-500">+180.1%</span>&nbsp; {t('from_last_month')}
          </p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:bg-chart-2/10  hover:shadow-md  dark:hover:bg-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('sales')}</CardTitle>

          <div className="bg-chart-2/10 text-chart-2 flex h-8 w-8 items-center justify-center rounded-full dark:bg-chart-2/15">
            <CreditCard className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12,234</div>

          <p className="text-muted-foreground text-xs mt-1">
            <span className="text-emerald-500">+19%</span>&nbsp; {t('from_last_month')}
          </p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:bg-chart-4/10 hover:shadow-md  dark:hover:bg-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('active_now')}</CardTitle>
          <div className="bg-chart-4/10 text-chart-4 flex h-8 w-8 items-center justify-center rounded-full dark:bg-chart-4/15">
            <Activity className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>

          <p className="text-muted-foreground text-xs mt-1">
            <span className="text-emerald-500">+201</span>&nbsp; {t('since_last_hour')}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
