export type Participant = {
  id: string;
  name: string;
  phone?: string;
  details?: string;
  donuts: number;
};

export type ChanceResult = {
  id: string;
  name: string;
  donuts: number;
  /** Probability in [0, 1] */
  chance: number;
};

export type WheelEntry = {
  id: string;
  name: string;
  phone?: string;
  details?: string;
  donuts: number;
  /** Fraction of the wheel this entry occupies (in [0, 1]) */
  share: number;
  color: string;
};
