export type Participant = {
  id: string;
  name: string;
  phone?: string;
  details?: string;
  donations: number;
};

export type ChanceResult = {
  id: string;
  name: string;
  donations: number;
  /** Probability in [0, 1] */
  chance: number;
};

export type WheelEntry = {
  id: string;
  name: string;
  phone?: string;
  details?: string;
  donations: number;
  /** Visual fraction of the wheel (kept uniform across eligible entries). */
  share: number;
  /** Probability weight for picking the winner; equal to donations. */
  weight: number;
  color: string;
};
