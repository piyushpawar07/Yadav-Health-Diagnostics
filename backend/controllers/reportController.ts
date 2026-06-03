import { readDb } from '../models/db';

export const getMyReports = (req: any, res: any) => {
  const db = readDb();
  const reports = db.reports.filter(r => r.patientId === req.user.id);
  res.json({ reports });
};
