"use client";

import React, { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { CreateFeatureInput, Feature } from "@/types/client/admin/feature-controls.types";
import PageHeader from "./PageHeader";
import SearchBar from "./SearchBar";
import FeatureTable from "./FeatureTable";
import FeatureEditorModal from "./FeatureEditorModal";



export default function FeatureControlsComponent() {

    const [searchQuery, setSearchQuery] = useState("");
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: features = [], isLoading } = useQuery({
        queryKey: ["features"],
        queryFn: async () => {
            const res = await axios.get<{ success: boolean; data: Feature[] }>("/api/admin/feature-controls");
            return res.data.data;
        },
    });

    const filteredFeatures = features.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEditClick = (feature: Feature) => {
        setEditingFeature(JSON.parse(JSON.stringify(feature)));
        setIsDialogOpen(true);
    };

    // const handleAddNew = () => {

    //     setEditingFeature({
    //         id: `feat_new_${Date.now()}`,
    //         key: "",
    //         name: "",
    //         description: null,
    //         isActive: false,
    //         allowedUserTypes: [],
    //         actions: null,          
    //         configSchema: null,     
    //         planConfigs: []
    //     });
    //     setIsDialogOpen(true);
    // };
    const createFeatureMutation = useMutation({
        mutationFn: async (data: CreateFeatureInput) => {
            const res = await axios.post("/api/admin/feature-controls", data);
            return res.data;
        },

        onSuccess: () => {
            toast.success("Feature created successfully");
            queryClient.invalidateQueries({ queryKey: ["features"] });
        },
        onError: () => {
            toast.error("Failed to create feature");
        },
    });

    const updateFeatureMutation = useMutation({
        mutationFn: async (data: Feature) => {
            const res = await axios.put(`/api/admin/feature-controls/${data.id}`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Feature updated successfully");
            queryClient.invalidateQueries({ queryKey: ["features"] });
        },
        onError: () => {
            toast.error("Failed to update feature");
        },
    });


    const handleClose = () => { setIsDialogOpen(false); setEditingFeature(null); };

    const toggleFeatureActive = (id: string) => {
        const feature = features.find(f => f.id === id);
        if (!feature) return;

        updateFeatureMutation.mutate({
            ...feature,
            isActive: !feature.isActive,
        });
    };
    if (isLoading) {
        return <div className="p-6 flex items-center justify-center">Loading features...</div>;
    }
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FeatureTable features={filteredFeatures} onEdit={handleEditClick} onToggle={toggleFeatureActive} />
            <FeatureEditorModal
                open={isDialogOpen}
                feature={editingFeature}
                onClose={handleClose}
                createMutation={createFeatureMutation}
                updateMutation={updateFeatureMutation}
                features={features}
            />
        </div>
    );
}