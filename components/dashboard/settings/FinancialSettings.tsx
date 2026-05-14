"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  UserFinancialInput,
  userFinancialSchema,
} from "@/schema/user-financials-details";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */
type Country = "IN" | "US" | "UK"  | "OT";

/* ---------------- COMPONENT ---------------- */

export default function FinancialSettings() {
  const queryClient = useQueryClient();

  // --- 1. INITIALIZE FORM WITH AN EMPTY SHELL ---
  // This prevents React Hook Form from losing track of conditional fields
  const form = useForm<UserFinancialInput>({
    resolver: zodResolver(userFinancialSchema),
    defaultValues: {
      country: undefined,
      isGstRegistered: false,
      panNumber: "",
      gstNumber: "",
      taxFormType: undefined,
      taxId: "",
      vatNumber: "",
      accountHolderName: "",
      bankAccountType: undefined,
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      upiId: "",
      bankName: "",
      swiftCode: "",
      paypalId: "",
      whatsappNumber: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = form;

  const country = watch("country") as Country | undefined;
  const isGst = watch("isGstRegistered");

  // --- 2. FETCH DATA (REACT QUERY) ---
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["financialDetails"],
    queryFn: async () => {
      const res = await axios.get("/api/user/financial-details");
      return res.data;
    },
  });

  // --- 3. FORCE POPULATE FORM ---
  // When the API loads, push the data securely into the form state
  useEffect(() => {
    if (apiResponse) {
      const fetchedCountry = apiResponse.address?.country?.toUpperCase();
      const db = apiResponse.data || {};
      const address = apiResponse.address || {};
      reset({
        country: fetchedCountry || db.country || undefined,
        isGstRegistered: !!(address.gstNumber || db.gstNumber),
        panNumber: db.panNumber || "",
        gstNumber: address.gstNumber || db.gstNumber || "",
        taxFormType: db.taxFormType || undefined,
        taxId: db.taxId || "",
        vatNumber: db.vatNumber || "",
        accountHolderName: db.accountHolderName || "",
        bankAccountType: db.bankAccountType || undefined,
        accountNumber: db.accountNumber || "",
        confirmAccountNumber: db.accountNumber || "", // Pre-fill confirmation to match
        ifscCode: db.ifscCode || "",
        upiId: db.upiId || "",
        bankName: db.bankName || "",
        swiftCode: db.swiftCode || "",
        paypalId: db.paypalId || "",
        whatsappNumber: address.phone || "",
      });
    }
  }, [apiResponse, reset]);

  // --- 4. SUBMIT MUTATION ---
  const mutation = useMutation({
    mutationFn: async (payload: UserFinancialInput) => {
      const res = await axios.post("/api/user/financial-details", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financialDetails"] });
      toast.success("Financial details saved successfully!");
    },
    onError: (error) => {
      console.error("Failed to save:", error);
      toast.error("Failed to save details. Please check your inputs.");
    },
  });

  const onSubmit = (data: UserFinancialInput) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  const isCountryLocked =
    !!apiResponse?.address?.country || !!apiResponse?.data?.country;

  return (
    <Card className="w-full mx-auto dark:bg-slate-900 shadow-sm">
      <CardHeader className="border-b dark:border-slate-800 pb-6 mb-6">
        <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">
          Financial Details
        </CardTitle>
        <CardDescription>
          Update your tax, banking, and payout preferences securely.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* TAX INFO */}
            <div className="space-y-5">
              <div className="border-b dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  1. Tax Information
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Controller
                    control={control}
                    name="country"
                    defaultValue={undefined}
                    render={({ field }) => (
                      <Select
                        disabled={isCountryLocked}
                        key={field.value}
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">India</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="OT">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {isCountryLocked && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Country is locked to your billing profile address.
                    </p>
                  )}
                  {errors.country && (
                    <p className="text-xs text-red-500">
                      {errors.country.message}
                    </p>
                  )}
                </div>

                {/* INDIA */}
                {country === "IN" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <Input
                        placeholder="PAN Number"
                        {...register("panNumber")}
                      />
                      {errors.panNumber && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.panNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <span className="text-sm">GST Registered</span>
                      <Controller
                        control={control}
                        name="isGstRegistered"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    {isGst && (
                      <div>
                        <Input
                          placeholder="GST Number"
                          {...register("gstNumber")}
                        />
                        {errors.gstNumber && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.gstNumber.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* US */}
                {country === "US" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <Controller
                        control={control}
                        name="taxFormType"
                        render={({ field }) => (
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Tax Form" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="W8BEN">W-8BEN</SelectItem>
                              <SelectItem value="W9">W-9</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.taxFormType && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.taxFormType.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        placeholder="SSN, EIN, or ITIN"
                        {...register("taxId")}
                      />
                      {errors.taxId && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.taxId.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* EU/UK */}
                {country === "UK" && (
                  <div className="animate-in fade-in">
                    <Input
                      placeholder="VAT Number"
                      {...register("vatNumber")}
                    />
                    {errors.vatNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.vatNumber.message}
                      </p>
                    )}
                  </div>
                )}

                {/* OTHER */}
                {country === "OT" && (
                  <div className="animate-in fade-in">
                    <Input placeholder="Tax ID" {...register("taxId")} />
                    {errors.taxId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.taxId.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BANKING INFO */}
            <div className="space-y-5">
              <div className="border-b dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  2. Banking Information
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Account Holder Name"
                    {...register("accountHolderName")}
                  />
                  {errors.accountHolderName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.accountHolderName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Controller
                    control={control}
                    name="bankAccountType"
                    defaultValue={undefined}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        key={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Account Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAVINGS">Savings</SelectItem>
                          <SelectItem value="CURRENT">Current</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.bankAccountType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.bankAccountType.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    placeholder="Account Number"
                    {...register("accountNumber")}
                  />
                  {errors.accountNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.accountNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    placeholder="Re-enter Account No."
                    {...register("confirmAccountNumber")}
                  />
                  {errors.confirmAccountNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.confirmAccountNumber.message}
                    </p>
                  )}
                </div>
                  <div>
                    <Input placeholder="Bank Name" {...register("bankName")} />
                    {errors.bankName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.bankName.message}
                      </p>
                    )}
                  </div>
                {/* INDIA BANKING */}
                {country === "IN" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <Input
                        placeholder="IFSC Code"
                        {...register("ifscCode")}
                        className="uppercase"
                      />
                      {errors.ifscCode && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.ifscCode.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input placeholder="UPI ID" {...register("upiId")} />
                      {errors.upiId && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.upiId.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 animate-in fade-in">
                  
                  {/* INTERNATIONAL BANKING */}
                  {country && country !== "IN" && (
                    <>
                      <div>
                        <Input
                          placeholder="SWIFT / BIC Code"
                          {...register("swiftCode")}
                        />
                        {errors.swiftCode && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.swiftCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="PayPal ID (optional)"
                          {...register("paypalId")}
                        />
                        {errors.paypalId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.paypalId.message}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL DETAILS */}
          <div className="pt-4 border-t dark:border-slate-800 space-y-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              3. Additional Details
            </h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-300">
                  Address Information
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Your billing address is handled centrally. The country
                  selected above dictates your tax and payout requirements here.
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <Input
                placeholder="WhatsApp Number"
                {...register("whatsappNumber")}
              />
              {errors.whatsappNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.whatsappNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            {mutation.isPending ? "Saving..." : "Save Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
