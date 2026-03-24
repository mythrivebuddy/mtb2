"use client";


import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponScope } from "@/types/client/coupons.types";



type ActiveTab = "ALL" | CouponScope;

type Props = {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
};

export default function CouponTabs({ activeTab, setActiveTab }: Props) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ActiveTab)}
      className="px-6 pt-6 flex justify-self-center"
    >
      <TabsList>
        <TabsTrigger value="ALL">All</TabsTrigger>
        <TabsTrigger value="CHALLENGE">Challenges</TabsTrigger>
        <TabsTrigger value="MMP_PROGRAM">MMP</TabsTrigger>
        <TabsTrigger value="STORE_PRODUCT">Store</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}