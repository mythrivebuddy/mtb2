import { ConfigSchemaField, Feature, FeatureUserType } from "@/types/client/admin/feature-controls.types";

/** Pairs that get auto-closed when opened */
export const AUTO_CLOSE_PAIRS: Record<string, string> = {
    "{": "}",
    "[": "]",
    '"': '"',
};

/** Chars we skip over instead of inserting when already present */
export const SKIP_CHARS = new Set(["}", "]", '"']);

/** Returns leading whitespace of the line containing `pos` */
export function getIndent(text: string, pos: number): string {
    const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
    const match = text.slice(lineStart, pos).match(/^(\s*)/);
    return match ? match[1] : "";
}
// Derives which userTypes should have a config card for a given membership.
// A userType is included if it's in allowedUserTypes AND either:
//   - no actions are defined (feature-level access only), OR
//   - it appears in at least one action value
export function getEffectiveUserTypes(feature: Feature): FeatureUserType[] {
    if (!feature.actions || Object.keys(feature.actions).length === 0) {
        return feature.allowedUserTypes;
    }
    const actionUserTypes = new Set(Object.values(feature.actions).flat());
    return feature.allowedUserTypes.filter(t => actionUserTypes.has(t));
}

// Returns only the configSchema fields relevant to a given userType,
// based on which actions they have access to.
// Fields whose key matches an action name are filtered by that action's userTypes.
// Fields with no matching action are always shown (they're global config).
export function getVisibleSchemaFields(
    feature: Feature,
    userType: FeatureUserType
): [string, ConfigSchemaField][] {
    if (!feature.configSchema) return [];
    const entries = Object.entries(feature.configSchema);
    if (!feature.actions || Object.keys(feature.actions).length === 0) return entries;

    return entries.filter(([key]) => {
        // Find an action whose name is contained in the field key (e.g. "createLimit" → "create")
        const matchingAction = Object.entries(feature.actions!).find(([actionName]) =>
            key.toLowerCase().startsWith(actionName.toLowerCase()) || key.toLowerCase().includes(actionName.toLowerCase())
        );
        // If no matching action found → always show (it's a global field)
        if (!matchingAction) return true;
        // Show only if userType has this action
        return matchingAction[1].includes(userType);
    });
}




export function getFeatureSummary(feature: Feature): string[] {
    if (!feature.configSchema || feature.planConfigs.length === 0) {
        return ["No limits"];
    }

    const summaries: string[] = [];

    for (const pc of feature.planConfigs) {
        if (!pc.isActive) continue;

        const labelParts: string[] = [];

        for (const [key, value] of Object.entries(pc.config)) {
            const schema = feature.configSchema[key];

            if (!schema) continue;

            // 🔥 smart formatting
            if (typeof value === "number") {
                if (value === -1) {
                    labelParts.push(`${schema.label}: Unlimited`);
                } else {
                    labelParts.push(`${schema.label}: ${value}`);
                }
            } else if (typeof value === "boolean") {
                labelParts.push(`${schema.label}: ${value ? "Yes" : "No"}`);
            } else {
                labelParts.push(`${schema.label}: ${value}`);
            }
        }

        if (labelParts.length > 0) {
            summaries.push(
                `${pc.membership} ${pc.userType} → ${labelParts.join(", ")}`
            );
        }
    }

    return summaries;
}

export const SCHEMA_HINT = `// Each key becomes a form field in the Plan Limits tab.
{
  "dailyLimit": {
    "type": "number",       // "number" | "boolean" | "string" | "select"
    "label": "Daily Limit",
    "default": 1
  },
  "limitType": {
    "type": "select",
    "label": "Limit Type",
    "options": ["MONTHLY", "YEARLY", "LIFETIME"],
    "default": "MONTHLY"
  },
  "isActive": {
    "type": "boolean",
    "label": "Is Active",
    "default": true
  }
}`;

