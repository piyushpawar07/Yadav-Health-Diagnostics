import { readDbAsync, DEFAULT_LAB_INFO } from '../models/db';

export const getLabInfo = async (req: any, res: any) => {
  const db = await readDbAsync();
  res.json({ labInfo: db.labInfo || DEFAULT_LAB_INFO });
};
