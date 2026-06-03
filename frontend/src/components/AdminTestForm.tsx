import React, { useState, useEffect } from 'react';
import { BloodTest } from '../types';
import { AlertCircle, X, Shield, Save } from 'lucide-react';

interface AdminTestFormProps {
  test?: BloodTest;
  onCancel: () => void;
  onSave: (testData: Omit<BloodTest, 'id' | 'createdAt'>) => void;
}

export default function AdminTestForm({ test, onCancel, onSave }: AdminTestFormProps) {
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Biochemistry');
  const [description, setDescription] = useState('');
  const [preparationInstructions, setPreparationInstructions] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [sampleType, setSampleType] = useState('serum');
  const [reportTime, setReportTime] = useState('24 Hours');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (test) {
      setTestName(test.testName);
      setCategory(test.category);
      setDescription(test.description);
      setPreparationInstructions(test.preparationInstructions || '');
      setBasePrice(test.basePrice || 0);
      setSellingPrice(test.sellingPrice || 0);
      setSampleType(test.sampleType || 'serum');
      setReportTime(test.reportTime || '24 Hours');
      setIsActive(test.isActive !== undefined ? test.isActive : true);
    }
  }, [test]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      alert('Test name is required.');
      return;
    }
    if (sellingPrice <= 0) {
      alert('Selling price must be greater than zero.');
      return;
    }
    onSave({
      testName,
      category,
      description,
      preparationInstructions,
      basePrice,
      sellingPrice,
      sampleType,
      reportTime,
      isActive
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="font-extrabold text-lg text-slate-100">
              {test ? 'Modify Diagnostic Test Catalog Entry' : 'Publish New Diagnostic Test'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 px-1.5 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5Packed">
              Clinical Test Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Total Thyroid Profile (T3, T4, TSH)"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Category Group
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="Biochemistry">Biochemistry</option>
                <option value="Haematology">Haematology</option>
                <option value="Immunology">Immunology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Other Diagnostics">Other Diagnostics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sample Specimen Type
              </label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="serum">serum</option>
                <option value="plasma">plasma</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Lab Base cost (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Patient Selling cost (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Turnaround Reporting Time
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 12 Hours, 24 Hours, Same day"
              value={reportTime}
              onChange={(e) => setReportTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Clinical Test Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide clinical symptoms, evaluation aspects and diagnosis relevance of this test..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Patient Preparation Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. 10 hours overnight fasting required, avoid thyroid medication on collection day."
              value={preparationInstructions}
              onChange={(e) => setPreparationInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 bg-slate-950 border border-slate-850 text-emerald-500 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-350 select-none cursor-pointer">
              Mark test active & display immediately in public directory
            </label>
          </div>

          <div className="flex items-center gap-2.5 justify-end pt-4 border-t border-slate-850 mt-6 bg-slate-900 sticky bottom-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs text-slate-400 bg-slate-950 hover:bg-slate-850 hover:text-slate-200 border border-slate-850 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
            >
              <Save className="h-3.5 w-3.5" /> Save Catalog Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
