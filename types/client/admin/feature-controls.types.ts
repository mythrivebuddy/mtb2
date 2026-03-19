// ─────────────────────────────────────────────
// TYPES

import { UseMutationResult } from "@tanstack/react-query";

// ─────────────────────────────────────────────
export type FeatureUserType = "COACH" | "ENTHUSIAST" | "SOLOPRENEUR";
export type MembershipType = "FREE" | "PAID";
export type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[];

export interface ConfigSchemaField {
    type: "number" | "boolean" | "string" | "select";
    label: string;
    options?: string[];
    default?: JsonValue;
}

export interface FeaturePlanConfig {
    id: string;
    membership: MembershipType;
    userType: FeatureUserType;
    isActive: boolean;
    config: Record<string, JsonValue>;
}

export interface Feature {
    id: string;
    key: string;
    name: string;
    description: string | null;
    configSchema: Record<string, ConfigSchemaField> | null;
    allowedUserTypes: FeatureUserType[];
    actions: Record<string, FeatureUserType[]> | null;
    isActive: boolean;
    planConfigs: FeaturePlanConfig[];
}
export type CreateFeatureInput = {
    key: string;
    name: string;
    description: string | null;
    configSchema: Record<string, ConfigSchemaField> | null;
    allowedUserTypes: FeatureUserType[];
    actions: Record<string, FeatureUserType[]> | null;
    isActive: boolean;

    planConfigs: {
        membership: MembershipType;
        userType: FeatureUserType;
        isActive: boolean;
        config: Record<string, JsonValue>;
    }[];
};

export interface JsonEditorProps {
    value: object | null;
    onChange: (parsed: object) => void;
    label?: string;
    description?: string;
    minHeight?: string;
    schemaHint?: string;
    dbHint?: object | null;           // ← add this
    onApplyHint?: (v: object) => void; // ← add this
}

export interface SearchBarProps { value: string; onChange: (v: string) => void; }


export type CreateFeatureResponse = { success: boolean; data: Feature };
export type UpdateFeatureResponse = { success: boolean; data: Feature };

export type CreateFeatureMutation = UseMutationResult<
    CreateFeatureResponse,
    unknown,
    CreateFeatureInput
>;

export type UpdateFeatureMutation = UseMutationResult<
    UpdateFeatureResponse,
    unknown,
    Feature
>;
export interface FeatureEditorModalProps {
    open: boolean;
    feature: Feature | null;
    onClose: () => void;
    createMutation: CreateFeatureMutation;
    updateMutation: UpdateFeatureMutation;
    features: Feature[]; // ← add this
}

export interface PlanLimitsTabProps {
    feature: Feature;
    onChange: (f: Feature) => void;
}

export interface PlanConfigFormProps {
    feature: Feature; selectedMembership: MembershipType; selectedUser: FeatureUserType;
    onFeatureChange: (f: Feature) => void;
}

export interface PlanConfigFieldProps { fieldKey: string; field: ConfigSchemaField; value: JsonValue; onChange: (key: string, value: JsonValue) => void; }

export interface AccessTabProps { feature: Feature; onChange: (f: Feature) => void; }

export interface GeneralTabProps { feature: Feature; onChange: (f: Feature) => void; }

export interface FeatureTableRowProps { feature: Feature; onEdit: (f: Feature) => void; onToggle: (id: string) => void; }

export interface FeatureTableProps { features: Feature[]; onEdit: (f: Feature) => void; onToggle: (id: string) => void; }

export interface SchemaTabProps { feature: Feature; onChange: (f: Feature) => void; dbConfigSchema?: object | null; }