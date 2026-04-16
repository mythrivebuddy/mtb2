
export interface JPCardProps {
    value: number;
    label: string;
  }

  /* ───────────── CORE TYPES ───────────── */

export type Commitment = {
  id: string;
  goalText: string | null;
  identityText: string | null;
  visionStatement: string | null;
  area?: {
    id: number;
    name: string;
  };
};

/* ───────────── ACTIONS ───────────── */

export type AlignedAction = {
  id: string;
  completed: boolean;
  selectedTask: string;
  tasks: string[];
  timeFrom: string;
  timeTo: string;
};

/* ───────────── DAILY BLOOMS ───────────── */

export type DailyBloom = {
  id: string;
  title: string;
  isCompleted: boolean;
};

/* ───────────── PROGRESS & LOGS ───────────── */

export type OnePercentProgressVault = {
  id: string;
  content: string;
};

export type MiracleLog = {
  id: string;
  content: string;
};

/* ───────────── CHALLENGES ───────────── */

export type Challenge = {
  challenge: {
    id: string;
    title: string;
  };
};

/* ───────────── MMP PROGRAMS ───────────── */

export type MMPProgram = {
  program: {
    id: string;
    name: string;
    slug: string;
  };
};

/* ───────────── MAIN DASHBOARD TYPE ───────────── */

export type DashboardContent = {
  userMakeoverCommitment: Commitment[];
  alignedAction: AlignedAction[];
  dailyBlooms: DailyBloom[];
  onePercentProgressVault: OnePercentProgressVault[];
  miracleLogs: MiracleLog[];
  challenges: Challenge[];
  mmpPrograms: MMPProgram[];
  event: unknown; // refine later if needed
  cmpProgramId: string;
};