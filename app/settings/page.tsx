import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SettingsPage from "@/components/settings/SettingsPage";

export default function Settings() {
  return (
    <MainLayout>
      <Suspense>
        <SettingsPage />
      </Suspense>
    </MainLayout>
  );
}
