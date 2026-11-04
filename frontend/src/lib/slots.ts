import type { LabInfo } from '../types';

export const SLOT_TIMES = [
  "08:00 AM - 09:00 AM",
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM"
];

export const MAX_SLOT_CAPACITY = 50;

// A limit set for one date wins over the limit set for all dates
export const getSlotCapacity = (labInfo: LabInfo | null | undefined, date: string, time: string): number => {
  const capacities = labInfo?.slotCapacities;
  return capacities?.[`${date}_${time}`] ?? capacities?.[time] ?? (time === SLOT_TIMES[0] ? 1 : 3);
};
