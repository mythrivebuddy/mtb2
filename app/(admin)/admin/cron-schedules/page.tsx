"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Loader2, Save, SaveAll } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  formatCronKeyLabel,
  formatCronTimePreview,
  type CronScheduleKey,
} from "@/lib/cron/constants";
import { cronScheduleUpdateSchema } from "@/lib/cron/validation";
import { getAxiosErrorMessage } from "@/utils/ax";

type CronSchedule = {
  id: string | null;
  key: CronScheduleKey;
  hour: number;
  minute: number;
  updatedAt: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const CRON_SCHEDULES_QUERY_KEY = ["admin", "cron-schedules"] as const;

const cronSchedulesFormSchema = z.object({
  schedules: z.record(cronScheduleUpdateSchema),
});

type CronSchedulesFormValues = z.infer<typeof cronSchedulesFormSchema>;

type SaveCronScheduleVariables = {
  key: CronScheduleKey;
  values: CronSchedulesFormValues["schedules"][CronScheduleKey];
};



function buildFormValues(schedules: CronSchedule[]): CronSchedulesFormValues {
  return {
    schedules: schedules.reduce<CronSchedulesFormValues["schedules"]>(
      (values, schedule) => {
        values[schedule.key] = {
          hour: schedule.hour,
          minute: schedule.minute,
        };

        return values;
      },
      {},
    ),
  };
}

function getChangedKeys(
  schedules: CronSchedule[],
  values: CronSchedulesFormValues,
): CronScheduleKey[] {
  return schedules
    .filter((schedule) => {
      const value = values.schedules[schedule.key];

      return (
        value &&
        (Number(value.hour) !== schedule.hour ||
          Number(value.minute) !== schedule.minute)
      );
    })
    .map((schedule) => schedule.key);
}

async function getCronSchedules() {
  const response = await axios.get<ApiResponse<CronSchedule[]>>(
    "/api/admin/cron-schedules",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message ?? "Cron schedules could not be loaded",
    );
  }

  return response.data.data;
}

async function saveCronSchedule({ key, values }: SaveCronScheduleVariables) {
  const response = await axios.put<ApiResponse<CronSchedule>>(
    `/api/admin/cron-schedules/${key}`,
    values,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message ?? "Cron schedule was not saved");
  }

  return response.data.data;
}

function CronScheduleRow({
  schedule,
  form,
  isSaving,
  isSaveAllRunning,
  onSaveOne,
}: {
  schedule: CronSchedule;
  form: UseFormReturn<CronSchedulesFormValues>;
  isSaving: boolean;
  isSaveAllRunning: boolean;
  onSaveOne: (key: CronScheduleKey) => void;
}) {
  const hour = form.watch(`schedules.${schedule.key}.hour`);
  const minute = form.watch(`schedules.${schedule.key}.minute`);
  const timePreview = useMemo(
    () => formatCronTimePreview(Number(hour), Number(minute)),
    [hour, minute],
  );

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-foreground">
          {formatCronKeyLabel(schedule.key)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{schedule.key}</div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <FormField
            control={form.control}
            name={`schedules.${schedule.key}.hour`}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    step={1}
                    inputMode="numeric"
                    disabled={isSaving || isSaveAllRunning}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`schedules.${schedule.key}.minute`}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    step={1}
                    inputMode="numeric"
                    disabled={isSaving || isSaveAllRunning}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{timePreview}</TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          onClick={() => onSaveOne(schedule.key)}
          disabled={isSaving || isSaveAllRunning}
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function CronSchedulesPage() {
  const queryClient = useQueryClient();
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [savingKey, setSavingKey] = useState<CronScheduleKey | null>(null);

  const form = useForm<CronSchedulesFormValues>({
    resolver: zodResolver(cronSchedulesFormSchema),
    defaultValues: {
      schedules: {},
    },
    mode: "onChange",
  });

  const schedulesQuery = useQuery<CronSchedule[], AxiosError<ApiErrorResponse>>(
    {
      queryKey: CRON_SCHEDULES_QUERY_KEY,
      queryFn: getCronSchedules,
    },
  );

  const saveOneMutation = useMutation<
    CronSchedule,
    AxiosError<ApiErrorResponse>,
    SaveCronScheduleVariables
  >({
    mutationFn: saveCronSchedule,
    onSuccess: (updatedSchedule) => {
      applySavedSchedules([updatedSchedule]);
      queryClient.setQueryData<CronSchedule[]>(
        CRON_SCHEDULES_QUERY_KEY,
        (currentSchedules = []) =>
          currentSchedules.map((schedule) =>
            schedule.key === updatedSchedule.key ? updatedSchedule : schedule,
          ),
      );
    },
  });

  const saveAllMutation = useMutation<
    CronSchedule[],
    AxiosError<ApiErrorResponse>,
    SaveCronScheduleVariables[]
  >({
    mutationFn: async (changes) => Promise.all(changes.map(saveCronSchedule)),
    onSuccess: (updatedSchedules) => {
      applySavedSchedules(updatedSchedules);
      queryClient.setQueryData<CronSchedule[]>(
        CRON_SCHEDULES_QUERY_KEY,
        (currentSchedules = []) => {
          const updatedByKey = new Map(
            updatedSchedules.map((schedule) => [schedule.key, schedule]),
          );

          return currentSchedules.map(
            (schedule) => updatedByKey.get(schedule.key) ?? schedule,
          );
        },
      );
    },
  });

  const watchedValues = form.watch();
  const changedKeys = useMemo(
    () => getChangedKeys(schedules, watchedValues),
    [schedules, watchedValues],
  );
  const hasChanges = changedKeys.length > 0;
  const isSaveAllRunning = saveAllMutation.isPending;
  const isBusy = saveOneMutation.isPending || isSaveAllRunning;

  useEffect(() => {
    if (!schedulesQuery.data) {
      return;
    }

    setSchedules(schedulesQuery.data);
    form.reset(buildFormValues(schedulesQuery.data));
  }, [form, schedulesQuery.data]);

  function applySavedSchedules(updatedSchedules: CronSchedule[]) {
    setSchedules((currentSchedules) => {
      const updatedByKey = new Map(
        updatedSchedules.map((schedule) => [schedule.key, schedule]),
      );
      const nextSchedules = currentSchedules.map(
        (schedule) => updatedByKey.get(schedule.key) ?? schedule,
      );

      form.reset(buildFormValues(nextSchedules));

      return nextSchedules;
    });
  }

  async function handleSaveOne(key: CronScheduleKey) {
    const isValid = await form.trigger(`schedules.${key}`);

    if (!isValid) {
      return;
    }

    setSavingKey(key);

    try {
      const values = form.getValues(`schedules.${key}`);
     await saveOneMutation.mutateAsync({
        key,
        values,
      });

      toast.success("Cron schedule saved successfully");
    } catch (error) {
      
      toast.error(getAxiosErrorMessage(error));
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveAll() {
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    const values = form.getValues();
    const keysToSave = getChangedKeys(schedules, values);

    if (keysToSave.length === 0) {
      return;
    }

    try {
      await saveAllMutation.mutateAsync(
        keysToSave.map((key) => ({
          key,
          values: values.schedules[key],
        })),
      );
      toast.success("Cron schedules saved successfully");
    } catch (error) {
      toast.error(getAxiosErrorMessage(error) || "Failed to save cron schedules");
    }
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-8">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle>Cron Schedules</CardTitle>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={!hasChanges || isBusy}
          >
            {isSaveAllRunning ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SaveAll aria-hidden="true" />
            )}
            Save all
          </Button>
        </CardHeader>
        <CardContent>
          {schedulesQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading cron schedules...
            </div>
          ) : schedulesQuery.isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              {getAxiosErrorMessage(schedulesQuery.error)}
            </div>
          ) : (
            <Form {...form}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <CronScheduleRow
                      key={schedule.key}
                      schedule={schedule}
                      form={form}
                      isSaving={savingKey === schedule.key}
                      isSaveAllRunning={isSaveAllRunning}
                      onSaveOne={handleSaveOne}
                    />
                  ))}
                </TableBody>
              </Table>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
