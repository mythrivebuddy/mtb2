export type Frequency = "DAILY" | "MONTHLY" | "YEARLY";

export interface DailyBloom{
     id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null; 
  frequency: Frequency | null; 
  createdAt ?: string;
  updatedAt: string;
}

export type TodoFilter =
  | "all"
  | "completed"
  | "pending"
  | "daily"
  | "weekly"
  | "monthly";

  export type SelectProps = {
         orderBy: TodoFilter

         onValueChange : (value:TodoFilter) => void
  }