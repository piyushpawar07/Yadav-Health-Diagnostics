import { readDbAsync } from '../models/db';

export const getMyReports = async (req: any, res: any) => {
  const db = await readDbAsync();
  const reports = db.reports.filter(r => r.patientId === req.user.id);
  res.json({ reports });
};
