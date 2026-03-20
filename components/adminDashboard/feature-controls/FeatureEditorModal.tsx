"use client";

import React, { useState, useEffect } from "react";
import {
    Settings, Save, ShieldAlert,
    Activity, Box, 
   
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";
import { FeatureSchema } from "@/schema/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { CreateFeatureInput, Feature, FeatureEditorModalProps } from "@/types/client/admin/feature-controls.types";
import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import GeneralTab from "./tabs/GeneralTab";
import AccessTab from "./tabs/AccessTab";
import SchemaTab from "./tabs/SchemaTab";
import PlanLimitsTab from "./tabs/PlanLimitsTab";


export default function FeatureEditorModal({ open, feature, onClose, createMutation, updateMutation, features }: FeatureEditorModalProps) {

    const form = useForm<z.infer<typeof FeatureSchema>>({
        resolver: zodResolver(FeatureSchema),
        defaultValues: feature ?? {
            key: "",
            name: "",
            description: "",
            allowedUserTypes: [],
            actions: null,
            configSchema: null,
            planConfigs: [],
            isActive: true,
        },
    });

    const [step, setStep] = useState<"general" | "access" | "schema" | "configs">("general");

    const stepOrder = ["general", "access", "schema", "configs"] as const;


    useEffect(() => {
        if (feature) {
            form.reset(feature);
        }
    }, [feature]);
    const isLoading =
        createMutation.isPending || updateMutation.isPending;

    const handleNextStep = async () => {
        let fields: (keyof z.infer<typeof FeatureSchema>)[] = [];

        if (step === "general") fields = ["key", "name"];
        if (step === "access") fields = ["allowedUserTypes"];
        if (step === "schema") fields = ["configSchema"];

        const valid = await form.trigger(fields);

        if (!valid) {
            toast.error("Please fix errors before continuing");
            return;
        }

        const nextIndex = stepOrder.indexOf(step) + 1;
        setStep(stepOrder[nextIndex]);
    };

    const handleSubmitFinal = form.handleSubmit(async (data) => {
        const isNew = feature?.id.startsWith("feat_new");

        try {
            if (isNew) {
            
                const createPayload: CreateFeatureInput = {
                    ...data,
                    description: data.description ?? null,
                    configSchema: data.configSchema ?? null,
                    actions: data.actions ?? null,
                    planConfigs: data.planConfigs.map(({...rest }) => rest),
                };

                await createMutation.mutateAsync(createPayload);

            } else {
                
                const updatePayload: Feature = {
                    ...data,
                    id: feature!.id,
                    description: data.description ?? null,
                    configSchema: data.configSchema ?? null,
                    actions: data.actions ?? null,

                
                    planConfigs: data.planConfigs.map((pc) => ({
                        ...pc,
                        id: pc.id ?? `pc_fallback_${Date.now()}`,
                    })),
                };

                await updateMutation.mutateAsync(updatePayload);
            }

            onClose();
        } catch (error: unknown) {
            // keep modal open
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Something went wrong");
            } else {
                toast.error("Unexpected error occurred");
            }
        }
    });


    const safeFeature = form.watch();
    if (!feature) return null;
    const isNew = feature.id.startsWith("feat_new") || !feature.name;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-xl">
                <AlertDialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b shrink-0 bg-background z-10">
                    <div className="pr-6 sm:pr-0">
                        <DialogTitle className="text-xl sm:text-2xl">
                            {isNew ? "Create Feature" : `Edit: ${feature.name}`}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm hidden sm:block">
                            Configure core details, access rules, and dynamic limits for this feature.
                        </DialogDescription>
                    </div>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto bg-muted/10">
                    <Tabs value={step} className="w-full h-full flex flex-col">
                        <div className="w-full overflow-x-auto border-b bg-background px-2 sm:px-6 shrink-0">
                            <TabsList className="flex w-max min-w-full h-auto py-2 bg-transparent justify-start gap-2">
                                <TabsTrigger value="general" onClick={() => setStep("general")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Settings className="w-4 h-4 mr-2 hidden sm:block" /> General
                                </TabsTrigger>
                                <TabsTrigger value="access" onClick={() => setStep("access")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <ShieldAlert className="w-4 h-4 mr-2 hidden sm:block" /> Access
                                </TabsTrigger>
                                <TabsTrigger value="schema" onClick={() => setStep("schema")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Box className="w-4 h-4 mr-2 hidden sm:block" /> UI Schema
                                </TabsTrigger>
                                <TabsTrigger value="configs" onClick={() => setStep("configs")} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Activity className="w-4 h-4 mr-2 hidden sm:block" /> Plan Limits
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 sm:p-6 flex-1">
                            <TabsContent value="general" className="m-0">
                                <GeneralTab feature={safeFeature as Feature}
                                    onChange={(updated) => {
                                        type FeatureForm = z.infer<typeof FeatureSchema>;

                                        (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                            .forEach(([key, value]) => {
                                                form.setValue(key, value);
                                            });
                                    }} />
                            </TabsContent>
                            <TabsContent value="access" className="m-0">
                                <AccessTab feature={safeFeature as Feature} onChange={(updated) => {
                                    type FeatureForm = z.infer<typeof FeatureSchema>;

                                    (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                        .forEach(([key, value]) => {
                                            form.setValue(key, value);
                                        });
                                }} />
                            </TabsContent>
                            <TabsContent value="schema" className="m-0">
                                <SchemaTab
                                    feature={safeFeature as Feature}
                                    dbConfigSchema={
                                        features.find(f => f.id === feature?.id)?.configSchema ?? null
                                    }
                                    onChange={(updated) => {
                                        type FeatureForm = z.infer<typeof FeatureSchema>;
                                        (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                            .forEach(([key, value]) => {
                                                form.setValue(key, value);
                                            });
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="configs" className="m-0 h-full">
                                <PlanLimitsTab feature={safeFeature as Feature} onChange={(updated) => {
                                    type FeatureForm = z.infer<typeof FeatureSchema>;
                                    (Object.entries(updated) as [keyof FeatureForm, FeatureForm[keyof FeatureForm]][])
                                        .forEach(([key, value]) => {
                                            form.setValue(key, value);
                                        });
                                }} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t bg-background shrink-0 flex flex-col sm:flex-row gap-2 z-10">
                    <Button variant="outline" className="w-full sm:w-auto order-1 sm:order-none" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (step !== "configs") {
                                handleNextStep();
                            } else {
                                handleSubmitFinal();
                            }
                        }}
                        disabled={isLoading}
                        className="w-full sm:w-auto gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {step === "configs" ? "Save Feature" : "Next"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}