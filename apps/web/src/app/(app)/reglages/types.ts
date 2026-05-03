export type UserData = {
  email: string;
  display_name: string | null;
  phone: string | null;
  plan: string;
  created_at: string | null;
};

export type LoftData = {
  id: string;
  name: string;
  address: string | null;
  licence_number: string | null;
  pigeonCount?: number;
};

export type ProfileStats = {
  pigeonCount: number;
  raceCount: number;
};
