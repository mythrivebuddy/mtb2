"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MtbBusinessProfileFormValues,
  mtbBusinessProfileSchema,
} from "@/schema/zodSchema";
import { getAxiosErrorMessage } from "@/utils/ax";

type FormValues = z.infer<typeof mtbBusinessProfileSchema>;

type BusinessProfileApiResponse = FormValues & {
  logoUrl?: string;
};

export default function AdminMtbBusinessProfilePage() {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MtbBusinessProfileFormValues>({
    resolver: zodResolver(mtbBusinessProfileSchema),
    defaultValues: {
      companyName: "",
      address: "",
      gstNumber: "",
      lutNumber: "",
      phoneNumber: "",
      email: "",
      invoiceSeries: {
        MAIN: { format: "INV-{YYYY}-{###}", lastNumber: 0 },
        COACH: { format: "COACH-{STATE}-{YYYY}-{#####}", lastNumber: 0 },
      },
    },
  });
  /* ======================
     FETCH DATA
  ====================== */

  const { data, isLoading, isError } = useQuery<BusinessProfileApiResponse>({
    queryKey: ["mtb-business-profile"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/mtb-business-profile");
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
      if (data.logoUrl) {
        setPreview(data.logoUrl);
      }
    }
  }, [data, reset]);

  /* ======================
     SAVE
  ====================== */

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();

      formData.append("companyName", values.companyName);
      formData.append("address", values.address);
      formData.append("gstNumber", values.gstNumber);
      formData.append("lutNumber", values.lutNumber);
      formData.append("phoneNumber", values.phoneNumber);
      formData.append("email", values.email);
      formData.append("invoiceSeries", JSON.stringify(values.invoiceSeries));

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await axios.post(
        "/api/admin/mtb-business-profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return res.data;
    },
    onSuccess: () => {
      toast.success("Business profile saved successfully");
      queryClient.invalidateQueries({ queryKey: ["mtb-business-profile"] });
    },
    onError: (error) => {
      const err = getAxiosErrorMessage(error);
      toast.error(err || "Failed to save profile");
    },
  });

  /* ======================
     IMAGE HANDLER
  ====================== */

  const handleImageChange = (file: File | null) => {
    setLogoError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("File must be an image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Image must be less than 2MB");
      return;
    }

    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  /* ======================
     UI STATES
  ====================== */

  if (isLoading) {
    return <div className="p-6 text-center">Loading business profile...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Failed to load profile</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">MTB Business Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input {...register("companyName")} />
                {errors.companyName && (
                  <p className="text-red-500 text-sm">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Email</Label>
                <Input {...register("email")} />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input {...register("phoneNumber")} />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label>GST Number</Label>
                <Input {...register("gstNumber")} />
                {errors.gstNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.gstNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label>LUT Number</Label>
                <Input {...register("lutNumber")} />
                {errors.lutNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.lutNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Company Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(e.target.files?.[0] || null)
                  }
                />
                {logoError && (
                  <p className="text-red-500 text-sm">{logoError}</p>
                )}
              </div>
            </div>

            {preview && (
              <div>
                <Label>Logo Preview</Label>
                <img
                  src={preview}
                  alt="logo preview"
                  className="h-24 mt-2 rounded border"
                />
              </div>
            )}

            <div>
              <Label>Address</Label>
              <Textarea {...register("address")} />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Invoice Series</h3>

              <div className="border p-4 rounded-xl space-y-2">
                <p className="font-medium">MAIN Series</p>
                <Label>Format</Label>
                <Input {...register("invoiceSeries.MAIN.format")} />
                <Label>Last Number</Label>
                <Input
                  type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                  {...register("invoiceSeries.MAIN.lastNumber")}
                />
              </div>

              <div className="border p-4 rounded-xl space-y-2">
                <p className="font-medium">COACH Series</p>
                <Label>Format</Label>
                <Input {...register("invoiceSeries.COACH.format")} />
                <Label>Last Number</Label>
                <Input
                  type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                  {...register("invoiceSeries.COACH.lastNumber")}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Business Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
