"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AppearanceSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && resolvedTheme === "dark";

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-lg text-slate-950 dark:text-slate-50">
          Appearance
        </CardTitle>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your dashboard appearance preferences.
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex gap-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Label
              htmlFor="dark-mode-toggle"
              className="text-base font-medium text-slate-950 dark:text-slate-50"
            >
              Switch to {isDarkMode ? "Light mode" : "Dark mode"}
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-600 dark:text-slate-300"
              onClick={() => setTheme("light")}
            >
              <Sun size={18} />
            </Button>

            <Switch
              id="dark-mode-toggle"
              checked={isDarkMode}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-600 dark:text-slate-300"
              onClick={() => setTheme("dark")}
            >
              <Moon size={18} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
