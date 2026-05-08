
export interface IBlockUserParams {
  userId: string;
  reason: string;
}

export interface IPlan {
  name: string;
  id: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  jpEarned: number;
  jpBalance: number;
  createdAt: string;
  isBlocked: boolean;
  plan?: IPlan | null;
  isOnline : boolean;
  image?:string;
  isAffiliate?: boolean;
  affiliatePercent?: number;
  affiliateCommissionType?: "MTB" | "SUBSCRIPTION";
}

export interface IBlockUserResponse {
  message: string;
  user: IUser;
}
export interface OnlineUser {
  userId: string;
}