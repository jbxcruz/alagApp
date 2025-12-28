'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  Pill,
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  Stethoscope,
  SmilePlus,
  ChevronRight,
  Clock,
  History,
  Zap,
  BarChart3,
  X,
} from 'lucide-react';
import { Card, Button, Badge, useToast } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface HealthData {
  checkIns: any[];
  vitals: any[];
  exercises: any[];
  nutrition: any[];
  water: any[];
  symptoms: any[];
  medications: any[];
  medicationDoses: any[];
  goals: any[];
}

interface GeneratedReport {
  id: string;
  period: string;
  periodLabel: string;
  content: string;
  generatedAt: Date;
  dataSnapshot: {
    checkIns: number;
    vitals: number;
    exercises: number;
    nutrition: number;
    water: number;
    symptoms: number;
    medications: number;
  };
}

const reportPeriods = [
  { value: '7', label: 'Weekly', description: 'Last 7 days' },
  { value: '14', label: 'Bi-Weekly', description: 'Last 14 days' },
  { value: '30', label: 'Monthly', description: 'Last 30 days' },
];

const dataCategories = [
  { key: 'checkIns', label: 'Check-ins', icon: SmilePlus, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { key: 'vitals', label: 'Vitals', icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10' },
  { key: 'exercises', label: 'Exercise', icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { key: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed, color: 'text-green-500', bg: 'bg-green-500/10' },
  { key: 'water', label: 'Hydration', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'symptoms', label: 'Symptoms', icon: Stethoscope, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { key: 'medications', label: 'Meds', icon: Pill, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

export default function AIReportsPage() {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<GeneratedReport | null>(null);
  const [pastReports, setPastReports] = useState<GeneratedReport[]>([]);
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchDataCounts();
    loadPastReports();
  }, []);

  const fetchDataCounts = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const days = parseInt(selectedPeriod);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString();
    const startDateStr = startDate.toISOString().split('T')[0];

    const [checkIns, vitals, exercises, nutrition, water, symptoms, medications] = await Promise.all([
      supabase.from('check_ins').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('check_in_date', startDateStr),
      supabase.from('vitals').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('recorded_at', startStr),
      supabase.from('exercise_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('nutrition_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('water_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('symptom_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('medications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
    ]);

    setDataCounts({
      checkIns: checkIns.count || 0,
      vitals: vitals.count || 0,
      exercises: exercises.count || 0,
      nutrition: nutrition.count || 0,
      water: water.count || 0,
      symptoms: symptoms.count || 0,
      medications: medications.count || 0,
    });
  };

  const loadPastReports = () => {
    try {
      const stored = localStorage.getItem('alagapp_reports');
      if (stored) {
        const reports = JSON.parse(stored);
        setPastReports(reports.map((r: any) => ({
          ...r,
          generatedAt: new Date(r.generatedAt),
        })));
      }
    } catch (e) {
      console.error('Failed to load past reports:', e);
    }
  };

  const saveReport = (report: GeneratedReport) => {
    try {
      const reports = [report, ...pastReports].slice(0, 10);
      localStorage.setItem('alagapp_reports', JSON.stringify(reports));
      setPastReports(reports);
    } catch (e) {
      console.error('Failed to save report:', e);
    }
  };

  useEffect(() => {
    fetchDataCounts();
  }, [selectedPeriod]);

  const fetchHealthData = async (days: number): Promise<HealthData> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { checkIns: [], vitals: [], exercises: [], nutrition: [], water: [], symptoms: [], medications: [], medicationDoses: [], goals: [] };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString();
    const startDateStr = startDate.toISOString().split('T')[0];

    const [checkInsRes, vitalsRes, exercisesRes, nutritionRes, waterRes, symptomsRes, medicationsRes, dosesRes, goalsRes] = await Promise.all([
      supabase.from('check_ins').select('*').eq('user_id', user.id).gte('check_in_date', startDateStr),
      supabase.from('vitals').select('*').eq('user_id', user.id).gte('recorded_at', startStr),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('water_logs').select('*').eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('symptom_logs').select('*').eq('user_id', user.id).gte('logged_at', startStr),
      supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('medication_doses').select('*').eq('user_id', user.id).gte('scheduled_at', startStr),
      supabase.from('health_goals').select('*').eq('user_id', user.id).eq('is_active', true),
    ]);

    return {
      checkIns: checkInsRes.data || [],
      vitals: vitalsRes.data || [],
      exercises: exercisesRes.data || [],
      nutrition: nutritionRes.data || [],
      water: waterRes.data || [],
      symptoms: symptomsRes.data || [],
      medications: medicationsRes.data || [],
      medicationDoses: dosesRes.data || [],
      goals: goalsRes.data || [],
    };
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      const days = parseInt(selectedPeriod);
      const healthData = await fetchHealthData(days);

      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthData, periodDays: days }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const { report: content } = await response.json();
      const periodLabel = reportPeriods.find(p => p.value === selectedPeriod)?.label || 'Report';

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        period: selectedPeriod,
        periodLabel: `${periodLabel} Health Report`,
        content,
        generatedAt: new Date(),
        dataSnapshot: {
          checkIns: healthData.checkIns.length,
          vitals: healthData.vitals.length,
          exercises: healthData.exercises.length,
          nutrition: healthData.nutrition.length,
          water: healthData.water.length,
          symptoms: healthData.symptoms.length,
          medications: healthData.medications.length,
        },
      };

      setCurrentReport(newReport);
      saveReport(newReport);
      showToast('success', 'Health report generated!');
    } catch (error: any) {
      console.error('Report generation error:', error);
      showToast('error', error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Report downloaded!');
  };

  const totalRecords = Object.values(dataCounts).reduce((a, b) => a + b, 0);

  return (
    <DashboardShell>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 md:mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">AI Health Reports</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 hidden md:block">Personalized insights from Faith AI</p>
          </div>
        </div>
        {pastReports.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            <Badge variant="secondary">{pastReports.length}</Badge>
          </Button>
        )}
      </motion.div>

      {/* Main Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* Period Selection */}
          <Card className="p-4 md:p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              Report Period
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              {reportPeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={cn(
                    'flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-1 lg:gap-3 p-3 rounded-xl border-2 transition-all',
                    selectedPeriod === period.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-[#293548] hover:border-primary-300 dark:hover:border-primary-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-gray-700 dark:text-slate-300'
                  )}
                >
                  <span className="font-medium text-sm">{period.label}</span>
                  <span className="text-xs opacity-70 hidden lg:inline">{period.description}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Data Stats */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Data Available
              </h3>
              <Badge variant="secondary">{totalRecords} records</Badge>
            </div>
            {/* Mobile/Tablet: Horizontal scroll, Desktop: 2-column grid */}
            <div className="flex lg:grid lg:grid-cols-2 gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
              {dataCategories.map((cat) => (
                <div
                  key={cat.key}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg flex-shrink-0 min-w-[100px] lg:min-w-0",
                    cat.bg
                  )}
                >
                  <cat.icon className={cn('w-4 h-4', cat.color)} />
                  <span className="text-xs text-gray-600 dark:text-slate-400 lg:flex-1">{cat.label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto">{dataCounts[cat.key] || 0}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || totalRecords === 0}
            className="w-full py-4 text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Report
              </>
            )}
          </Button>
          {totalRecords === 0 && (
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
              Log some health data to generate a report
            </p>
          )}
        </motion.div>

        {/* Right Column - Report Display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="h-full min-h-[500px] md:min-h-[600px] flex flex-col">
            {currentReport ? (
              <>
                {/* Report Header */}
                <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 dark:border-[#293548]">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg">{currentReport.periodLabel}</h2>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">
                      Generated {currentReport.generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <Button variant="outline" size="sm" onClick={() => downloadReport(currentReport.content, currentReport.periodLabel)}>
                      <Download className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Download</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={isGenerating}>
                      <RefreshCw className={cn("w-4 h-4 md:mr-2", isGenerating && "animate-spin")} />
                      <span className="hidden md:inline">Regenerate</span>
                    </Button>
                  </div>
                </div>

                {/* Data Snapshot Bar */}
                <div className="flex items-center gap-2 p-3 md:p-4 bg-gray-50 dark:bg-[#1A2742] border-b border-gray-200 dark:border-[#293548] overflow-x-auto">
                  {dataCategories.map((cat) => (
                    <div key={cat.key} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#131C2E] rounded-lg whitespace-nowrap flex-shrink-0">
                      <cat.icon className={cn('w-3.5 h-3.5', cat.color)} />
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {currentReport.dataSnapshot[cat.key as keyof typeof currentReport.dataSnapshot]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">{cat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Report Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 md:p-6 border border-blue-100 dark:border-blue-800/30">
                    <pre className="whitespace-pre-wrap text-sm md:text-base text-gray-800 dark:text-slate-200 font-sans leading-relaxed">
                      {currentReport.content}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-10">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-10 h-10 md:w-14 md:h-14 text-purple-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-3">No Report Yet</h3>
                <p className="text-gray-500 dark:text-slate-400 max-w-md mb-6 text-sm md:text-base">
                  Select a time period and click &quot;Generate Report&quot; to get personalized health insights from Faith AI.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {dataCategories.slice(0, 5).map((cat) => (
                    <div key={cat.key} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs", cat.bg)}>
                      <cat.icon className={cn('w-3.5 h-3.5', cat.color)} />
                      <span className="text-gray-600 dark:text-slate-400">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* History Slide-over Panel */}
      <AnimatePresence>
        {showHistory && pastReports.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 max-w-md bg-white dark:bg-[#131C2E] shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 dark:border-[#293548]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {pastReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => {
                      setCurrentReport(report);
                      setShowHistory(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl transition-all text-left',
                      currentReport?.id === report.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 dark:border-primary-700'
                        : 'hover:bg-sky-50 dark:hover:bg-sky-900/20 border-2 border-transparent'
                    )}
                  >
                    <div>
                      <p className={cn(
                        "font-medium",
                        currentReport?.id === report.id
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-gray-900 dark:text-white"
                      )}>{report.periodLabel}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {report.generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}