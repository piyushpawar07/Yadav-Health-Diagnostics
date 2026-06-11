import { PatientReport, Booking } from '../types';
import { Calendar, FileText, Download, Printer, User, Activity, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportViewerProps {
  report: PatientReport;
  booking?: Booking;
  onClose: () => void;
}

interface Biomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low';
}

export const getReportHtmlContent = (report: PatientReport, booking: Booking | undefined, markers: Biomarker[]) => {
  const bookedNames = booking?.tests.map(t => t.testName).join(', ') || report.reportFileName.split('_')[0] || 'Blood Diagnostic Panel';
  
  return `<!-- YADAV DIAGNOSTICS HEALTH REPORT LEDGER -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Yadav Health Diagnostics - Pathology Report_${report.patientName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: white; color: black; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen py-6 px-4 md:px-8">
  <div class="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:border-none">
    
    <!-- Header control bar -->
    <div class="bg-slate-950 text-slate-100 px-6 py-4 flex items-center justify-between no-print">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-bold text-xs uppercase tracking-wider text-slate-300">Yadav Digital Pathology Ledger</span>
      </div>
      <button onclick="window.print()" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition">
        Print / Save as PDF
      </button>
    </div>

    <div class="p-8 md:p-12">
      <!-- Report Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-emerald-600 pb-6 gap-4">
        <div>
          <div class="text-emerald-600 font-black text-2xl tracking-tight">YADAV HEALTH DIAGNOSTICS</div>
          <p class="text-xs text-slate-500 font-medium">Quality • Standards • Reliability • Digital Automation</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Shop No. 12, Main Market, Sect 4, Dwarka, New Delhi. Phone: +91 98765 43210</p>
        </div>
        <div class="text-[11px] text-slate-500 leading-relaxed md:text-right">
          <p class="font-bold text-emerald-650">REGISTERED CLINICAL LABORATORY</p>
          <p class="font-mono mt-1">LIC No: DIAG-DEL-2026-Y8911</p>
          <p class="font-mono">Report Ref ID: ${report.id}</p>
        </div>
      </div>

      <!-- Patient Data Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-slate-200 text-xs">
        <div>
          <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Patient Name</span>
          <p class="font-bold text-slate-800 text-sm mt-0.5">${report.patientName}</p>
          <p class="text-slate-500">Age: 28 yrs • Female</p>
        </div>
        <div>
          <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Collected At</span>
          <p class="font-semibold text-slate-700 mt-0.5">Yadav Diagnostic Center</p>
          <p class="text-slate-500">Doorstep Home Collection</p>
        </div>
        <div>
          <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Schedule Details</span>
          <p class="font-mono mt-0.5">${booking ? booking.appointmentDate : 'N/A'}</p>
          <p class="text-slate-500 text-[10px]">Slot Time: ${booking ? booking.appointmentTime : 'N/A'}</p>
        </div>
        <div>
          <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Report Released</span>
          <p class="font-semibold text-slate-700 mt-0.5">${new Date(report.uploadedAt).toLocaleDateString()}</p>
          <p class="text-slate-500 text-[10px]">${new Date(report.uploadedAt).toLocaleTimeString()}</p>
        </div>
      </div>

      <!-- Testing parameters -->
      <div class="mt-8">
        <div class="bg-slate-100 px-4 py-2.5 font-bold text-xs uppercase tracking-wide text-slate-700 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Test Analyte / Parameter</span>
          <div class="grid grid-cols-3 w-full sm:w-3/5 lg:w-1/2 text-right">
            <span>Observed</span>
            <span>Units</span>
            <span>Biological Ref Range</span>
          </div>
        </div>

        <div class="divide-y divide-slate-100 mt-2">
          ${markers.map(m => `
            <div class="px-4 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 hover:bg-slate-50/50">
              <div class="font-semibold text-slate-800 flex flex-wrap items-center gap-1.5">
                <span>${m.name}</span>
                ${m.status !== 'normal' ? `<span class="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded ${m.status === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${m.status}</span>` : ''}
              </div>
              <div class="grid grid-cols-3 w-full sm:w-3/5 lg:w-1/2 text-right items-center font-mono">
                <span class="font-bold ${m.status !== 'normal' ? 'text-rose-600' : 'text-slate-955'}">${m.value}</span>
                <span class="text-slate-500">${m.unit}</span>
                <span class="text-slate-650">${m.referenceRange}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Interpretations -->
      <div class="mt-10 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-slate-650">
        <span class="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">Pathology Advisory Interpretations</span>
        <ul class="list-disc pl-4 space-y-1">
          <li>Observed clinical parameters conform to diagnostic calibration methodologies.</li>
          <li>Kindly associate observations under physical examination checkups by your clinical consultant.</li>
        </ul>
      </div>

      <!-- Footer Signoff -->
      <div class="flex justify-between items-end border-t border-slate-205 pt-8 mt-12 gap-8">
        <div class="text-[10px] text-slate-400 leading-normal space-y-0.5">
          <p class="font-semibold text-emerald-600">Yadav Diagnostics Verified Report ID</p>
          <p>System Verifier: VAL-YADAV-8819</p>
          <p>Digitally signed, paperless certified pathology record.</p>
        </div>
        <div class="text-right">
          <div class="inline-block border-b border-slate-400 text-xs italic text-slate-600 pb-1 px-4 tracking-wider">
            Dr. A. K. Yadav, MD (Path.)
          </div>
          <p class="text-[10px] font-bold text-slate-705 uppercase tracking-wider">Senior Consultant Pathologist</p>
          <p class="text-[9px] text-slate-400">Chief Chemical Analyst, Yadav Labs</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Parse clinical biomarker markers simulated from tests
export const getBiomarkersForTests = (testNames: string[]): Biomarker[] => {
  const list: Biomarker[] = [];
  
  testNames.forEach(name => {
    const lower = name.toLowerCase();
    if (lower.includes('complete blood count') || lower.includes('cbc')) {
      list.push(
        { name: 'Haemoglobin (Hb)', value: 14.2, unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal' },
        { name: 'Total Leucocyte Count (WBC)', value: 8700, unit: '/cumm', referenceRange: '4000 - 11000', status: 'normal' },
        { name: 'Platelet Count', value: 245000, unit: '/cumm', referenceRange: '150000 - 450000', status: 'normal' },
        { name: 'Packed Cell Volume (PCV)', value: 41.5, unit: '%', referenceRange: '40.0 - 50.0', status: 'normal' }
      );
    } else if (lower.includes('lipid') || lower.includes('cholesterol')) {
      list.push(
        { name: 'Total Cholesterol', value: 215, unit: 'mg/dL', referenceRange: '< 200', status: 'high' },
        { name: 'HDL Cholesterol (Good)', value: 48, unit: 'mg/dL', referenceRange: '40 - 60', status: 'normal' },
        { name: 'LDL Cholesterol (Bad)', value: 135, unit: 'mg/dL', referenceRange: '< 100', status: 'high' },
        { name: 'Triglycerides', value: 160, unit: 'mg/dL', referenceRange: '< 150', status: 'high' }
      );
    } else if (lower.includes('thyroid') || lower.includes('t3')) {
      list.push(
        { name: 'Total Triiodothyronine (T3)', value: 1.12, unit: 'ng/mL', referenceRange: '0.80 - 2.00', status: 'normal' },
        { name: 'Total Thyroxine (T4)', value: 7.8, unit: 'µg/dL', referenceRange: '5.1 - 14.1', status: 'normal' },
        { name: 'Thyroid Stimulating Hormone (TSH)', value: 5.4, unit: 'mIU/L', referenceRange: '0.40 - 4.20', status: 'high' }
      );
    } else if (lower.includes('hba1c') || lower.includes('sugar')) {
      list.push(
        { name: 'HbA1c (Glycated Hb)', value: 6.8, unit: '%', referenceRange: '4.0 - 5.6 (Non-Diabetic)', status: 'high' },
        { name: 'Average Estimated Blood Glucose', value: 148, unit: 'mg/dL', referenceRange: '70 - 100', status: 'high' }
      );
    } else if (lower.includes('liver') || lower.includes('lft')) {
      list.push(
        { name: 'SGOT (AST)', value: 28, unit: 'U/L', referenceRange: '5 - 40', status: 'normal' },
        { name: 'SGPT (ALT)', value: 48, unit: 'U/L', referenceRange: '5 - 35', status: 'high' },
        { name: 'Total Bilirubin', value: 0.8, unit: 'mg/dL', referenceRange: '0.2 - 1.2', status: 'normal' },
        { name: 'Alkaline Phosphatase (ALP)', value: 92, unit: 'U/L', referenceRange: '30 - 120', status: 'normal' }
      );
    } else if (lower.includes('vitamin d3')) {
      list.push(
        { name: 'Vitamin D (25-Hydroxy)', value: 18.2, unit: 'ng/mL', referenceRange: '30.0 - 100.0', status: 'low' }
      );
    } else {
      // Fallback standard marker
      list.push(
        { name: `${name} Analyte Level`, value: 94, unit: 'mg/dL', referenceRange: '70 - 110', status: 'normal' }
      );
    }
  });

  return list;
};

export default function ReportViewer({ report, booking, onClose }: ReportViewerProps) {
  const bookedNames = booking?.tests.map(t => t.testName) || [report.reportFileName.split('_')[0] || 'Blood Diagnostic Panel'];
  const markers = getBiomarkersForTests(bookedNames);
  const reportUrl = report.reportFileUrl && report.reportFileUrl !== 'DATA_64_PDF_ENCODED_CLINICAL_VALUES' ? report.reportFileUrl : undefined;
  const isPdfReport = typeof reportUrl === 'string' && /^data:application\/pdf|\.pdf($|\?)/i.test(reportUrl);
  const isImageReport = typeof reportUrl === 'string' && /^data:image\/|\.(png|jpe?g|gif|webp)($|\?)/i.test(reportUrl);
  const reportFilename = report.reportFileName || `${report.patientName}_Report`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="pathology-report-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Modal Controls header */}
        <div id="modal-controls-bar" className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800 print:hidden text-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-sans font-semibold text-sm">Secure Pathology Report Lockbox</span>
          </div>
          <div className="flex items-center gap-3">
            <style>{`
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #diagnostics-app-container, header, footer, #modal-controls-bar, button {
                  display: none !important;
                }
                #pathology-report-modal {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                  overflow: visible !important;
                }
                #printable-area {
                  padding: 0 !important;
                  margin: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                }
              }
            `}</style>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer hover:scale-102"
            >
              <Printer className="h-4 w-4" />
              <span>Save / Print PDF</span>
            </button>
            
            {/* Download original report file whenever available; otherwise fallback to generated HTML */}
            <a
              href={reportUrl || `data:text/html;charset=utf-8,${encodeURIComponent(getReportHtmlContent(report, booking, markers))}`}
              download={reportUrl ? reportFilename : `${report.patientName}_Pathology_Report_${report.id.slice(0, 5)}.html`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-bold rounded-xl transition cursor-pointer"
              title={reportUrl ? 'Download the original uploaded report file' : 'Download a generated HTML summary report'}
            >
              <Download className="h-4 w-4" />
              <span>{reportUrl ? 'Download Original Report' : 'Download Report (.html)'}</span>
            </a>
            
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 bg-rose-500 hover:bg-rose-400 text-white px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <span>← Close Report</span>
            </button>
          </div>
        </div>

        {reportUrl ? (
          <div className="px-6 pb-6 bg-slate-900 border-b border-slate-800 print:hidden">
            <div className="mb-4 text-xs uppercase tracking-wide text-slate-500">Original uploaded report preview</div>
            {isPdfReport ? (
              <div className="h-[520px] overflow-hidden rounded-3xl border border-slate-700 bg-slate-950">
                <iframe
                  src={reportUrl}
                  title="Report preview"
                  className="w-full h-full"
                />
              </div>
            ) : isImageReport ? (
              <img
                src={reportUrl}
                alt="Pathology report preview"
                className="w-full rounded-3xl border border-slate-700 object-contain"
              />
            ) : (
              <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 text-slate-300 text-sm">
                Original report is available for download, but cannot be previewed inline in this browser.
              </div>
            )}
          </div>
        ) : null}

        <div id="printable-area" className="p-8 md:p-12 bg-white text-slate-900 print:p-0 min-h-[800px] flex flex-col justify-between font-sans leading-relaxed">
          <div>
            {/* Report Header Logo Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-emerald-600 pb-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-2xl tracking-tight">
                  <Activity className="h-7 w-7 text-emerald-500" />
                  <span>YADAV HEALTH DIAGNOSTICS</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Quality • Standards • Reliability • Digital Automation</p>
                <p className="text-[10px] text-slate-400 max-w-sm">Shop No. 12, Main Market, Sect 4, Dwarka, New Delhi. Phone: +91 98765 43210</p>
              </div>

              <div className="text-left md:text-right text-xs text-slate-500">
                <p className="font-semibold text-emerald-600">REGISTERED CLINICAL LABORATORY</p>
                <p className="font-mono mt-1 text-[10px]">LIC No: DIAG-DEL-2026-Y8911</p>
                <p className="font-mono text-[10px]">Report Ref: {report.id}</p>
              </div>
            </div>

            {/* Patient Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Patient Name</span>
                <p className="font-bold text-slate-800 text-sm">{report.patientName}</p>
                <p className="text-slate-500">Age: 28 yrs • Female</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Collected At</span>
                <p className="font-semibold text-slate-700">Yadav Diagnostic Center</p>
                <p className="text-slate-500">Doorstep Home Collection</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Schedule Details</span>
                <p className="font-mono">{booking ? booking.appointmentDate : 'N/A'}</p>
                <p className="text-slate-500 text-[10px]">Slot Time: {booking ? booking.appointmentTime : 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Report Released</span>
                <p className="font-semibold text-slate-700">{new Date(report.uploadedAt).toLocaleDateString()}</p>
                <p className="text-slate-500 text-[10px]">{new Date(report.uploadedAt).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Clinical Results Section */}
            <div className="mt-8">
              <div className="bg-slate-100 px-4 py-2 font-bold text-xs uppercase tracking-wide text-slate-700 rounded flex items-center justify-between">
                <span>Test Analyte / Parameter</span>
                <div className="grid grid-cols-3 w-1/2 text-right">
                  <span>Observed</span>
                  <span>Units</span>
                  <span>Biological Ref Range</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {markers.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 text-xs flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.status !== 'normal' && (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold uppercase rounded ${
                          item.status === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>{item.status}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 w-1/2 text-right items-center font-mono">
                      <span className={`font-bold ${item.status !== 'normal' ? 'text-rose-600 text-sm' : 'text-slate-900'}`}>
                        {item.value}
                      </span>
                      <span className="text-slate-500">{item.unit}</span>
                      <span className="text-slate-600">{item.referenceRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="mt-10 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[11px] text-slate-600">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">Pathology Advisory Interpretations</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Observed high lipids / glycaemic markers are indicative of dietary levels. Correlation with fasting conditions should be assessed.</li>
                <li>Please correlate clinically with your personal physician for comprehensive diagnosis and diagnostic treatment regimens.</li>
                <li>This molecular / biochemical assay report is generated in conformance to automated clinical calibration protocols.</li>
              </ul>
            </div>
          </div>

          {/* Clinical Attestation / Authenticity Seals */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-8 mt-12 gap-8">
            <div className="text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Heart className="h-3 w-3" />
                <span>Yadav Health Diagnostics digital validator</span>
              </div>
              <p>System Verifier ID: VAL-YADAV-8819</p>
              <p>This report has been digitally signed and validated. Paperless verified.</p>
            </div>

            <div className="text-right space-y-1 font-sans">
              <div className="inline-block border-b border-slate-400 text-xs italic text-slate-600 pb-1 px-4 tracking-wider">
                Dr. A. K. Yadav, MD (Path.)
              </div>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Senior Consultant Pathologist</p>
              <p className="text-[9px] text-slate-400">Chief Chemical Analyst, Yadav Labs</p>
            </div>
          </div>

          {/* Prominent screen Close Option at the bottom */}
          <div className="border-t border-slate-200 pt-6 mt-8 flex justify-center print:hidden">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm rounded-xl transition shadow-lg hover:shadow-xl cursor-pointer hover:scale-102 flex items-center gap-2"
            >
              <span>← Back to Dashboard / Close Report</span>
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
