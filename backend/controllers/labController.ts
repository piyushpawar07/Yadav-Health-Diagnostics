import { readDb, DEFAULT_LAB_INFO } from '../models/db';

export const getLabInfo = (req: any, res: any) => {
  const db = readDb();
  res.json({ labInfo: db.labInfo || DEFAULT_LAB_INFO });
};
