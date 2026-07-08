import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Send, 
  Upload, 
  Sparkles, 
  Terminal, 
  ArrowRight, 
  ChevronRight, 
  Calendar, 
  User, 
  X, 
  CreditCard, 
  Percent, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FolderOpen,
  Printer,
  FileText,
  Download,
  Search
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { jsPDF } from 'jspdf';

interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface InvoiceRecord {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface BillRecord {
  id: string;
  vendor: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface FinanceState {
  bankBalance: number;
  moneyInMonth: number;
  moneyOutMonth: number;
  revenueYtd: number;
  expensesYtd: number;
  expenses: ExpenseRecord[];
  receivables: InvoiceRecord[];
  payables: BillRecord[];
}

const DEFAULT_MANAGER_FINANCE_DATA: FinanceState = {
  bankBalance: 240000.00,
  moneyInMonth: 85000.00,
  moneyOutMonth: 32000.00,
  revenueYtd: 780000.00,
  expensesYtd: 310000.00,
  expenses: [
    { id: 'exp-m1', category: 'Staff Wages', amount: 15000.00, description: 'Nakamal bar staff weekly wages', date: '2026-06-01' },
    { id: 'exp-m2', category: 'Crop Sourcing', amount: 12000.00, description: 'Purchase of noble fresh roots batch from growers', date: '2026-06-02' },
    { id: 'exp-m3', category: 'Transport Fees', amount: 3500.00, description: 'Kava cargo delivery & truck transport log fees', date: '2026-06-03' },
    { id: 'exp-m4', category: 'Utilities', amount: 2500.00, description: 'UNELCO water bills and power/light bills', date: '2026-05-28' },
    { id: 'exp-m5', category: 'Venue Rent', amount: 15000.00, description: 'Nakamal retail premises monthly Rent bill', date: '2026-05-25' }
  ],
  receivables: [
    { id: 'INV-mgr-01', client: 'Grand Casino Private Event / Function', amount: 45000.00, dueDate: '2026-06-15', status: 'Pending' },
    { id: 'INV-mgr-02', client: 'Vila Tourism Group Charter Reception', amount: 28000.00, dueDate: '2026-05-28', status: 'Overdue' },
    { id: 'INV-mgr-03', client: 'Tanna Sunset Resto Group Function', amount: 32000.00, dueDate: '2026-06-20', status: 'Pending' },
    { id: 'INV-mgr-04', client: 'Melanesian Resort Tourist Event Invoice', amount: 17500.00, dueDate: '2026-05-10', status: 'Paid' }
  ],
  payables: [
    { id: 'BILL-mgr-01', vendor: "Chief's Kava Yard Tanna (Crop roots sourcing)", amount: 15500.00, dueDate: '2026-06-18', status: 'Pending' },
    { id: 'BILL-mgr-02', vendor: 'Pentecost Roots Cooperatives (Kava)', amount: 8000.00, dueDate: '2026-05-20', status: 'Overdue' },
    { id: 'BILL-mgr-03', vendor: 'UNELCO Water & Power Utilities bill', amount: 3500.00, dueDate: '2026-06-30', status: 'Pending' },
    { id: 'BILL-mgr-04', vendor: 'Vanuatu Custom Bagging Inc', amount: 7500.00, dueDate: '2026-05-15', status: 'Paid' }
  ]
};

const DEFAULT_SUPPLIER_FINANCE_DATA: FinanceState = {
  bankBalance: 580000.00,
  moneyInMonth: 180000.00,
  moneyOutMonth: 75000.00,
  revenueYtd: 1650000.00,
  expensesYtd: 620000.00,
  expenses: [
    { id: 'exp-s1', category: 'Harvest Labor', amount: 45000.00, description: 'Harvesting team wages (250kg noble roots collected Pentecost)', date: '2026-06-01' },
    { id: 'exp-s2', category: 'Marine Freight', amount: 22000.00, description: 'Inter-island maritime sea cargo vessel shipping logs', date: '2026-06-02' },
    { id: 'exp-s3', category: 'Weeding Labor', amount: 4500.00, description: 'Weeding team wages (Pre-planting prep fields 1-4)', date: '2026-06-03' },
    { id: 'exp-s4', category: 'Prospectus Runs', amount: 5000.00, description: 'Regional prospectus distribution runs & wholesale print', date: '2026-05-28' },
    { id: 'exp-s5', category: 'Transport Logistics', amount: 3500.00, description: 'Truck road transport distribution to Port Vila wharf', date: '2026-05-25' }
  ],
  receivables: [
    { id: 'INV-sup-01', client: 'Chief Nakamal Vila Gateway (Consignment: 500kg)', amount: 75000.00, dueDate: '2026-06-15', status: 'Pending' },
    { id: 'INV-sup-02', client: 'Hideaway Blue Water Resort Consignment (350kg)', amount: 55000.00, dueDate: '2026-05-28', status: 'Overdue' },
    { id: 'INV-sup-03', client: 'The Sovereign Shells Lounge Consignment (200kg)', amount: 32000.00, dueDate: '2026-06-20', status: 'Pending' },
    { id: 'INV-sup-04', client: 'Tanna Sunset Nakamal Hub Consignment (100kg)', amount: 17500.00, dueDate: '2026-05-10', status: 'Paid' }
  ],
  payables: [
    { id: 'BILL-sup-01', vendor: 'Pentecost Growers Cooperative (Raw kava roots harvest)', amount: 48000.00, dueDate: '2026-06-18', status: 'Pending' },
    { id: 'BILL-sup-02', vendor: 'Vanuatu Sea Freight Ltd (Marine cargo lease)', amount: 15000.00, dueDate: '2026-05-15', status: 'Paid' },
    { id: 'BILL-sup-03', vendor: 'Custom Port Vila Wharf Clearance Group', amount: 3500.00, dueDate: '2026-06-30', status: 'Pending' },
    { id: 'BILL-sup-04', vendor: 'EPIC Bags and Sacks Vanuatu (Bulk kava sacks)', amount: 7500.00, dueDate: '2026-05-20', status: 'Overdue' }
  ]
};

interface FinanceDashboardProps {
  role?: 'manager' | 'supplier';
}

export default function FinanceDashboard({ role = 'manager' }: FinanceDashboardProps) {
  const { formatPrice, currency } = useCurrency();
  const { t } = useLanguage();
  
  const storageKey = `kava_finance_data_${role}_v2`;
  const defaultData = role === 'manager' ? DEFAULT_MANAGER_FINANCE_DATA : DEFAULT_SUPPLIER_FINANCE_DATA;

  const [data, setData] = useState<FinanceState>(() => {
    try {
      const persisted = localStorage.getItem(storageKey);
      if (persisted) return JSON.parse(persisted);
    } catch (e) {
      console.warn("Could not parse " + storageKey, e);
    }
    return defaultData;
  });

  // Saving updates safely
  const persistData = (updated: FinanceState) => {
    setData(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed persisting " + storageKey, e);
    }
  };

  // Dynamic Categories list
  const categoriesList = role === 'manager' 
    ? ['Staff Wages', 'Crop Sourcing', 'Transport Fees', 'Utilities', 'Venue Rent']
    : ['Harvest Labor', 'Weeding Labor', 'Marine Freight', 'Transport Logistics', 'Prospectus Runs'];

  // v.0 Prompt & Shell States
  const [promptQuery, setPromptQuery] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  // Modals / Dropdowns State
  const [activeForm, setActiveForm] = useState<'none' | 'expense' | 'invoice' | 'receipt'>('none');

  // Bank-friendly Cash Flow Statement customization states
  const [statementPeriod, setStatementPeriod] = useState<'MONTH' | 'YTD'>('MONTH');
  const [investingOutflow, setInvestingOutflow] = useState(role === 'manager' ? 25000 : 80000); // e.g. drying/grinding machinery purchase
  const [financingInflow, setFinancingInflow] = useState(role === 'manager' ? 50000 : 150000);   // e.g. bank loan payout / microfinance credit
  const [financingOutflow, setFinancingOutflow] = useState(role === 'manager' ? 10000 : 30000);  // e.g. bank loan repayment
  const [officerName, setOfficerName] = useState(role === 'manager' ? 'Alick Noel' : 'Rachel Pentecost');
  const [signatureText, setSignatureText] = useState('');
  const [isStatementStampApproved, setIsStatementStampApproved] = useState(false);
  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);

  // Master Filterable Ledger State
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Overdue'>('all');

  // Budget Planner State
  const [projectionMonths, setProjectionMonths] = useState<number>(6);
  const [growthInflowRate, setGrowthInflowRate] = useState<number>(5);
  const [inflationOutflowRate, setInflationOutflowRate] = useState<number>(3);
  
  // Custom Projected Milestones
  const [customMilestones, setCustomMilestones] = useState<any[]>(() => {
    return role === 'manager' 
      ? [
          { id: 'm-1', title: 'Port Vila Shaker Sieve Purchase', amount: 45000, type: 'outflow', monthOffset: 2, category: 'Equipment' },
          { id: 'm-2', title: 'Fiji Nobel Kava Crop Lot Sourcing', amount: 90000, type: 'outflow', monthOffset: 4, category: 'Inventory' },
          { id: 'm-3', title: 'Grand Opening - Waterfront Bar Expansion', amount: 150000, type: 'inflow', monthOffset: 5, category: 'Revenue' }
        ]
      : [
          { id: 's-1', title: 'Pentecost Sun-Drying Bed Lease', amount: 55000, type: 'outflow', monthOffset: 1, category: 'Equipment' },
          { id: 's-2', title: 'Bulk Export Shipping Cargo Container Sacks', amount: 110000, type: 'outflow', monthOffset: 3, category: 'Logistics' },
          { id: 's-3', title: 'Noumea Export Consortium Contract', amount: 380000, type: 'inflow', monthOffset: 5, category: 'Revenue' }
        ];
  });

  const [newMilestoneForm, setNewMilestoneForm] = useState({
    title: '',
    amount: '',
    type: 'outflow' as 'inflow' | 'outflow',
    monthOffset: 3,
    category: 'General'
  });

  // Calculate dynamic month names starting chronologically from June 2026
  const getProjectedMonthsLabels = (offset: number) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let year = 2026;
    let monthIdx = 5; // June 2026 is index 5
    
    monthIdx += offset;
    while (monthIdx >= 12) {
      monthIdx -= 12;
      year += 1;
    }
    return `${months[monthIdx]} ${year}`;
  };

  // Compile projection points dynamically
  const getProjectionData = () => {
    const list = [];
    let currentBalance = data.bankBalance;
    const baseInflow = data.moneyInMonth || 10000;
    const baseOutflow = data.moneyOutMonth || 5000;

    for (let i = 1; i <= projectionMonths; i++) {
      const projectedInflowMultiplier = Math.pow(1 + growthInflowRate / 100, i);
      const projectedOutflowMultiplier = Math.pow(1 + inflationOutflowRate / 100, i);

      const recurringInflow = Math.round(baseInflow * projectedInflowMultiplier);
      const recurringOutflow = Math.round(baseOutflow * projectedOutflowMultiplier);

      const monthMilestones = customMilestones.filter(m => m.monthOffset === i);
      let milestoneInflowTotal = 0;
      let milestoneOutflowTotal = 0;

      monthMilestones.forEach(m => {
        if (m.type === 'inflow') {
          milestoneInflowTotal += m.amount;
        } else {
          milestoneOutflowTotal += m.amount;
        }
      });

      const totalMonthInflow = recurringInflow + milestoneInflowTotal;
      const totalMonthOutflow = recurringOutflow + milestoneOutflowTotal;
      const netMonthlySurplus = totalMonthInflow - totalMonthOutflow;
      currentBalance += netMonthlySurplus;

      list.push({
        name: getProjectedMonthsLabels(i),
        monthIndex: i,
        recurringInflow,
        recurringOutflow,
        milestoneInflow: milestoneInflowTotal,
        milestoneOutflow: milestoneOutflowTotal,
        inflow: totalMonthInflow,
        outflow: totalMonthOutflow,
        balance: currentBalance,
        netSurplus: netMonthlySurplus,
        milestones: monthMilestones
      });
    }

    return list;
  };

  // Sync parameters when role changes
  useEffect(() => {
    setOfficerName(role === 'manager' ? 'Alick Noel' : 'Rachel Pentecost');
    setInvestingOutflow(role === 'manager' ? 25000 : 80000);
    setFinancingInflow(role === 'manager' ? 50000 : 150000);
    setFinancingOutflow(role === 'manager' ? 10000 : 30000);
    setSignatureText('');
    setIsStatementStampApproved(false);

    setCustomMilestones(role === 'manager'
      ? [
          { id: 'm-1', title: 'Port Vila Shaker Sieve Purchase', amount: 45000, type: 'outflow', monthOffset: 2, category: 'Equipment' },
          { id: 'm-2', title: 'Fiji Nobel Kava Crop Lot Sourcing', amount: 90000, type: 'outflow', monthOffset: 4, category: 'Inventory' },
          { id: 'm-3', title: 'Grand Opening - Waterfront Bar Expansion', amount: 150000, type: 'inflow', monthOffset: 5, category: 'Revenue' }
        ]
      : [
          { id: 's-1', title: 'Pentecost Sun-Drying Bed Lease', amount: 55000, type: 'outflow', monthOffset: 1, category: 'Equipment' },
          { id: 's-2', title: 'Bulk Export Shipping Cargo Container Sacks', amount: 110000, type: 'outflow', monthOffset: 3, category: 'Logistics' },
          { id: 's-3', title: 'Noumea Export Consortium Contract', amount: 380000, type: 'inflow', monthOffset: 5, category: 'Revenue' }
        ]
    );
  }, [role]);
  
  // Direct Add Form States
  const [expenseForm, setExpenseForm] = useState({ category: role === 'manager' ? 'Staff Wages' : 'Harvest Labor', amount: '', description: '' });

  useEffect(() => {
    setExpenseForm(prev => ({
      ...prev,
      category: role === 'manager' ? 'Staff Wages' : 'Harvest Labor'
    }));
  }, [role]);

  const [invoiceForm, setInvoiceForm] = useState({ client: '', amount: '', dueDate: '' });

  // Receipt Drag Zone State
  const [dragActive, setDragActive] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<any | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);

  // Compute stats on-the-fly
  const currentMonthProfit = data.moneyInMonth - data.moneyOutMonth;
  const ytdProfit = data.revenueYtd - data.expensesYtd;

  // Compute category totals
  const categoryTotals: Record<string, number> = {};
  data.expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  
  const totalExpensesSum = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  // Chart Interval Selector State
  const [chartInterval, setChartInterval] = useState<'monthly' | 'quarterly'>('monthly');

  // Format short values for Y Axis
  const formatShortPrice = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  // Compile dynamic charts comparing inflow vs outflow
  const getChartData = () => {
    if (chartInterval === 'monthly') {
      return role === 'manager' ? [
        { name: 'Jan 2026', inflow: 70000, outflow: 29000 },
        { name: 'Feb 2026', inflow: 75000, outflow: 31000 },
        { name: 'Mar 2026', inflow: 82000, outflow: 30000 },
        { name: 'Apr 2026', inflow: 80000, outflow: 34000 },
        { name: 'May 2026', inflow: 88000, outflow: 33000 },
        { name: 'Jun 2026', inflow: data.moneyInMonth, outflow: data.moneyOutMonth }
      ] : [
        { name: 'Jan 2026', inflow: 150000, outflow: 65000 },
        { name: 'Feb 2026', inflow: 160000, outflow: 68000 },
        { name: 'Mar 2026', inflow: 175000, outflow: 72000 },
        { name: 'Apr 2026', inflow: 170000, outflow: 70000 },
        { name: 'May 2026', inflow: 195000, outflow: 78000 },
        { name: 'Jun 2026', inflow: data.moneyInMonth, outflow: data.moneyOutMonth }
      ];
    } else {
      return role === 'manager' ? [
        { name: 'Q3-25', inflow: 210000, outflow: 85000 },
        { name: 'Q4-25', inflow: 235000, outflow: 92000 },
        { name: 'Q1-26', inflow: 227000, outflow: 90000 },
        { name: 'Q2-26', inflow: 168000 + data.moneyInMonth, outflow: 67000 + data.moneyOutMonth }
      ] : [
        { name: 'Q3-25', inflow: 450000, outflow: 190000 },
        { name: 'Q4-25', inflow: 510000, outflow: 210000 },
        { name: 'Q1-26', inflow: 485000, outflow: 205000 },
        { name: 'Q2-26', inflow: 365000 + data.moneyInMonth, outflow: 148000 + data.moneyOutMonth }
      ];
    }
  };

  // Custom Chart Tooltip component styled for Pacific Nakamal
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inf = payload[0]?.value || 0;
      const out = payload[1]?.value || 0;
      const sur = inf - out;
      return (
        <div className="bg-neutral-950/95 border border-white/10 p-3.5 rounded-2xl shadow-2xl font-mono text-left space-y-1.5 backdrop-blur-md">
          <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{label}</p>
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t("Inflow")}:
            </span>
            <span className="text-xs font-black text-emerald-400">{formatPrice(inf)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {t("Outflow")}:
            </span>
            <span className="text-xs font-black text-rose-500">{formatPrice(out)}</span>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-white/5 pt-1.5 mt-1.5 font-sans">
            <span className="text-xs text-neutral-400 font-bold">{t("Net Surplus")}:</span>
            <span className={`text-xs font-black ${sur >= 0 ? 'text-cyan-400' : 'text-rose-500'}`}>
              {sur >= 0 ? '+' : ''}{formatPrice(sur)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Dynamic Cash Flow Statement Calculations
  const isYtd = statementPeriod === 'YTD';
  const totalReceipts = isYtd ? data.revenueYtd : data.moneyInMonth;
  const totalOutflows = isYtd ? data.expensesYtd : data.moneyOutMonth;
  
  // Calculate relative ratios for segmenting Operating Outflows
  const wagesOutflow = data.expenses
    .filter(e => ['Staff Wages', 'Harvest Labor', 'Weeding Labor'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const sourcingOutflow = data.expenses
    .filter(e => e.category === 'Crop Sourcing')
    .reduce((sum, e) => sum + e.amount, 0);

  const operatingOtherOutflow = data.expenses
    .filter(e => !['Staff Wages', 'Harvest Labor', 'Weeding Labor', 'Crop Sourcing'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const listTotal = (wagesOutflow + sourcingOutflow + operatingOtherOutflow) || 1;

  // Distribute outflows proportionally
  const distributedWages = totalOutflows * (wagesOutflow / listTotal);
  const distributedSourcing = totalOutflows * (sourcingOutflow / listTotal);
  const distributedOther = totalOutflows * (operatingOtherOutflow / listTotal);

  const netOperatingCashFlow = totalReceipts - totalOutflows;
  const netInvestingCashFlow = -investingOutflow;
  const netFinancingCashFlow = financingInflow - financingOutflow;
  const netCashIncrease = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

  const endingBankBalance = data.bankBalance;
  const beginningBankBalance = endingBankBalance - netCashIncrease;

  // Master filterable ledger logic
  const getCompiledLedgerItems = () => {
    const list: {
      id: string;
      date: string;
      type: 'inflow' | 'outflow';
      source: string;
      payeeOrPayer: string;
      description: string;
      amount: number;
      status: 'Paid' | 'Pending' | 'Overdue';
    }[] = [];
    
    // 1. Direct Expense Registers
    data.expenses.forEach(e => {
      list.push({
        id: e.id,
        date: e.date || '2026-06-10',
        type: 'outflow',
        source: 'Expense',
        payeeOrPayer: e.category,
        description: e.description,
        amount: e.amount,
        status: 'Paid'
      });
    });

    // 2. Receivables / Invoices (Inflow)
    data.receivables.forEach(r => {
      list.push({
        id: r.id,
        date: r.dueDate || '2026-06-10',
        type: 'inflow',
        source: 'Invoice',
        payeeOrPayer: r.client,
        description: `Invoice for ${r.client}`,
        amount: r.amount,
        status: r.status
      });
    });

    // 3. Payables / Bills (Outflow)
    data.payables.forEach(p => {
      list.push({
        id: p.id,
        date: p.dueDate || '2026-06-10',
        type: 'outflow',
        source: 'Bill',
        payeeOrPayer: p.vendor,
        description: `Bill from ${p.vendor}`,
        amount: p.amount,
        status: p.status
      });
    });

    // Sort chronologically (latest date first)
    list.sort((a, b) => b.date.localeCompare(a.date));

    // Apply filters
    return list.filter(item => {
      // Type filter
      if (ledgerTypeFilter === 'inflow' && item.type !== 'inflow') return false;
      if (ledgerTypeFilter === 'outflow' && item.type !== 'outflow') return false;

      // Status filter
      if (ledgerStatusFilter !== 'all' && item.status !== ledgerStatusFilter) return false;

      // Search Query
      if (ledgerSearchQuery.trim() !== '') {
        const query = ledgerSearchQuery.toLowerCase();
        const matchesPayee = item.payeeOrPayer.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesSource = item.source.toLowerCase().includes(query);
        if (!matchesPayee && !matchesDesc && !matchesId && !matchesSource) return false;
      }

      return true;
    });
  };

  const exportFilteredLedgerToCSV = () => {
    const list = getCompiledLedgerItems();
    
    const headers = [
      "Date",
      "Type",
      "Record Class",
      "Payee/Customer/Vendor",
      "Description",
      "ID/Reference",
      "Amount (VUV)",
      "Status"
    ];

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = typeof val === 'string' ? val : String(val);
      const clean = str.replace(/"/g, '""');
      return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
    };

    const rows = list.map(item => [
      item.date,
      item.type === 'inflow' ? 'Cash Inflow (Revenue)' : 'Cash Outflow (Expense)',
      item.source,
      item.payeeOrPayer,
      item.description,
      item.id,
      item.type === 'inflow' ? `${item.amount}` : `-${item.amount}`,
      item.status
    ].map(escapeCSV));

    const csvContent = [headers.join(",")].concat(rows.map(r => r.join(","))).join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PacificKava_FilteredLedger_${role}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Programmatic ledger exporter for Xero & QuickBooks compatibility
  const exportLedgerToCSV = () => {
    const headers = [
      "Date",
      "Amount",
      "Currency",
      "Payee/Customer/Vendor",
      "Description",
      "Reference/ID",
      "Account/Category",
      "Statement Section",
      "Status"
    ];

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = typeof val === 'string' ? val : String(val);
      const clean = str.replace(/"/g, '""');
      return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
    };

    const rows: string[][] = [];

    // 1. Direct Expense Registers
    data.expenses.forEach(e => {
      rows.push([
        e.date || '2026-06-10',
        `-${e.amount}`,
        'VUV',
        e.category,
        e.description,
        e.id,
        e.category,
        "Operating Activities",
        "Paid"
      ].map(escapeCSV));
    });

    // 2. Paid Receivables / Invoices (Cash Inflow)
    data.receivables.filter(r => r.status === 'Paid').forEach(r => {
      rows.push([
        r.dueDate || '2026-06-10',
        `${r.amount}`,
        'VUV',
        r.client,
        `Invoice payment received from ${r.client}`,
        r.id,
        "Trade Revenue",
        "Operating Activities",
        "Paid"
      ].map(escapeCSV));
    });

    // 3. Paid Bills / Payables (Cash Outflow)
    data.payables.filter(p => p.status === 'Paid').forEach(p => {
      rows.push([
        p.dueDate || '2026-06-10',
        `-${p.amount}`,
        'VUV',
        p.vendor,
        `Bill paid to vendor ${p.vendor}`,
        p.id,
        "Trade Payable",
        "Operating Activities",
        "Paid"
      ].map(escapeCSV));
    });

    // 4. Custom Statement adjustments
    if (investingOutflow > 0) {
      rows.push([
        '2026-06-10',
        `-${investingOutflow}`,
        'VUV',
        'Equipment/Asset Vendor',
        'Capital expenditure asset purchase',
        'CAP-EXP-01',
        'Capital Assets',
        'Investing Activities',
        'Paid'
      ].map(escapeCSV));
    }

    if (financingInflow > 0) {
      rows.push([
        '2026-06-10',
        `${financingInflow}`,
        'VUV',
        'Development Banks / Microfinance Lender',
        'Microfinance loan drawdown key receipts',
        'LOAN-DR-01',
        'Loan Financing',
        'Financing Activities',
        'Paid'
      ].map(escapeCSV));
    }

    if (financingOutflow > 0) {
      rows.push([
        '2026-06-10',
        `-${financingOutflow}`,
        'VUV',
        'Development Banks',
        'Loan repayment principal and interest amortized',
        'LOAN-PAY-01',
        'Loan Debt Service',
        'Financing Activities',
        'Paid'
      ].map(escapeCSV));
    }

    // Sort rows chronologically
    rows.sort((a, b) => a[0].localeCompare(b[0]));

    const csvContent = [headers.join(",")].concat(rows.map(r => r.join(","))).join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PacificKava_CashFlow_Ledger_${role}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Programmatic corporate-grade PDF exporter for financial institutions
  const downloadStatementPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Header block
    doc.setFillColor(31, 41, 55); // dark charcoal
    doc.rect(0, 0, 595, 110, 'F');

    // Title text inside header
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PACIFIC KAVA TRADING GROUP", 40, 48);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(191, 219, 254);
    const coName = role === 'manager' 
      ? "NAKAMAL RETAIL OPERATING GROUP | PORT VILA, EFATE"
      : "EPIC AGRICULTURAL KAVA WHOLESALE | SANTO & PENTECOST";
    doc.text(coName, 40, 68);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text("Vanuatu National Financial Quality Submission No: CF-" + Math.floor(100000 + Math.random() * 900000), 40, 88);

    // Document title
    doc.setTextColor(31, 41, 55);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.text("CASH FLOW STATEMENT & UNDERWRITER STUDY", 40, 145);
    
    // Period details & Currency Context
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(`REPORTING PERIOD: ${isYtd ? 'YEAR TO DATE (YTD)' : 'MONTHLY (JUNE 2026)'}`, 40, 162);
    doc.text(`CURRENCY CONTEXT: ${currency} (Vanuatu Vatu)`, 40, 175);
    doc.text(`GENERATION DATE: ${new Date().toISOString().split('T')[0]}`, 40, 188);

    // Circular Stamp design inside PDF
    if (isStatementStampApproved) {
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.setLineWidth(1.5);
      doc.circle(500, 165, 32, 'D');
      doc.circle(500, 165, 29, 'D');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129);
      doc.text("VERIFIED", 478, 160);
      doc.text("BANK-GRADE", 472, 168);
      doc.text("APPROVED", 476, 176);
    } else {
      doc.setDrawColor(217, 119, 6); // amber-600
      doc.setLineWidth(1);
      doc.rect(460, 145, 80, 36, 'D');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(217, 119, 6);
      doc.text("PROVISIONAL", 473, 158);
      doc.text("DRAFT", 486, 168);
    }

    // Horizontal line separator
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(40, 205, 555, 205);

    // Section 1: Operating Activities
    let y = 225;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text("1. CASH FLOWS FROM OPERATING ACTIVITIES", 40, y);
    y += 20;

    const formatInPdfPrice = (num: number) => {
      return (num < 0 ? "-" : "") + formatPrice(Math.abs(num));
    };

    const drawRowInPdf = (label: string, amt: number, isTotal = false) => {
      doc.setFont("Helvetica", isTotal ? "bold" : "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text(label, 50, y);
      doc.text(formatInPdfPrice(amt), 480, y, { align: 'right' });
      
      if (isTotal) {
        doc.setDrawColor(31, 41, 55);
        doc.setLineWidth(1);
        doc.line(40, y + 4, 555, y + 4);
      }
      y += 18;
    };

    drawRowInPdf(t("Cash Receipts from Customers"), totalReceipts);
    drawRowInPdf(t("Cash Paid to Suppliers / Vendors"), -distributedSourcing);
    drawRowInPdf(t("Cash Paid for Wages"), -distributedWages);
    drawRowInPdf(role === 'manager' ? "Cash Paid for Utilities & Rent" : "Cash Paid for Freight & Prospectus Runs", -distributedOther);
    y -= 4;
    drawRowInPdf(t("Net Cash from Operating Activities"), netOperatingCashFlow, true);
    y += 10;

    // Section 2: Investing Activities
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text("2. CASH FLOWS FROM INVESTING ACTIVITIES", 40, y);
    y += 20;
    drawRowInPdf(t("Equipment / Asset Purchase"), -investingOutflow);
    y -= 4;
    drawRowInPdf(t("Net Cash from Investing Activities"), netInvestingCashFlow, true);
    y += 10;

    // Section 3: Financing Activities
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text("3. CASH FLOWS FROM FINANCING ACTIVITIES", 40, y);
    y += 20;
    drawRowInPdf(t("Microfinance Loan Drawdown"), financingInflow);
    drawRowInPdf(t("Loan Repayment"), -financingOutflow);
    y -= 4;
    drawRowInPdf(t("Net Cash from Financing Activities"), netFinancingCashFlow, true);
    y += 15;

    // Reconciliation block background
    doc.setFillColor(243, 244, 246);
    doc.rect(40, y, 515, 65, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(40, y, 515, 65, 'D');

    // Net increase / decrease
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("NET CASH OVERALL SURPLUS INCREASE", 55, y + 18);
    doc.text( (netCashIncrease >= 0 ? "+" : "") + formatPrice(netCashIncrease), 500, y + 18, { align: 'right' });

    doc.setFont("Helvetica", "normal");
    doc.text(t("Beginning Bank Balance"), 55, y + 36);
    doc.text(formatPrice(beginningBankBalance), 500, y + 36, { align: 'right' });

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text(t("Ending Bank Balance"), 55, y + 54);
    doc.text(formatPrice(endingBankBalance), 500, y + 54, { align: 'right' });
    y += 85;

    // Bottom disclosure
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    const splitNote = doc.splitTextToSize(
      "CERTIFICATION: This cash flow statement is fully prepared in accordance with the Vanuatu National Quality Standards for direct review and underwriter submission to the Reserve Bank of Vanuatu or recognized credit entities. Reconciled against decentralized local registers.",
      515
    );
    doc.text(splitNote, 40, y);
    y += 28;

    // Authorizations
    doc.setDrawColor(209, 213, 219);
    doc.line(40, y + 25, 220, y + 25);
    doc.line(335, y + 25, 515, y + 25);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text("ISSUING AUDITED OFFICER", 40, y + 36);
    doc.text("AUTHORIZED REPRESENTATIVE", 335, y + 36);

    doc.setFont("Helvetica", "normal");
    doc.text(officerName, 40, y + 48);
    doc.text("Vanuatu Development Branch Officer", 335, y + 48);

    // Dynamic signatures
    if (signatureText) {
      doc.setFont("Courier", "italic");
      doc.setFontSize(13);
      doc.setTextColor(29, 78, 216); // blue-700
      doc.text(signatureText, 50, y + 18);
    }

    if (isStatementStampApproved) {
      doc.setFont("Courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text("[VERIFIED SECURITIES E-SIGN]", 335, y + 18);
    }

    doc.save(`Kava_CashFlow_Statement_${role}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // v.0 Natural AI Prompt Handler
  const handleAIPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptQuery.trim() || isAiProcessing) return;

    setIsAiProcessing(true);
    setAiLogs([]);

    const logText = (text: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setAiLogs(prev => [...prev, text]);
          resolve();
        }, delay);
      });
    };

    await logText("▲ Booting v0.app Financial Agent Model (Sub-Node 512)...", 100);
    await logText(`[NLP Reader] Context parsed: "${promptQuery}"`, 300);
    await logText("[Ledger Sync] Interrogating decentralized local storage state...", 300);

    const query = promptQuery.toLowerCase();
    
    // Rule matching filters
    // 1. ADD EXPENSE (e.g. "add software expense $120", "add expense marketing $50")
    if (query.includes('expense') || query.includes('spend') || query.includes('buy') || query.includes('pay vendor')) {
      // Find amount pattern matching $, vt, vuv, etc.
      const amountMatch = query.match(/(?:\$|vt|vuv)?\s*(\d+(?:\.\d+)?)/i);
      const amt = amountMatch ? parseFloat(amountMatch[1]) : 120.00;
      
      // Categorize
      let matchedCategory = role === 'manager' ? 'Staff Wages' : 'Harvest Labor';
      if (role === 'manager') {
        if (query.includes('wage') || query.includes('staff') || query.includes('payroll') || query.includes('salary') || query.includes('labor') || query.includes('employee')) matchedCategory = 'Staff Wages';
        else if (query.includes('crop') || query.includes('kava') || query.includes('root') || query.includes('noble') || query.includes('grower')) matchedCategory = 'Crop Sourcing';
        else if (query.includes('transport') || query.includes('log') || query.includes('delivery') || query.includes('fee') || query.includes('taxi') || query.includes('cargo') || query.includes('freight')) matchedCategory = 'Transport Fees';
        else if (query.includes('power') || query.includes('light') || query.includes('water') || query.includes('electricity') || query.includes('unelco') || query.includes('bill') || query.includes('utility')) matchedCategory = 'Utilities';
        else if (query.includes('rent') || query.includes('lease') || query.includes('venue') || query.includes('premises') || query.includes('prop')) matchedCategory = 'Venue Rent';
      } else {
        if (query.includes('harvest') || query.includes('picker') || query.includes('gather') || query.includes('cut') || query.includes('wage') || query.includes('staff') || query.includes('payroll') || query.includes('labor') || query.includes('employee')) matchedCategory = 'Harvest Labor';
        else if (query.includes('weed') || query.includes('clean') || query.includes('clear') || query.includes('crop') || query.includes('farm')) matchedCategory = 'Weeding Labor';
        else if (query.includes('marine') || query.includes('ship') || query.includes('sea') || query.includes('freight') || query.includes('vessel') || query.includes('cargo') || query.includes('port')) matchedCategory = 'Marine Freight';
        else if (query.includes('transport') || query.includes('truck') || query.includes('road') || query.includes('log') || query.includes('delivery') || query.includes('fee') || query.includes('logistics')) matchedCategory = 'Transport Logistics';
        else if (query.includes('prospectus') || query.includes('marketing') || query.includes('flyer') || query.includes('run') || query.includes('promo') || query.includes('leaflet')) matchedCategory = 'Prospectus Runs';
      }
      
      // Determine description
      let desc = promptQuery;
      if (desc.length > 50) desc = desc.substring(0, 50) + "...";

      await logText(`[NLP Resolved] Type: EXPENSE_ADD | Category: "${matchedCategory}" | Amount: ${formatPrice(amt)}`, 400);
      await logText("[Ledger Sync] Safe audit subtraction. Updating balance accounts...", 300);

      const newExp: ExpenseRecord = {
        id: 'exp-' + Math.random().toString(36).substring(2, 9),
        category: matchedCategory,
        amount: amt,
        description: desc,
        date: new Date().toISOString().split('T')[0]
      };

      const newState = {
        ...data,
        bankBalance: data.bankBalance - amt,
        moneyOutMonth: data.moneyOutMonth + amt,
        expensesYtd: data.expensesYtd + amt,
        expenses: [newExp, ...data.expenses]
      };

      persistData(newState);
      await logText(`✓ Ledger re-balanced successfully. Spent ${formatPrice(amt)}. New cash level: ${formatPrice(newState.bankBalance)}`, 200);
      setPromptQuery("");
    } 
    // 2. SEND INVOICE / ADD RECEIVABLE (e.g. "send invoice $500 to Grand Casino")
    else if (query.includes('invoice') || query.includes('bill client') || query.includes('receive')) {
      const amountMatch = query.match(/(?:\$|vt|vuv)?\s*(\d+(?:\.\d+)?)/i);
      const amt = amountMatch ? parseFloat(amountMatch[1]) : 450.00;

      let client = "B2B Consignment Partner";
      if (query.includes('casino')) client = "Grand Casino & Lounge";
      else if (query.includes('hotel') || query.includes('resort')) client = "Pacific Lagoon Resort";
      else if (query.includes('lodge')) client = "Hideaway Island Lodge";
      else if (query.includes('vila')) client = "Vila Market Distributor";

      await logText(`[NLP Resolved] Type: CLIENT_INVOICE_SEND | Client: "${client}" | Amount: ${formatPrice(amt)}`, 400);
      await logText("[Invoice Generator] Dispatching PDF billing nodes via virtual mailer...", 300);

      const newInv: InvoiceRecord = {
        id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
        client,
        amount: amt,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days due
        status: 'Pending'
      };

      const newState = {
        ...data,
        receivables: [newInv, ...data.receivables]
      };

      persistData(newState);
      await logText(`✓ Invoice generation parsed. Added ${formatPrice(amt)} receivable entry.`, 200);
      setPromptQuery("");
    }
    // 3. ADD MONEY IN / INCOME (e.g. "record income $1200", "add $600 cash sale")
    else if (query.includes('income') || query.includes('sale') || query.includes('deposit') || query.includes('cash in') || query.includes('revenue')) {
      const amountMatch = query.match(/(?:\$|vt|vuv)?\s*(\d+(?:\.\d+)?)/i);
      const amt = amountMatch ? parseFloat(amountMatch[1]) : 950.00;

      await logText(`[NLP Resolved] Type: LEDGER_DEPOSIT | Source: Cash/Bank Safe | Amount: ${formatPrice(amt)}`, 400);

      const newState = {
        ...data,
        bankBalance: data.bankBalance + amt,
        moneyInMonth: data.moneyInMonth + amt,
        revenueYtd: data.revenueYtd + amt
      };

      persistData(newState);
      await logText(`✓ Deposit logged. Current bank/cash account standing: ${formatPrice(newState.bankBalance)}`, 300);
      setPromptQuery("");
    }
    // FALLBACK CHAT RESPONDER
    else {
      await logText("[NLP Alert] Query form general. Returning active cash flow metrics standard...", 400);
      await logText(`- Cash Surplus Month: ${formatPrice(currentMonthProfit)}`, 200);
      await logText(`- Dynamic Bank Reserves: ${formatPrice(data.bankBalance)}`, 100);
      await logText("💡 Try prompting: 'add crop sourcing expense 450 VT' or 'send invoice to Grand Casino for 1200 VT' to execute database state updates.", 200);
    }

    setIsAiProcessing(false);
  };

  // Drag Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      triggerReceiptScan(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerReceiptScan(e.target.files[0].name);
    }
  };

  // Receipt Scanner mock AI OCR parser
  const triggerReceiptScan = (fileName: string) => {
    setIsScanningReceipt(true);
    setScannedReceipt(null);

    setTimeout(() => {
      // Pick random parameters
      const mockOcrItems = role === 'manager' ? [
        { desc: 'Weekly wages for Nakamal bar team Efate', amt: 15000.00, category: 'Staff Wages' },
        { desc: 'Purchase 40kg Noble kava green roots Pentecost', amt: 12000.00, category: 'Crop Sourcing' },
        { desc: 'Taxi driver distribution delivery logs', amt: 3500.00, category: 'Transport Fees' },
        { desc: 'UNELCO water bills and electric meters', amt: 2500.00, category: 'Utilities' },
        { desc: 'Monthly rent for bar premises', amt: 15000.00, category: 'Venue Rent' }
      ] : [
        { desc: 'Weekly harvesting team labor payout Espiritu Santo', amt: 45000.00, category: 'Harvest Labor' },
        { desc: 'Pentecost weeding labor group contract reward', amt: 8500.00, category: 'Weeding Labor' },
        { desc: 'MV Southern Star marine sea cargo logistics shipping fee', amt: 22000.00, category: 'Marine Freight' },
        { desc: 'Port Vila wharf local truck delivery petrol fuel logs', amt: 3500.00, category: 'Transport Logistics' },
        { desc: 'Distribute print wholesale prospectus flyers regional run', amt: 5000.00, category: 'Prospectus Runs' }
      ];

      const item = mockOcrItems[Math.floor(Math.random() * mockOcrItems.length)];
      setScannedReceipt({
        fileName,
        vendor: 'Pacific Supply Hub',
        date: new Date().toISOString().split('T')[0],
        amount: item.amt,
        category: item.category,
        description: `Simulated OCR Parse: ${item.desc}`
      });
      setIsScanningReceipt(false);
    }, 1800);
  };

  // Forms Submissions
  const submitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) return;

    const newExp: ExpenseRecord = {
      id: 'exp-' + Math.random().toString(36).substring(2, 9),
      category: expenseForm.category,
      amount: amt,
      description: expenseForm.description || `${expenseForm.category} Payout`,
      date: new Date().toISOString().split('T')[0]
    };

    const newState = {
      ...data,
      bankBalance: data.bankBalance - amt,
      moneyOutMonth: data.moneyOutMonth + amt,
      expensesYtd: data.expensesYtd + amt,
      expenses: [newExp, ...data.expenses]
    };

    persistData(newState);
    setExpenseForm({ category: role === 'manager' ? 'Staff Wages' : 'Labor', amount: '', description: '' });
    setActiveForm('none');
  };

  const submitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(invoiceForm.amount);
    if (isNaN(amt) || amt <= 0 || !invoiceForm.client) return;

    const newInv: InvoiceRecord = {
      id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      client: invoiceForm.client,
      amount: amt,
      dueDate: invoiceForm.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending'
    };

    const newState = {
      ...data,
      receivables: [newInv, ...data.receivables]
    };

    persistData(newState);
    setInvoiceForm({ client: '', amount: '', dueDate: '' });
    setActiveForm('none');
  };

  const acceptScannedReceipt = () => {
    if (!scannedReceipt) return;

    const newExp: ExpenseRecord = {
      id: 'exp-' + Math.random().toString(36).substring(2, 9),
      category: scannedReceipt.category,
      amount: scannedReceipt.amount,
      description: scannedReceipt.description,
      date: scannedReceipt.date
    };

    const newState = {
      ...data,
      bankBalance: data.bankBalance - scannedReceipt.amount,
      moneyOutMonth: data.moneyOutMonth + scannedReceipt.amount,
      expensesYtd: data.expensesYtd + scannedReceipt.amount,
      expenses: [newExp, ...data.expenses]
    };

    persistData(newState);
    setScannedReceipt(null);
    setActiveForm('none');
  };

  // Mark invoice paid
  const toggleInvoicePaid = (id: string) => {
    const inv = data.receivables.find(r => r.id === id);
    if (!inv || inv.status === 'Paid') return;

    const newState = {
      ...data,
      bankBalance: data.bankBalance + inv.amount,
      moneyInMonth: data.moneyInMonth + inv.amount,
      revenueYtd: data.revenueYtd + inv.amount,
      receivables: data.receivables.map(r => r.id === id ? { ...r, status: 'Paid' as const } : r)
    };

    persistData(newState);
  };

  // Pay supplier bill
  const payBillVendor = (id: string) => {
    const bill = data.payables.find(p => p.id === id);
    if (!bill || bill.status === 'Paid') return;

    const newState = {
      ...data,
      bankBalance: data.bankBalance - bill.amount,
      moneyOutMonth: data.moneyOutMonth + bill.amount,
      expensesYtd: data.expensesYtd + bill.amount,
      payables: data.payables.map(p => p.id === id ? { ...p, status: 'Paid' as const } : p)
    };

    persistData(newState);
  };

  return (
    <div className="space-y-10 text-left">
      {/* Dynamic Vercel v.0 Model Prompters AI Integration System */}
      <div className="p-6 rounded-[36px] bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-cyan-500/30 shadow-2xl space-y-5 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-400 to-emerald-500 rounded-2xl text-neutral-950 shadow-md animate-pulse">
              <Sparkles size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bebas text-3xl text-white tracking-widest uppercase leading-none">{t("Vercel v.0 app AI Financial System")}</h3>
              <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-1">{t("Prompt actions safely to auto-reconcile cash registers, invoices & ledgers")}</p>
            </div>
          </div>
          <span className="bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
            ● {t("AI AGENT ONLINE")}
          </span>
        </div>

        <form onSubmit={handleAIPromptSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Terminal className="absolute left-4.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input 
              type="text"
              disabled={isAiProcessing}
              value={promptQuery}
              onChange={(e) => setPromptQuery(e.target.value)}
              placeholder={t("Prompt AI e.g. 'add software expense 15000 VT' or 'send invoice to Hideaway Island Lodge for 150000 VT'...")}
              className="w-full bg-neutral-950/90 border border-white/5 focus:border-cyan-500/40 rounded-2xl py-3.5 pl-12 pr-6 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isAiProcessing || !promptQuery.trim()}
            className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 duration-200 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 shrink-0"
          >
            {isAiProcessing ? t("Triangulating...") : t("Prompt System")}
            <ArrowRight size={13} className="stroke-[3]" />
          </button>
        </form>

        {aiLogs.length > 0 && (
          <div className="p-4.5 rounded-2xl bg-neutral-950/80 border border-white/5 font-mono text-[10.5px] text-neutral-400 space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin select-all">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2 text-[9px] text-neutral-500">
              <Terminal size={11} />
              <span>v0-app-financial-resolver.sh</span>
            </div>
            {aiLogs.map((log, index) => (
              <div key={index} className={log.startsWith('✓') ? "text-emerald-400 font-bold" : log.startsWith('▲') ? "text-cyan-400" : ""}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Quick Action Terminal Controller Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveForm('expense')}
          className="p-6 rounded-[32px] border border-white/10 bg-kava-surface hover:bg-white/[0.04] transition-all group flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
              <Plus size={20} className="stroke-[3]" />
            </div>
            <div>
              <h4 className="font-bebas text-2xl text-kava-text uppercase tracking-wider">{t("Add Expense")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Deduct core cash reserves")}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-kava-muted group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setActiveForm('invoice')}
          className="p-6 rounded-[32px] border border-white/10 bg-kava-surface hover:bg-white/[0.04] transition-all group flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/15 rounded-2xl text-cyan-500 group-hover:scale-110 transition-transform">
              <Send size={18} className="stroke-[3]" />
            </div>
            <div>
              <h4 className="font-bebas text-2xl text-kava-text uppercase tracking-wider">{t("Send Invoice")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Generate B2B receivables bill")}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-kava-muted group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setActiveForm('receipt')}
          className="p-6 rounded-[32px] border border-white/10 bg-kava-surface hover:bg-white/[0.04] transition-all group flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/15 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
              <Upload size={18} className="stroke-[3]" />
            </div>
            <div>
              <h4 className="font-bebas text-2xl text-kava-text uppercase tracking-wider">{t("Upload Receipt")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Drag simulated OCR parsing")}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-kava-muted group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Action Drawer Sheets - Renders contextually below buttons to preserve screen state */}
      {activeForm !== 'none' && (
        <div className="p-6 md:p-8 rounded-[40px] border border-kava-muted/15 bg-white dark:bg-neutral-900/60 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 text-left">
          <div className="flex items-center justify-between border-b border-kava-muted/10 pb-4 mb-6">
            <h4 className="font-bebas text-3xl text-kava-text uppercase tracking-widest flex items-center gap-2">
              <span>{t("Dynamic Form Area:")}</span>
              <span className="text-kava-gold">{activeForm === 'expense' ? t("Add Expense Payout") : activeForm === 'invoice' ? t("Generate B2B Client Invoice") : t("Mock Receipt OCR Scanner")}</span>
            </h4>
            <button 
              onClick={() => {
                setActiveForm('none');
                setScannedReceipt(null);
              }}
              className="p-1 px-3 border border-kava-muted/20 bg-kava-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[10px] uppercase font-black tracking-widest rounded-xl text-kava-muted transition-colors cursor-pointer"
            >
              {t("Close Panel")}
            </button>
          </div>

          {activeForm === 'expense' && (
            <form onSubmit={submitExpense} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-kava-muted tracking-widest">{t("Select Category")}</label>
                <select 
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{t(cat)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-kava-muted tracking-widest">{t("Amount")} ({currency})</label>
                <input 
                  type="number"
                  placeholder="e.g. 450"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-kava-muted tracking-widest">{t("Description")}</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. 50kg Pentecost shipment bagging"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-kava-gold hover:bg-kava-gold/90 text-white rounded-xl text-[10px] uppercase tracking-widest font-black shrink-0 transition-all cursor-pointer px-6"
                  >
                    {t("Deduct")}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeForm === 'invoice' && (
            <form onSubmit={submitInvoice} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-kava-muted tracking-widest">{t("Client Name")}</label>
                <input 
                  type="text"
                  placeholder="e.g. Pacific Resort"
                  required
                  value={invoiceForm.client}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, client: e.target.value })}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-kava-muted tracking-widest">{t("Invoiced Amount")} ({currency})</label>
                <input 
                  type="number"
                  placeholder="e.g. 1200"
                  required
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-kava-muted tracking-widest">{t("Due Date")}</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black shrink-0 transition-all cursor-pointer px-6"
                  >
                    {t("Dispatch")}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeForm === 'receipt' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Drop area */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  dragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-kava-muted/20 bg-kava-bg/[0.02]'
                }`}
              >
                <input 
                  type="file"
                  id="receipt-file-input"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-4 animate-bounce">
                  <Upload size={24} />
                </div>
                
                <h5 className="font-bebas text-xl text-kava-text tracking-wider uppercase mb-1">{t("Drag Receipt File Here")}</h5>
                <p className="text-[10px] text-kava-muted uppercase tracking-wider mb-4">{t("Or click to select photo standard PNG, JPG, PDF")}</p>
                
                <button
                  type="button"
                  onClick={() => document.getElementById('receipt-file-input')?.click()}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  {t("Choose File")}
                </button>
              </div>

              {/* Status and OCR readout */}
              <div className="p-6 rounded-3xl bg-neutral-950 border border-white/5 font-mono text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 border-b border-white/5 pb-2 mb-3">
                    <Terminal size={11} />
                    <span>simulated-ocr-scanner.sh</span>
                  </div>

                  {isScanningReceipt ? (
                    <div className="py-8 text-center text-cyan-400 animate-pulse space-y-2">
                      <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
                      <p className="text-[10px] uppercase font-black tracking-widest">Parsing receipt metadata...</p>
                    </div>
                  ) : scannedReceipt ? (
                    <div className="space-y-2 text-xs text-neutral-300">
                      <div><span className="text-neutral-500">FILE:</span> {scannedReceipt.fileName}</div>
                      <div><span className="text-neutral-500">VENDOR:</span> {scannedReceipt.vendor}</div>
                      <div><span className="text-neutral-500">DATE:</span> {scannedReceipt.date}</div>
                      <div><span className="text-neutral-500">CATEGORY:</span> <span className="text-kava-gold font-bold">{t(scannedReceipt.category)}</span></div>
                      <div><span className="text-neutral-500">AMOUNT:</span> <span className="text-emerald-400 font-extrabold">{formatPrice(scannedReceipt.amount)}</span></div>
                      <div><span className="text-neutral-500">SUMMARY:</span> <p className="text-[10.5px] italic text-neutral-400 mt-0.5">{scannedReceipt.description}</p></div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-neutral-600 text-center">
                      <FolderOpen size={24} className="opacity-15 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{t("No Document Scanned")}</p>
                      <p className="text-[9px] max-w-xs mt-1">{t("Upload any mock receipt file on the left to activate instant AI-OCR parser simulation.")}</p>
                    </div>
                  )}
                </div>

                {scannedReceipt && (
                  <button
                    type="button"
                    onClick={acceptScannedReceipt}
                    className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    {t("Approve OCR & Record Expense")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Stats Row: 1. Cash Flow Overview & 2. Profit Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cash Flow Card & Balance Overview */}
        <div className="lg:col-span-7 kava-card flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-kava-muted/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <TrendingUp size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Cash Flow Overview")}</h4>
                  <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Real-time Liquidity & Balance accounts")}</p>
                </div>
              </div>
              <span className="text-[9px] bg-neutral-100 dark:bg-white/5 border border-kava-muted/10 text-kava-text px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">
                MONTH: JUNE 2026
              </span>
            </div>
 
            {/* Realtime Bank Balance */}
            <div className="py-5 text-center sm:text-left">
              <span className="text-[10px] text-kava-muted uppercase font-black tracking-[0.25em] block mb-1">{t("Available Liquid Funds")}</span>
              <div className="font-bebas text-5xl md:text-6xl text-kava-text tracking-wider flex items-center justify-center sm:justify-start gap-1 leading-none">
                <span>{formatPrice(data.bankBalance)}</span>
              </div>
            </div>
          </div>
 
          {/* Money-In vs Money-Out gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-kava-muted/5 pt-5">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight size={10} className="stroke-[3]" /> {t("Money-In (Month)")}
                </span>
                <div className="font-bebas text-2xl text-kava-text tracking-wide">
                  {formatPrice(data.moneyInMonth)}
                </div>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                <TrendingUp size={16} />
              </div>
            </div>
 
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-rose-500 font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownLeft size={10} className="stroke-[3]" /> {t("Money-Out (Month)")}
                </span>
                <div className="font-bebas text-2xl text-kava-text tracking-wide">
                  {formatPrice(data.moneyOutMonth)}
                </div>
              </div>
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                <TrendingDown size={16} />
              </div>
            </div>
          </div>
        </div>
 
        {/* Profit Tracker Card */}
        <div className="lg:col-span-5 kava-card flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
 
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-kava-muted/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400">
                  <DollarSign size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Profit Tracker")}</h4>
                  <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Surplus margins audit (Revenue - Expenses)")}</p>
                </div>
              </div>
            </div>
 
            {/* Net Profits breakdown metrics */}
            <div className="space-y-6 py-2">
              <div className="p-4 bg-white/40 dark:bg-white/[0.02] border border-kava-muted/10 rounded-2xl flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-kava-muted uppercase font-black tracking-widest">{t("Current Month Profit")}</span>
                  <p className="text-xs font-semibold text-neutral-400 mt-1 font-mono">{t("Invoiced vs Spend Outflow")}</p>
                </div>
                <div className="text-right">
                  <div className={`font-bebas text-3xl tracking-wide ${currentMonthProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {currentMonthProfit >= 0 ? '+' : ''}{formatPrice(currentMonthProfit)}
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                    {((currentMonthProfit / (data.moneyInMonth || 1)) * 100).toFixed(1)}% Marg
                  </span>
                </div>
              </div>
 
              <div className="p-4 bg-white/40 dark:bg-white/[0.02] border border-kava-muted/10 rounded-2xl flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-kava-muted uppercase font-black tracking-widest">{t("YTD Total Net Profit")}</span>
                  <p className="text-xs font-semibold text-neutral-400 mt-1 font-mono">{t("Revenue - Spend YTD")}</p>
                </div>
                <div className="text-right">
                  <div className={`font-bebas text-3xl tracking-wide ${ytdProfit >= 0 ? 'text-cyan-400' : 'text-rose-500'}`}>
                    {ytdProfit >= 0 ? '+' : ''}{formatPrice(ytdProfit)}
                  </div>
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                    {((ytdProfit / (data.revenueYtd || 1)) * 100).toFixed(1)}% Marg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
 
      </div>

      {/* 2.5 Dynamic Recharts Cash Flow Visualizer */}
      <div className="kava-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-kava-muted/5 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-400/20 to-emerald-500/20 rounded-xl text-cyan-400">
              <TrendingUp size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Interactive Cash Flow Trends")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Analyze liquid cash inflows vs outflows over time")}</p>
            </div>
          </div>
          
          {/* Monthly / Quarterly Toggle */}
          <div className="flex bg-neutral-900 border border-white/5 rounded-2xl p-1.5 self-start sm:self-center">
            <button
              onClick={() => setChartInterval('monthly')}
              className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${
                chartInterval === 'monthly'
                  ? 'bg-cyan-500 text-neutral-950 font-black'
                  : 'text-neutral-400 hover:text-white font-bold'
              }`}
            >
              {t("Monthly")}
            </button>
            <button
              onClick={() => setChartInterval('quarterly')}
              className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${
                chartInterval === 'quarterly'
                  ? 'bg-cyan-500 text-neutral-950 font-black'
                  : 'text-neutral-400 hover:text-white font-bold'
              }`}
            >
              {t("Quarterly")}
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-[320px] pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={9} 
                tickLine={false}
                dy={10}
                className="font-mono font-bold tracking-widest uppercase"
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={9} 
                tickLine={false} 
                tickFormatter={(val) => formatShortPrice(val)}
                dx={-10}
                className="font-mono font-bold"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-300"
              />
              <Area 
                name={role === 'manager' ? t("Inflow") : t("Inflow")} 
                type="monotone" 
                dataKey="inflow" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInflow)" 
              />
              <Area 
                name={role === 'manager' ? t("Outflow") : t("Outflow")} 
                type="monotone" 
                dataKey="outflow" 
                stroke="#f43f5e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOutflow)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
 
      {/* 3. Expense Categories Breakdown Zone */}
      <div className="kava-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-kava-gold/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 border-b border-kava-muted/5 pb-4 mb-6">
          <div className="p-2.5 bg-kava-gold/15 rounded-xl text-kava-gold">
            <Percent size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Expense Categories")}</h4>
            <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Simple breakdown of top spending areas")}</p>
          </div>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {categoriesList.map(cat => {
            const val = categoryTotals[cat] || 0;
            const pct = (val / totalExpensesSum) * 100;
            return (
              <div key={cat} className="p-4 bg-white/40 dark:bg-white/[0.02] border border-kava-muted/10 rounded-2xl text-left space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-400">{t(cat)}</span>
                  <span className="text-[10px] font-black font-mono text-kava-muted">{pct.toFixed(0)}%</span>
                </div>
                <div className="font-bebas text-2xl text-kava-text leading-none tracking-wide">
                  {formatPrice(val)}
                </div>
                {/* Horizontal Meter gauge */}
                <div className="w-full h-1.5 bg-kava-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-kava-gold to-amber-500 transition-all duration-1000" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
 
      {/* 4. Receivables / Payables Ledger Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Receivables Ledger (Client owes us) */}
        <div className="kava-card flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-kava-muted/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <ArrowUpRight size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Receivables (Invoices)")}</h4>
                  <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("What clients owe the business")}</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-500 bg-emerald-500/5 px-2.5 py-1 rounded-xl">
                {t("Owed")}: {formatPrice(data.receivables.filter(r => r.status !== 'Paid').reduce((s, r) => s + r.amount, 0))}
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
              {data.receivables.map(r => (
                <div key={r.id} className="p-3.5 bg-white/40 dark:bg-white/[0.02] border border-kava-muted/10 rounded-2xl flex items-center justify-between text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-kava-text">{r.client}</span>
                      <span className="text-[8.5px] font-mono font-black text-neutral-400">({r.id})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-0.5"><Calendar size={10} /> {t("Due Date")} {r.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bebas text-lg text-kava-text block">{formatPrice(r.amount)}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        r.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' :
                        r.status === 'Overdue' ? 'bg-rose-500/15 text-rose-500 animate-pulse' :
                        'bg-amber-500/15 text-amber-500'
                      }`}>
                        {t(r.status)}
                      </span>
                    </div>

                    {r.status !== 'Paid' && (
                      <button
                        onClick={() => toggleInvoicePaid(r.id)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {t("Paid")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payables Ledger (What we owe farmers / vendors) */}
        <div className="kava-card flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-kava-muted/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                  <ArrowDownLeft size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Payables (Bills)")}</h4>
                  <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("What we owe noble growers & exporters")}</p>
                </div>
              </div>
              <span className="text-xs font-black text-rose-500 bg-rose-500/5 px-2.5 py-1 rounded-xl">
                {t("We Owe")}: {formatPrice(data.payables.filter(p => p.status !== 'Paid').reduce((s, p) => s + p.amount, 0))}
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
              {data.payables.map(p => (
                <div key={p.id} className="p-3.5 bg-white/40 dark:bg-white/[0.02] border border-kava-muted/10 rounded-2xl flex items-center justify-between text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-kava-text">{p.vendor}</span>
                      <span className="text-[8.5px] font-mono font-black text-neutral-400">({p.id})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-0.5"><Calendar size={10} /> {t("Due Date")} {p.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bebas text-lg text-kava-text block">{formatPrice(p.amount)}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        p.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' :
                        p.status === 'Overdue' ? 'bg-rose-500/15 text-rose-500 animate-pulse' :
                        'bg-amber-500/15 text-amber-500'
                      }`}>
                        {t(p.status)}
                      </span>
                    </div>

                    {p.status !== 'Paid' && (
                      <button
                        onClick={() => payBillVendor(p.id)}
                        className="px-3 py-1.5 bg-rose-500 hover:bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {t("Settle")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4.5 Budget Planner module (Predictive forecasting and Milestones Timeline) */}
      <div className="kava-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-kava-muted/5 pb-6 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400">
              <Sparkles size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Budget Planner & Predictive Milestones")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Project forward-looking cash flows based on historical ledger and growth metrics")}</p>
            </div>
          </div>

          {/* Quick controls toggle */}
          <div className="flex gap-2">
            <div className="flex bg-neutral-900 border border-white/5 rounded-2xl p-1.5 self-start sm:self-center">
              {[6, 9, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setProjectionMonths(m)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer ${
                    projectionMonths === m
                      ? 'bg-cyan-500 text-neutral-950 font-black'
                      : 'text-neutral-400 hover:text-white font-bold'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic projections details controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-5">
            <div className="p-6 rounded-3xl bg-neutral-950/80 border border-white/5 space-y-4">
              <span className="text-[10px] uppercase font-black text-cyan-400 tracking-widest block">{t("Adjust Growth & Inflation Modeling")}</span>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold">{t("Expected Monthly Inflow Growth")}</span>
                  <span className="text-emerald-400 font-black font-mono">+{growthInflowRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={growthInflowRate}
                  onChange={(e) => setGrowthInflowRate(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold">{t("Estimated Outflow Sourcing Inflation")}</span>
                  <span className="text-rose-500 font-black font-mono">+{inflationOutflowRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={inflationOutflowRate}
                  onChange={(e) => setInflationOutflowRate(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2.5 text-xs text-neutral-400 font-medium">
                <div className="flex justify-between">
                  <span>{t("Baseline Monthly Inflow")}:</span>
                  <span className="text-white font-mono font-bold">{formatPrice(data.moneyInMonth)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Baseline Monthly Outflow")}:</span>
                  <span className="text-white font-mono font-bold">{formatPrice(data.moneyOutMonth)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 text-[10px] uppercase font-black tracking-wider">
                  <span className="text-neutral-500">{t("Baseline Net Reserve")}:</span>
                  <span className={`${data.moneyInMonth - data.moneyOutMonth >= 0 ? "text-emerald-400" : "text-rose-500"} font-mono`}>
                    {formatPrice(data.moneyInMonth - data.moneyOutMonth)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form to inject new milestones */}
            <div className="p-6 rounded-3xl bg-neutral-950/85 border border-white/5 space-y-4 text-left">
              <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest block">{t("Schedule Predictive Milestone")}</span>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-neutral-400 tracking-widest">{t("Milestone Title")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Export Shipping Container Sacks"
                    value={newMilestoneForm.title}
                    onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-neutral-400 tracking-widest">{t("Expected Sum")}</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 85000"
                      value={newMilestoneForm.amount}
                      onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-neutral-400 tracking-widest">{t("Capital Direction")}</label>
                    <select
                      value={newMilestoneForm.type}
                      onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, type: e.target.value as 'inflow' | 'outflow' }))}
                      className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="outflow">{t("Investment Outflow")}</option>
                      <option value="inflow">{t("Revenue Inflow")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-neutral-400 tracking-widest">{t("Future Month Target")}</label>
                    <select
                      value={newMilestoneForm.monthOffset}
                      onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, monthOffset: parseInt(e.target.value) }))}
                      className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                    >
                      {Array.from({ length: projectionMonths }, (_, i) => i + 1).map(offset => (
                        <option key={offset} value={offset}>
                          {getProjectedMonthsLabels(offset)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-neutral-400 tracking-widest">{t("Ledger Class")}</label>
                    <select
                      value={newMilestoneForm.category}
                      onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Equipment">{t("Equipment")}</option>
                      <option value="Logistics">{t("Logistics")}</option>
                      <option value="Inventory">{t("Inventory")}</option>
                      <option value="Revenue">{t("Revenue")}</option>
                      <option value="General">{t("General")}</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newMilestoneForm.title || !newMilestoneForm.amount) return;
                    const val = parseFloat(newMilestoneForm.amount);
                    if (isNaN(val) || val <= 0) return;
                    const newMilestone = {
                      id: 'cm-' + Date.now(),
                      title: newMilestoneForm.title,
                      amount: val,
                      type: newMilestoneForm.type,
                      monthOffset: newMilestoneForm.monthOffset,
                      category: newMilestoneForm.category
                    };
                    setCustomMilestones(prev => [...prev, newMilestone]);
                    setNewMilestoneForm({
                      title: '',
                      amount: '',
                      type: 'outflow',
                      monthOffset: Math.min(newMilestoneForm.monthOffset + 1, projectionMonths),
                      category: 'General'
                    });
                  }}
                  className="w-full mt-2 py-3 bg-cyan-500 hover:bg-cyan-600 text-neutral-950 rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus size={14} className="stroke-[3]" />
                  {t("Schedule Milestone")}
                </button>
              </div>
            </div>
          </div>

          {/* Projection charts & Timeline Visualizer */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            
            {/* 1. Predictive Chart */}
            <div className="p-6 rounded-3xl bg-neutral-950/80 border border-white/5 space-y-3 text-left">
              <span className="text-[10px] uppercase font-black text-cyan-400 tracking-widest block">{t("Projected Cash Standing Timeline")}</span>
              
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getProjectionData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.25)" 
                      fontSize={8.5} 
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.25)" 
                      fontSize={8.5} 
                      tickLine={false} 
                      tickFormatter={(val) => formatShortPrice(val)}
                      dx={-8}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-neutral-950/95 border border-white/10 p-3.5 rounded-2xl shadow-2xl font-mono text-left space-y-1.5 backdrop-blur-md">
                              <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest">{item.name}</p>
                              
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-xs text-neutral-400">{t("Projected Bank Balance")}:</span>
                                <span className="text-xs text-cyan-400 font-extrabold">{formatPrice(item.balance)}</span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-[10px] text-neutral-500">{t("Compounded Inflow")}:</span>
                                <span className="text-[10px] text-emerald-400 font-bold">+{formatPrice(item.inflow)}</span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-[10px] text-neutral-500">{t("Compounded Outflow")}:</span>
                                <span className="text-[10px] text-rose-500 font-bold">-{formatPrice(item.outflow)}</span>
                              </div>
                              
                              {item.milestones.length > 0 && (
                                <div className="border-t border-white/5 pt-1.5 mt-1.5 space-y-1">
                                  <span className="text-[8px] text-amber-500 font-black tracking-wider uppercase block">{t("Milestones Scheduled")}:</span>
                                  {item.milestones.map((m: any) => (
                                    <div key={m.id} className="flex justify-between text-[9px] text-neutral-300 gap-4">
                                      <span className="truncate max-w-[150px]">○ {m.title}</span>
                                      <span className={m.type === 'inflow' ? 'text-emerald-400' : 'text-rose-500'}>
                                        {m.type === 'inflow' ? '+$' : '-$'}{formatShortPrice(m.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      name={t("Projected Bank Reserve")} 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#22d3ee" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Visual Timeline sequence of predicted milestones */}
            <div className="p-6 rounded-3xl bg-neutral-950/80 border border-white/5 space-y-4 text-left">
              <span className="text-[10px] uppercase font-black text-cyan-400 tracking-widest block">{t("Forward-Looking Milestones Timeline & Feasibility Study")}</span>
              
              <div className="relative border-l border-white/10 pl-6 space-y-6 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                {getProjectionData().map((month, idx) => {
                  const isDeficit = month.balance < 0;
                  const isBelowStarting = month.balance < data.bankBalance;
                  const hasMilestones = month.milestones.length > 0;
                  
                  return (
                    <div key={month.name} className="relative group/time">
                      {/* Circle node on timeline */}
                      <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        isDeficit 
                          ? 'bg-rose-500 border-rose-500 scale-125' 
                          : isBelowStarting 
                            ? 'bg-amber-500 border-amber-500' 
                            : 'bg-emerald-500 border-emerald-500'
                      }`} />

                      <div className="flex flex-col md:flex-row items-grid md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{month.name}</span>
                            <span className="text-[9px] font-mono font-bold text-neutral-400">({t("Month")} +{month.monthIndex})</span>
                            
                            {isDeficit ? (
                              <span className="text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider animate-pulse flex items-center gap-0.5">
                                <AlertTriangle size={8} /> {t("Cash Depletion Alert")}
                              </span>
                            ) : isBelowStarting ? (
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider flex items-center gap-0.5">
                                <AlertTriangle size={8} /> {t("Low Reserve Alert")}
                              </span>
                            ) : (
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                                {t("Feasible")}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-1">
                            {hasMilestones ? (
                              month.milestones.map((m: any) => (
                                <div key={m.id} className="flex items-center gap-2 px-2.5 py-1 bg-neutral-900 border border-white/5 rounded-xl text-[10px] text-neutral-300">
                                  <span className={`w-1.5 h-1.5 rounded-full ${m.type === 'inflow' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                                  <span className="font-bold">{m.title}</span>
                                  <span className={`font-mono ${m.type === 'inflow' ? 'text-emerald-400' : 'text-neutral-400'}`}>
                                    {m.type === 'inflow' ? '+' : '-'}{formatShortPrice(m.amount)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setCustomMilestones(prev => prev.filter(item => item.id !== m.id));
                                    }}
                                    className="ml-1 text-neutral-500 hover:text-rose-500 cursor-pointer text-[10px] font-black focus:outline-none"
                                    title={t("Remove milestone")}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-neutral-500 italic block">{t("No major capital milestones scheduled")}</span>
                            )}
                          </div>
                        </div>

                        {/* Balance display right */}
                        <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/5 pt-1.5 md:pt-0">
                          <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider md:hidden">{t("End Balance")}:</span>
                          <div>
                            <span className="text-xs font-black text-cyan-400 block font-mono">{formatPrice(month.balance)}</span>
                            <span className="text-[9px] text-neutral-500 font-mono block">
                              {month.netSurplus >= 0 ? '+' : ''}{formatShortPrice(month.netSurplus)} / {t("mo")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 4.7 Filterable Master Transaction Ledger */}
      <div className="kava-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-kava-muted/5 pb-6 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <FolderOpen size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Interactive Master Ledger Registry")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Search, filter, and audit all unified transactions on your boards")}</p>
            </div>
          </div>

          <button
            onClick={exportFilteredLedgerToCSV}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md self-start sm:self-center"
          >
            <Download size={13} className="stroke-[3]" />
            {t("Export Ledger")}
          </button>
        </div>

        {/* Dynamic Filters Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={ledgerSearchQuery}
              onChange={(e) => setLedgerSearchQuery(e.target.value)}
              placeholder={t("Search transactions...")}
              className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl py-3 pl-10 pr-4 text-xs text-kava-text font-bold focus:outline-none focus:border-emerald-500"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
            {ledgerSearchQuery && (
              <button
                onClick={() => setLedgerSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-white font-black text-xs cursor-pointer focus:outline-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Type dropdown */}
          <div>
            <select
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value as any)}
              className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">📁 {t("All Types")}</option>
              <option value="inflow">☘️ {t("Inflow")}</option>
              <option value="outflow">🛑 {t("Outflow")}</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <select
              value={ledgerStatusFilter}
              onChange={(e) => setLedgerStatusFilter(e.target.value as any)}
              className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">⚡ All Statuses</option>
              <option value="Paid">🟢 Paid</option>
              <option value="Pending">🟡 Pending</option>
              <option value="Overdue">🔴 Overdue</option>
            </select>
          </div>
        </div>

        {/* Compiled Ledger entries list */}
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-neutral-950/80">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs text-neutral-300">
            <thead>
              <tr className="border-b border-white/5 bg-neutral-900/50 uppercase text-[9px] font-black tracking-widest text-neutral-400">
                <th className="p-4">{t("Date")}</th>
                <th className="p-4">Type / Source</th>
                <th className="p-4">Payee/Payer</th>
                <th className="p-4">Description</th>
                <th className="p-4">Reference ID</th>
                <th className="p-4 text-right">{t("Amount")}</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {getCompiledLedgerItems().length > 0 ? (
                getCompiledLedgerItems().map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors font-medium">
                    <td className="p-4 font-mono text-[11px] whitespace-nowrap">{item.date}</td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.type === 'inflow' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                        <span className="font-bold">{item.source}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white max-w-[150px] truncate">{item.payeeOrPayer}</td>
                    <td className="p-4 text-neutral-400 max-w-[200px] truncate">{item.description}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500">{item.id}</td>
                    <td className={`p-4 font-mono font-bold text-right text-[12px] whitespace-nowrap ${
                      item.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.type === 'inflow' ? '+' : '-'}{formatPrice(item.amount)}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xl ${
                        item.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {t(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 italic">
                    No transactions or ledger records match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Audited bank statement underwriter package */}
      <div className="kava-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-kava-muted/5 pb-6 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/15 rounded-xl text-kava-gold">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">{t("Certified Bank Report")}</h4>
              <p className="text-[10px] text-kava-muted uppercase tracking-wider mt-0.5">{t("Bank-grade underwriter statement prepared for credit submissions")}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAdjustmentPanel(!showAdjustmentPanel)}
              className="px-4 py-2.5 border border-white/10 hover:border-white/20 bg-neutral-900 rounded-xl text-[10px] uppercase font-black tracking-widest text-neutral-300 transition-all cursor-pointer"
            >
              {showAdjustmentPanel ? t("Hide Adjustments") : t("Adjust Financial Parameters")}
            </button>
            <button
              onClick={exportLedgerToCSV}
              className="px-5 py-2.5 border border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={13} className="stroke-[3]" />
              {t("Export CSV")}
            </button>
            <button
              onClick={downloadStatementPDF}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer size={13} className="stroke-[3]" />
              {t("Print Statement")}
            </button>
          </div>
        </div>

        {/* Adjustments control grid */}
        {showAdjustmentPanel && (
          <div className="p-6 rounded-3xl bg-neutral-950/80 border border-white/5 space-y-5 mb-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Report Interval Period")}</label>
                <select
                  value={statementPeriod}
                  onChange={(e) => setStatementPeriod(e.target.value as 'MONTH' | 'YTD')}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="MONTH">{t("Active Month (June 2026)")}</option>
                  <option value="YTD">{t("Year to Date (YTD)")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Equipment / Asset Purchase")} ({currency})</label>
                <input
                  type="number"
                  value={investingOutflow}
                  onChange={(e) => setInvestingOutflow(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Microfinance Loan Drawdown")} ({currency})</label>
                <input
                  type="number"
                  value={financingInflow}
                  onChange={(e) => setFinancingInflow(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Loan Repayment")} ({currency})</label>
                <input
                  type="number"
                  value={financingOutflow}
                  onChange={(e) => setFinancingOutflow(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Certified Signatory Name")}</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Type cursive text e-signature")}</label>
                <input
                  type="text"
                  placeholder="e.g. Rachel P."
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full bg-kava-surface border border-kava-muted/15 rounded-xl p-3 text-xs text-kava-text font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <input
                id="stamp-approved-toggle"
                type="checkbox"
                checked={isStatementStampApproved}
                onChange={(e) => setIsStatementStampApproved(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-neutral-900 border-white/10"
              />
              <label htmlFor="stamp-approved-toggle" className="text-xs font-bold text-neutral-300 uppercase tracking-wide cursor-pointer flex items-center gap-1.5">
                {t("Apply Bank Verification Stamp Indicator")}
              </label>
            </div>
          </div>
        )}

        {/* Beautiful cash flow statement preview table */}
        <div className="p-6 md:p-8 rounded-3xl bg-neutral-950 border border-white/5 space-y-6 text-left">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h5 className="font-bebas text-2xl text-white tracking-wider uppercase leading-none">
                {role === 'manager' ? t("Nakamal Retail Operating Group") : t("Epic Agricultural Kava Wholesale")}
              </h5>
              <div className="text-[9px] text-neutral-400 font-mono uppercase tracking-widest mt-1">
                {role === 'manager' ? "NAKAMAL DIRECT DIRECT CASH RECONCILIATIONS" : "BULK INTER-ISLAND DISTRIBUTOR SYSTEM"}
              </div>
            </div>
            
            {/* Visual Stamp badge in UI */}
            {isStatementStampApproved ? (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-black border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                <CheckCircle size={12} /> {t("Bank-grade Certified")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[9px] text-amber-500 font-mono font-black border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                ● {t("Draft Verification Ledger")}
              </span>
            )}
          </div>

          <div className="space-y-6">
            
            {/* 1. Operating Activities */}
            <div className="space-y-2">
              <h6 className="text-[10px] uppercase font-black text-amber-500 tracking-widest border-b border-white/5 pb-1">{t("Operating Activities")}</h6>
              
              <div className="space-y-1.5 text-xs font-mono font-bold">
                <div className="flex justify-between text-neutral-400">
                  <span>{t("Cash Receipts from Customers")}</span>
                  <span className="text-white">{formatPrice(totalReceipts)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>{t("Cash Paid to Suppliers / Vendors")}</span>
                  <span className="text-rose-500">-{formatPrice(distributedSourcing)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>{t("Cash Paid for Wages")}</span>
                  <span className="text-rose-500">-{formatPrice(distributedWages)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>{role === 'manager' ? t("Cash Paid for Utilities & Rent") : t("Cash Paid for Freight & Prospectus Runs")}</span>
                  <span className="text-rose-500">-{formatPrice(distributedOther)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-1.5 border-t border-white/5 font-sans">
                  <span>{t("Net Cash from Operating Activities")}</span>
                  <span className="font-extrabold">{formatPrice(netOperatingCashFlow)}</span>
                </div>
              </div>
            </div>

            {/* 2. Investing Activities */}
            <div className="space-y-2">
              <h6 className="text-[10px] uppercase font-black text-amber-500 tracking-widest border-b border-white/5 pb-1">{t("Investing Activities")}</h6>
              
              <div className="space-y-1.5 text-xs font-mono font-bold">
                <div className="flex justify-between text-neutral-400">
                  <span>{t("Equipment / Asset Purchase")}</span>
                  <span className="text-rose-500">-{formatPrice(investingOutflow)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-1.5 border-t border-white/5 font-sans">
                  <span>{t("Net Cash from Investing Activities")}</span>
                  <span className="font-extrabold">({formatPrice(netInvestingCashFlow)})</span>
                </div>
              </div>
            </div>

            {/* 3. Financing Activities */}
            <div className="space-y-2">
              <h6 className="text-[10px] uppercase font-black text-amber-500 tracking-widest border-b border-white/5 pb-1">{t("Financing Activities")}</h6>
              
              <div className="space-y-1.5 text-xs font-mono font-bold">
                <div className="flex justify-between text-neutral-400">
                  <span>{t("Microfinance Loan Drawdown")}</span>
                  <span className="text-white">+{formatPrice(financingInflow)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>{t("Loan Repayment")}</span>
                  <span className="text-rose-500">-{formatPrice(financingOutflow)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-1.5 border-t border-white/5 font-sans">
                  <span>{t("Net Cash from Financing Activities")}</span>
                  <span className="font-extrabold">{formatPrice(netFinancingCashFlow)}</span>
                </div>
              </div>
            </div>

            {/* Bottom summary block */}
            <div className="mt-6 p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-2 font-mono font-bold text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>{t("Beginning Bank Balance")}</span>
                <span className="text-white">{formatPrice(beginningBankBalance)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-cyan-400 font-sans">
                <span>{t("Net Cash Increase (Month/Period)")}</span>
                <span>{(netCashIncrease >= 0 ? '+' : '') + formatPrice(netCashIncrease)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-400 font-sans border-t border-white/10 pt-2 font-extrabold">
                <span>{t("Ending Bank Balance")}</span>
                <span>{formatPrice(endingBankBalance)}</span>
              </div>
            </div>

            {/* Signed Footer */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 pt-4 border-t border-white/5">
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] uppercase font-black text-kava-muted tracking-widest">{t("Authorized signature")}</span>
                <div className="p-3 bg-neutral-900 rounded-xl min-w-[200px] border border-white/5 min-h-[44px] flex items-center justify-start">
                  {signatureText ? (
                    <span className="font-serif text-cyan-400 text-sm italic tracking-widest font-black">{signatureText}</span>
                  ) : (
                    <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-widest italic">{t("Provisional Sign-off Pending")}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 bg-neutral-900 border border-white/5 p-3 rounded-2xl md:max-w-md">
                <span className="text-[8px] uppercase font-black text-amber-500 tracking-widest flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-500" /> {t("Bank Underwriter Pack")}
                </span>
                <p className="text-[9.5px] leading-relaxed text-neutral-400">
                  {t("This financial statement is prepared in accordance with Vanuatu National Financial Quality standards for direct submission to banking institutions and microcredit lenders.")}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
