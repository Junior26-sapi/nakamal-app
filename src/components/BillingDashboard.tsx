import React, { useState, useEffect } from 'react';
import { CreditCard, History, Package, CheckCircle2, AlertCircle, ArrowUpRight, Download, RefreshCw, X, Landmark, Lock, Shield, ChevronLeft, CreditCard as CardIcon, Zap, Award, Crown, Star, FileText, Upload, Camera, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Invoice, SubscriptionPlan } from '../types';
import { billingService } from '../services/billingService';
import { SUBSCRIPTION_PLANS as PLANS } from '../constants';
import { jsPDF } from 'jspdf';
import { storage } from '../lib/storage';
import { useCurrency } from '../contexts/CurrencyContext';
import { chatService } from '../services/chatService';
import { feedbackService } from '../services/feedbackService';

interface BillingDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onClose: () => void;
}

export default function BillingDashboard({ user, onUpdateUser, onClose }: BillingDashboardProps) {
  const { formatPrice } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [showInstructions, setShowInstructions] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Remittance Receipt Capture states
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptNote, setReceiptNote] = useState<string>('');
  const [isReceiptLoading, setIsReceiptLoading] = useState<boolean>(false);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState<boolean>(false);

  const generateMockReceipt = () => {
    const plan = PLANS.find(p => p.id === showInstructions);
    const price = plan?.price || 49;
    const dateStr = new Date().toLocaleDateString();
    const txnId = `KGB-TXN-${Date.now().toString().slice(-6)}`;
    const shortUid = user.id.slice(0, 8);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <rect width="100%" height="100%" fill="#121212"/>
      <rect x="10" y="10" width="380" height="480" fill="#ffffff" rx="16" stroke="#cda45e" stroke-width="4"/>
      
      <!-- Letterhead border -->
      <path d="M 10,75 L 390,75" stroke="#111111" stroke-width="2" stroke-dasharray="8 4"/>
      
      <!-- Success icon -->
      <circle cx="200" cy="130" r="30" fill="#10b981"/>
      <path d="M190 130 l7 7 l14 -14" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      
      <text x="50%" y="45" text-anchor="middle" font-family="'JetBrains Mono', Courier, monospace" font-weight="900" font-size="14" fill="#cda45e">KAVA PLATFORM B2B REMITTANCE</text>
      <text x="50%" y="60" text-anchor="middle" font-family="'JetBrains Mono', Courier, monospace" font-size="9" fill="#888">OFFICIAL BANK WIRE TRANSACTION RECEIPT</text>
      
      <!-- Details Grid -->
      <text x="30" y="200" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#444">ACCOUNT ID REFERENCE:</text>
      <text x="220" y="200" font-family="'JetBrains Mono', monospace" font-weight="bold" font-size="11" fill="#111">${shortUid}</text>
      
      <text x="30" y="225" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#444">ACCOUNT SUBSCRIBER:</text>
      <text x="220" y="225" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#111">${user.name}</text>
      
      <text x="30" y="250" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#444">LICENSE TIER TARGET:</text>
      <text x="220" y="250" font-family="'Inter', Helvetica, sans-serif" font-weight="black" font-size="11" fill="#cda45e">${plan?.name?.toUpperCase() || 'STANDARD PLAN'}</text>
      
      <text x="30" y="275" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#444">TRANSACTION REF ID:</text>
      <text x="220" y="275" font-family="'JetBrains Mono', monospace" font-weight="bold" font-size="11" fill="#059669">${txnId}</text>
      
      <text x="30" y="300" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#444">TRANSACTION DATE:</text>
      <text x="220" y="300" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#111">${dateStr}</text>
      
      <text x="30" y="325" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#444">PAYMENT CHANNEL:</text>
      <text x="220" y="325" font-family="'Inter', Helvetica, sans-serif" font-weight="bold" font-size="11" fill="#111">Manual Wire Transfer</text>
      
      <path d="M 20,350 L 380,350" stroke="#dddddd" stroke-width="1" stroke-dasharray="4 4"/>
      
      <!-- Amount box -->
      <rect x="35" y="370" width="330" height="60" fill="#fcfcf9" rx="8" stroke="#eeeeee" stroke-width="1"/>
      <text x="50" y="390" font-family="'Inter', sans-serif" font-size="10" fill="#777">TOTAL VOLUME REMITTED (VUV)</text>
      <text x="50" y="415" font-family="'JetBrains Mono', Courier, monospace" font-weight="900" font-size="20" fill="#111">${formatPrice(price)}</text>
      
      <rect x="250" y="380" width="100" height="40" fill="#ecfdf5" rx="6"/>
      <text x="300" y="404" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="black" font-size="11" fill="#059669">COMPLETED</text>
      
      <text x="50%" y="465" text-anchor="middle" font-family="Courier, monospace" font-size="8" fill="#aaa">Thank you for secure pipeline remittance. Kava Platform Corp Vanuatu.</text>
    </svg>`;
    
    const base64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    setReceiptFile(base64);
    if (feedbackService.playSound) feedbackService.playSound('success');
  };

  const handleReceiptSubmit = async () => {
    if (!showInstructions || !receiptFile) return;
    setIsReceiptLoading(true);
    
    try {
      const plan = PLANS.find(p => p.id === showInstructions);
      const price = plan?.price || 49;
      
      const updatedUser: User = {
        ...user,
        trialRenewalRequest: {
          planId: showInstructions,
          amount: price,
          receiptUrl: receiptFile,
          note: receiptNote,
          timestamp: Date.now(),
          status: 'pending'
        }
      } as any;

      // Save directly to storage
      const allUsers = storage.getUsers();
      storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));

      // Retrieve or create direct chat with the Administrator
      const adminChatId = await chatService.getOrCreateDirectChat(user.id, "admin1");

      // Send structured message with metadata to the Admin
      await chatService.sendMessage(
        adminChatId,
        user.id,
        `🧾 TRIAL RENEWAL RECEIPT SUBMISSION\nRequested Plan: ${plan?.name.toUpperCase()}\nAmount Remitted: ${formatPrice(price)}\nRemitter Note: "${receiptNote || 'None'}"\n[Visual Remittance Proof Attached below]`,
        'text',
        { 
          isReceiptRequest: true, 
          planId: showInstructions, 
          amount: price, 
          receiptUrl: receiptFile,
          note: receiptNote 
        }
      );

      // Trigger user session state update
      onUpdateUser(updatedUser);
      setIsReceiptLoading(false);
      setReceiptSuccessMsg(true);

      // Clear states after 3 seconds, close instructions
      setTimeout(() => {
        setReceiptSuccessMsg(false);
        setReceiptFile(null);
        setReceiptNote('');
        setShowInstructions(null);
        onClose();
      }, 3000);

    } catch (err) {
      console.error("Receipt submission failed: ", err);
      setIsReceiptLoading(false);
    }
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptFile(reader.result as string);
      if (feedbackService.playSound) feedbackService.playSound('success');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    billingService.getBillingHistory(user.id).then(setInvoices);
  }, [user.id]);

  const getVenueName = () => {
    if (user.role === 'manager') {
      const bars = storage.getBars();
      const bar = bars.find(b => b.id === user.barId || b.managerId === user.id);
      if (bar) return bar.name;
    }
    return user.businessName || user.name || 'N/A';
  };

  const handleExportInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const kavaGold = [205, 164, 94]; // rgb key color

    doc.setFont("helvetica", "bold");
    
    // Header banner decoration
    doc.setFillColor(17, 17, 17); // Slate black
    doc.rect(0, 0, 210, 45, "F"); 
    
    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("KAVA PLATFORM B2B", 15, 20);
    
    // Subtext
    doc.setTextColor(kavaGold[0], kavaGold[1], kavaGold[2]);
    doc.setFontSize(9);
    doc.text("OFFICIAL TRANSACTION RECEIPT & INVOICE SLIP", 15, 28);
    
    // Meta details
    doc.setTextColor(170, 170, 170);
    doc.setFontSize(8);
    doc.text(`VERIFICATION ID: ${invoice.id}`, 15, 36);

    // Bill To & Details Grid
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BILL TO (ENTITY DETS)", 15, 60);
    doc.text("TRANSACTION SUMMARY", 110, 60);

    // Underlines
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 63, 95, 63);
    doc.line(110, 63, 195, 63);

    const venue = getVenueName();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    // Entity credentials
    doc.text(`Authorized Name: ${user.name}`, 15, 70);
    doc.text(`Venue Name: ${venue}`, 15, 76);
    doc.text(`Unique Account ID: ${user.id}`, 15, 82);
    doc.text(`Business Role: ${user.role.toUpperCase()}`, 15, 88);

    // Transaction details
    doc.text(`Billing Status: ${invoice.status.toUpperCase()}`, 110, 70);
    doc.text(`Issued Date: ${new Date(invoice.date).toLocaleDateString()}`, 110, 76);
    doc.text(`Description: ${invoice.description || 'License Fee'}`, 110, 82);
    doc.text(`Payment Gateway: STRIPE / MANUAL WIRE`, 110, 88);

    // Large Receipt Amount Box
    doc.setFillColor(245, 245, 243);
    doc.roundedRect(15, 100, 180, 35, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text("TOTAL AMOUNT CHARGED:", 25, 115);

    doc.setFontSize(24);
    doc.setTextColor(kavaGold[0], kavaGold[1], kavaGold[2]);
    doc.text(`${formatPrice(invoice.amount)}`, 25, 126);

    // Clean stamp status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (invoice.status === 'paid') {
      doc.setFillColor(230, 245, 238);
      doc.setTextColor(46, 117, 89);
      doc.roundedRect(130, 108, 50, 19, 2, 2, "FD");
      doc.text("STATUS: PAID", 137, 120);
    } else {
      doc.setFillColor(254, 242, 242);
      doc.setTextColor(185, 28, 28);
      doc.roundedRect(130, 108, 50, 19, 2, 2, "FD");
      doc.text("STATUS: UNPAID", 134, 120);
    }

    // Terms & Conditions Block
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Thank you for your business. License validations are verified statefully.", 15, 155);
    doc.text("If payments are completed via manual bank wires, access is provisioned upon manual clearing.", 15, 161);

    // Footer Watermark
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 275, 210, 22, "F");
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("GENERATED VIA KAVA B2B LEDGER INTERFACE. ALL TRANSACTIONS ARE LOCALLY STORED SECURELY.", 15, 287);

    doc.save(`receipt_${invoice.id}.pdf`);
  };

  const handleExportAllInvoicesPDF = () => {
    if (invoices.length === 0) return;
    
    const doc = new jsPDF();
    const kavaGold = [205, 164, 94]; // rgb
    
    doc.setFont("helvetica", "bold");
    
    // Header Banner
    doc.setFillColor(17, 17, 17); 
    doc.rect(0, 0, 210, 40, "F"); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("KAVA PLATFORM B2B", 15, 18);
    
    doc.setTextColor(kavaGold[0], kavaGold[1], kavaGold[2]);
    doc.setFontSize(9);
    doc.text("PERSONAL TRANSACTION LEDGER REPORT", 15, 25);
    
    doc.setTextColor(170, 170, 170);
    doc.setFontSize(8);
    doc.text(`ACCOUNT HOLDER: ${user.name.toUpperCase()}  |  VENUE: ${getVenueName().toUpperCase()}`, 15, 32);
    
    doc.setTextColor(30, 30, 30);
    
    // Summary
    doc.setFillColor(245, 245, 243);
    doc.roundedRect(15, 48, 180, 20, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const totalVolume = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    doc.text(`Total Transactions: ${invoices.length} entries      |      Total Expense Volume: ${formatPrice(totalVolume)}      |      Paid Licences: ${paidCount}`, 20, 60);

    // Table Header
    const tableHeaderY = 76;
    doc.setFillColor(17, 17, 17);
    doc.rect(15, tableHeaderY, 180, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    
    doc.text("VERIFICATION ID", 20, tableHeaderY + 5);
    doc.text("DESCRIPTION / LICENCE TYPE", 60, tableHeaderY + 5);
    doc.text("DATE", 120, tableHeaderY + 5);
    doc.text("AMOUNT", 150, tableHeaderY + 5);
    doc.text("STATUS", 175, tableHeaderY + 5);
    
    let rowY = tableHeaderY + 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    
    invoices.forEach((invoice, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 250);
        doc.rect(15, rowY, 180, 10, "F");
      }
      
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.id, 20, rowY + 6);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      const desc = invoice.description.length > 25 ? invoice.description.substring(0, 22) + '...' : invoice.description;
      doc.text(desc, 60, rowY + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(new Date(invoice.date).toLocaleDateString(), 120, rowY + 6);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      doc.text(`${formatPrice(invoice.amount)}`, 150, rowY + 6);
      
      if (invoice.status === 'paid') {
        doc.setTextColor(46, 117, 89);
        doc.text("PAID", 175, rowY + 6);
      } else {
        doc.setTextColor(185, 28, 28);
        doc.text("UNPAID", 175, rowY + 6);
      }
      
      rowY += 10;
    });

    // Watermark
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("STATEFULLY COMPILED SECURE PORTABLE FINANCIAL LEDGER TRAIL.", 15, 285);

    doc.save(`ledger_${user.id}_personal.pdf`);
  };

  const handleSubscribe = async (planId: string) => {
    setShowInstructions(planId);
  };

  const handleProcessCardPayment = async () => {
    if (!showInstructions) return;
    setIsProcessing(true);
    try {
      const result = await billingService.processPayment(user.id, showInstructions, { mock: true });
      if (result.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          onUpdateUser({
            ...user,
            subscriptionActive: true,
            subscription: result.subscription,
            approved: true
          });
          setPaymentSuccess(false);
          setShowInstructions(null);
          setIsProcessing(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setIsProcessing(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!user.subscription) return;
    const nextValue = !user.subscription.autoRenew;
    try {
      const result = await billingService.toggleAutoRenew(user.id, nextValue);
      if (result.success) {
        onUpdateUser({
          ...user,
          subscription: {
            ...user.subscription,
            autoRenew: nextValue
          }
        });
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-kava-bg w-full max-w-4xl max-h-[90vh] rounded-[48px] overflow-hidden border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-kava-gold/10 rounded-2xl text-kava-gold">
              <CreditCard size={28} />
            </div>
            <div>
              <h2 className="font-bebas text-4xl text-kava-text tracking-wider uppercase">Billing & Licensing</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-kava-muted font-medium uppercase tracking-widest opacity-60">Manage your business account</p>
                {user.subscription && (
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    user.subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {user.subscription.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-2xl text-kava-muted transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Subscription Overview Banner */}
        {user.subscription && (
          <div className="px-8 py-4 bg-kava-gold/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-kava-gold uppercase tracking-widest leading-none mb-1">Current Plan</span>
                <span className="text-sm font-bold text-kava-text">{user.subscription.planId.toUpperCase()} {user.subscription.isTrial ? '(TRIAL)' : ''}</span>
              </div>
              <div className="w-[1px] h-6 bg-kava-text/10" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-kava-gold uppercase tracking-widest leading-none mb-1">Period Ending</span>
                <span className="text-sm font-bold text-kava-text">{new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
              <div className="w-[1px] h-6 bg-kava-text/10" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-kava-gold uppercase tracking-widest leading-none mb-1">Auto-Renewal</span>
                  <span className="text-[10px] font-bold text-kava-muted uppercase">{user.subscription.autoRenew ? 'Enabled' : 'Disabled'}</span>
                </div>
                <button 
                  onClick={toggleAutoRenew}
                  className={`w-10 h-5 rounded-full relative transition-colors ${user.subscription.autoRenew ? 'bg-kava-gold' : 'bg-kava-text/10'}`}
                >
                  <div className={`absolute top-1 bottom-1 w-3 bg-white rounded-full transition-all ${user.subscription.autoRenew ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
            {Date.now() > user.subscription.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Account Suspended</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        {!showInstructions && (
          <div className="flex px-8 border-b border-white/5 gap-8">
            <button 
              onClick={() => setActiveTab('plans')}
              className={`py-6 font-bold text-xs uppercase tracking-widest transition-all relative ${activeTab === 'plans' ? 'text-kava-gold' : 'text-kava-muted text-opacity-40 hover:text-opacity-100'}`}
            >
              Plans
              {activeTab === 'plans' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-kava-gold rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-6 font-bold text-xs uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-kava-gold' : 'text-kava-muted text-opacity-40 hover:text-opacity-100'}`}
            >
              Payment History
              {activeTab === 'history' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-kava-gold rounded-t-full" />}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {showInstructions ? (
              <motion.div 
                key="instructions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowInstructions(null)}
                      className="p-2 hover:bg-white/10 rounded-xl text-kava-muted transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div>
                      <h3 className="font-bebas text-3xl text-kava-text tracking-wide uppercase">Checkout</h3>
                      <p className="text-[10px] text-kava-muted font-bold uppercase tracking-widest opacity-60">Complete your {PLANS.find(p => p.id === showInstructions)?.name} registration</p>
                    </div>
                  </div>

                  <div className="flex bg-white/5 rounded-2xl p-1">
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'card' ? 'bg-kava-gold text-white shadow-lg' : 'text-kava-muted/40 hover:text-kava-muted'}`}
                    >
                      Card Payment
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('bank')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'bank' ? 'bg-kava-gold text-white shadow-lg' : 'text-kava-muted/40 hover:text-kava-muted'}`}
                    >
                      Bank Transfer
                    </button>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto w-full">
                  {paymentMethod === 'bank' ? (
                    <div className="kava-card p-6 md:p-8 space-y-6 bg-white/5 opacity-100 relative overflow-hidden border border-white/10">
                      {receiptSuccessMsg && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 z-50 bg-kava-bg/95 backdrop-blur-md flex flex-col items-center justify-center space-y-4 p-6 text-center"
                        >
                          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/10">
                            <Check size={32} />
                          </div>
                          <p className="font-bebas text-3xl text-kava-text tracking-widest uppercase">REMITTANCE REGISTERED</p>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Routing Proof directly to Admin Inbox...</p>
                        </motion.div>
                      )}

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3 text-emerald-500">
                          <Landmark size={24} />
                          <h4 className="font-bebas text-2xl tracking-wide uppercase">Offline Bank Transaction</h4>
                        </div>
                        <div className="text-[9px] font-bold text-kava-gold bg-kava-gold/10 py-1.5 px-3 rounded-full uppercase tracking-wider">
                          Trial Expiry Manual Remittance Flow
                        </div>
                      </div>

                      {/* Instruction grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-black text-kava-gold uppercase tracking-widest mb-3 border-b border-kava-gold/10 pb-1.5">Official Escrow Bank Details</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[8px] text-kava-muted uppercase tracking-widest opacity-40 font-bold">Bank Name</p>
                              <p className="text-[11px] font-bold text-kava-text">Kava Global Bank (KGB)</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-kava-muted uppercase tracking-widest opacity-40 font-bold">Account Name</p>
                              <p className="text-[11px] font-bold text-kava-text">Kava Operations</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[8px] text-kava-muted uppercase tracking-widest opacity-40 font-bold">IBAN / Account Number</p>
                              <p className="text-xs font-mono font-bold text-emerald-500">KV98 7654 3210 1234 5678</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-kava-muted uppercase tracking-widest opacity-40 font-bold">SWIFT / BIC</p>
                              <p className="text-xs font-mono font-bold text-kava-text">KAVAXK1</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-kava-muted uppercase tracking-widest opacity-40 font-bold">Memo Code</p>
                              <p className="text-xs font-mono font-bold text-kava-gold">{user.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="text-[9px] text-kava-muted bg-white/5 p-3 rounded-xl border border-white/5 mt-3 leading-relaxed">
                            <span className="text-kava-gold font-bold">Important:</span> Include the Memo Code in your wire reference. Transact, take a picture/screenshot of the receipt, and upload it on the right to notify the Admin.
                          </div>
                        </div>

                        {/* Upload zone */}
                        <div className="flex flex-col space-y-4">
                          <label className="text-[9px] font-black text-kava-muted uppercase tracking-[0.2em] block">
                            Receipt Screenshot / Photo Remittance Proof
                          </label>

                          <div className="flex-1 flex flex-col justify-center items-center">
                            {receiptFile ? (
                              <div className="relative w-full h-40 rounded-2xl border border-emerald-500/20 bg-black/40 overflow-hidden flex items-center justify-center p-2 group">
                                <img 
                                  src={receiptFile} 
                                  alt="Remittance proof" 
                                  className="max-w-full max-h-full object-contain rounded-lg transition-transform hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  onClick={() => setReceiptFile(null)}
                                  className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-500 text-white rounded-full transition-colors active:scale-95"
                                  title="Remove proof"
                                >
                                  <X size={14} />
                                </button>
                                <div className="absolute bottom-2 left-2 right-2 bg-emerald-950/80 backdrop-blur-sm py-1 px-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between text-[8px] font-black uppercase text-emerald-400">
                                  <span>Visual receipt loaded</span>
                                  <Check size={10} className="text-emerald-400 animate-bounce" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-40 border-2 border-dashed border-white/10 hover:border-kava-gold/30 rounded-2xl transition-all bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center p-4 text-center relative group">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  id="receipt-file-input"
                                  onChange={handleLocalFileChange} 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                />
                                <div className="p-3 bg-white/5 rounded-2xl text-kava-muted/80 group-hover:scale-110 transition-transform mb-2">
                                  <Upload size={20} className="text-kava-gold" />
                                </div>
                                <p className="text-[10px] font-bold text-kava-text tracking-wide uppercase">Drag & Drop Receipt</p>
                                <p className="text-[8px] text-kava-muted/50 uppercase tracking-widest mt-1">or browse local device files</p>
                              </div>
                            )}
                          </div>

                          {/* Original testing flow trigger button */}
                          {!receiptFile && (
                            <button
                              type="button"
                              onClick={generateMockReceipt}
                              className="w-full py-2.5 px-4 bg-kava-gold/10 hover:bg-kava-gold text-kava-gold hover:text-white rounded-xl border border-kava-gold/20 hover:border-transparent text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <Camera size={14} />
                              Generate Realistic B2B Demo Receipt
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Memo notes block */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-kava-muted uppercase tracking-[0.2em] block">
                          Remittance Notes / Wire Reference / Swift Memo Code
                        </label>
                        <textarea 
                          value={receiptNote}
                          onChange={(e) => setReceiptNote(e.target.value)}
                          placeholder="e.g. Transacted from ANZ Bank Account Ending 9021. Memo ID attached. Requesting immediate verification."
                          className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-medium text-kava-text focus:outline-none focus:ring-1 focus:ring-kava-gold focus:bg-white/10 transition-all placeholder:text-kava-muted/20"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="kava-card p-8 space-y-8 bg-white/5 shadow-2xl relative overflow-hidden">
                      {isProcessing && (
                        <div className="absolute inset-0 z-50 bg-kava-bg/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
                          {paymentSuccess ? (
                            <>
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white"
                              >
                                <CheckCircle2 size={32} />
                              </motion.div>
                              <p className="font-bebas text-3xl text-kava-text tracking-widest">PAYMENT SECURED</p>
                              <p className="text-[10px] text-kava-muted font-bold uppercase tracking-widest">Activating your license...</p>
                            </>
                          ) : (
                            <>
                              <RefreshCw size={40} className="text-kava-gold animate-spin" />
                              <p className="font-bebas text-3xl text-kava-text tracking-widest uppercase">Encryption in Progress</p>
                              <p className="text-[10px] text-kava-muted font-bold uppercase tracking-widest">Communicating with payment gateway</p>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-kava-gold">
                            <Shield size={20} />
                            <h4 className="font-bebas text-2xl tracking-wide uppercase">Secure Credit Card</h4>
                          </div>
                          <p className="text-[9px] text-kava-muted font-bold uppercase tracking-widest opacity-60">256-bit AES Encryption Active</p>
                        </div>
                        <div className="flex gap-2">
                           <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold text-kava-muted">VISA</div>
                           <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold text-kava-muted">MC</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="text-[8px] font-black text-kava-muted uppercase tracking-[0.2em] mb-2 block">Cardholder Name</label>
                          <input 
                            type="text" 
                            placeholder="NAME AS IT APPEARS ON CARD"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-kava-text focus:outline-none focus:ring-1 focus:ring-kava-gold focus:bg-white/10 transition-all placeholder:text-kava-muted/20 uppercase tracking-widest"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-kava-muted uppercase tracking-[0.2em] mb-2 block">Card Number</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="0000 0000 0000 0000"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-kava-text focus:outline-none focus:ring-1 focus:ring-kava-gold focus:bg-white/10 transition-all placeholder:text-kava-muted/20 tracking-[0.2em]"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-kava-muted/30">
                              <Lock size={16} />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                            <label className="text-[8px] font-black text-kava-muted uppercase tracking-[0.2em] mb-2 block">Expiry Date</label>
                            <input 
                              type="text" 
                              placeholder="MM / YY"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-kava-text focus:outline-none focus:ring-1 focus:ring-kava-gold focus:bg-white/10 transition-all placeholder:text-kava-muted/20 text-center tracking-widest"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-kava-muted uppercase tracking-[0.2em] mb-2 block">CVV / CVC</label>
                            <input 
                              type="password" 
                              placeholder="***"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-kava-text focus:outline-none focus:ring-1 focus:ring-kava-gold focus:bg-white/10 transition-all placeholder:text-kava-muted/20 text-center tracking-widest"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                           <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-white">
                              <CheckCircle2 size={10} />
                           </div>
                           <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Safe for recurring billing</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h5 className="font-bold text-kava-text text-sm uppercase tracking-widest">Amount to Charge: <span className="text-kava-gold">{formatPrice(PLANS.find(p => p.id === showInstructions)?.price || 0)}</span></h5>
                    <p className="text-[10px] text-kava-muted max-w-md mt-1 uppercase font-bold opacity-60 flex items-center gap-1.5">
                      {paymentMethod === 'bank' ? (
                        <>Proof submission sends directly to the admin in high priority priority.</>
                      ) : (
                        <>Includes all applicable tax and platform fees. Fast activation.</>
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={paymentMethod === 'bank' ? handleReceiptSubmit : handleProcessCardPayment}
                    disabled={paymentMethod === 'bank' && (!receiptFile || isReceiptLoading)}
                    className={`px-12 py-5 rounded-2xl font-bebas text-2xl tracking-[0.2em] transition-all shadow-xl flex items-center gap-3 ${
                      paymentMethod === 'bank' 
                        ? (!receiptFile || isReceiptLoading)
                          ? 'bg-white/10 text-kava-muted/40 border border-white/5 shadow-none cursor-not-allowed'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/10' 
                        : 'bg-kava-gold text-white hover:bg-kava-gold/90 shadow-kava-gold/20'
                    }`}
                  >
                    {paymentMethod === 'bank' ? (
                      isReceiptLoading ? (
                        <>TRANSMITTING...</>
                      ) : (
                        <>SEND PROOF TO ADMIN</>
                      )
                    ) : (
                      <>
                        <Lock size={18} />
                        SECURE PAYMENT
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'plans' ? (
              <motion.div 
                key="plans"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {PLANS.map((plan) => {
                  const isActive = user.subscription?.planId === plan.id;
                  const isRecommended = plan.id === 'quarterly';
                  
                  const PlanIcon = plan.id === 'annual' ? Crown : (plan.id === 'quarterly' ? Award : Zap);
                  
                  return (
                    <div 
                      key={plan.id}
                      className={`kava-card flex flex-col p-8 space-y-6 relative transition-all duration-500 group overflow-hidden ${
                        isActive 
                          ? 'ring-4 ring-kava-gold bg-kava-gold/5 shadow-2xl shadow-kava-gold/10 scale-105' 
                          : isRecommended
                            ? 'bg-white/5'
                            : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Decorative background element */}
                      <div className={`absolute -right-8 -top-8 w-32 h-32 blur-3xl opacity-10 transition-transform duration-700 group-hover:scale-150 ${
                        plan.id === 'annual' ? 'bg-amber-400' : plan.id === 'quarterly' ? 'bg-kava-gold' : 'bg-emerald-400'
                      }`} />

                      {isActive && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-kava-gold text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1.5 border border-white/20">
                          <CheckCircle2 size={10} />
                          Active Subscription
                        </div>
                      )}

                      {isRecommended && !isActive && (
                        <div className="absolute top-4 right-4 bg-kava-text/10 text-kava-gold text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-kava-gold/20 backdrop-blur-md">
                          Recommended
                        </div>
                      )}

                      <div className="relative space-y-4">
                        <div className={`p-4 rounded-3xl w-fit ${
                          plan.id === 'annual' ? 'bg-amber-500/10 text-amber-500' : plan.id === 'quarterly' ? 'bg-kava-gold/10 text-kava-gold' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          <PlanIcon size={28} />
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-2xl font-bebas text-kava-text tracking-wide group-hover:text-kava-gold transition-colors">{plan.name}</h4>
                          <p className="text-[10px] text-kava-muted font-medium uppercase tracking-widest opacity-60 h-8 line-clamp-2 leading-relaxed">{plan.description}</p>
                        </div>
                      </div>

                      <div className="relative flex items-baseline gap-1 py-4 border-y border-white/5">
                        <span className="text-4xl font-bebas text-kava-gold">{formatPrice(plan.price)}</span>
                        <span className="text-xs text-kava-muted font-medium uppercase tracking-widest">
                          / {plan.id === 'annual' ? 'year' : plan.id === 'quarterly' ? 'quarter' : 'month'}
                        </span>
                        {plan.id === 'annual' && (
                          <span className="ml-auto text-[8px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Save 30%</span>
                        )}
                      </div>

                      <ul className="space-y-4 flex-1 py-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-[11px] text-kava-text/70 group-hover:text-kava-text transition-colors">
                            <div className="mt-0.5">
                               <CheckCircle2 size={12} className={idx < 3 ? "text-emerald-500" : "text-kava-muted/30"} />
                            </div>
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button 
                        disabled={isActive || isProcessing}
                        onClick={() => handleSubscribe(plan.id)}
                        className={`w-full py-5 rounded-[20px] font-bebas text-xl tracking-[0.2em] transition-all relative overflow-hidden group/btn ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-500 cursor-default opacity-80' 
                            : 'bg-kava-text text-kava-bg hover:bg-kava-gold hover:text-white shadow-xl shadow-black/10 active:scale-[0.98]'
                        }`}
                      >
                        <span className="relative z-10">{isActive ? 'Current Active License' : 'Select License'}</span>
                        {!isActive && (
                          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {invoices.length > 0 && (
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-kava-muted font-bold uppercase tracking-widest opacity-80">
                      Reconciled offline ledger & verified subscriptions
                    </p>
                    <button
                      onClick={handleExportAllInvoicesPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-kava-gold/15 hover:bg-kava-gold hover:text-white border border-kava-gold/20 text-kava-gold rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <FileText size={12} />
                      Export Personal Ledger PDF
                    </button>
                  </div>
                )}
                {invoices.length > 0 ? invoices.map((invoice) => (
                  <div key={invoice.id} className="kava-card p-6 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-2xl text-kava-text">
                        <History size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-kava-text">{invoice.description}</h5>
                        <p className="text-[10px] text-kava-muted font-medium uppercase tracking-widest opacity-60">
                          {new Date(invoice.date).toLocaleDateString()} • {invoice.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="font-bebas text-2xl text-kava-text">{formatPrice(invoice.amount)}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleExportInvoicePDF(invoice)}
                        title="Download PDF Receipt"
                        className="p-3 hover:bg-white/10 rounded-2xl text-kava-muted hover:text-kava-gold transition-colors"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 flex flex-col items-center text-center space-y-4">
                    <div className="p-6 bg-white/5 rounded-full text-kava-muted/20">
                      <History size={48} />
                    </div>
                    <p className="text-kava-muted text-xs font-medium uppercase tracking-widest opacity-40">No payment history found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-kava-muted uppercase tracking-[0.2em] opacity-40">Security Status</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Shield size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS Compliant</span>
              </div>
              <div className="w-[1px] h-3 bg-white/10 mx-1" />
              <div className="flex items-center gap-1.5 text-kava-gold">
                <Lock size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">TLS 1.3</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right flex flex-col justify-center">
              <span className="text-[8px] font-black text-kava-muted uppercase tracking-[0.2em] opacity-40">Business Support</span>
              <p className="text-[10px] font-bold text-kava-text uppercase tracking-widest">Contact Account Manager</p>
             </div>
             <button className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-rose-500/10 rounded-xl transition-all">
                <AlertCircle size={14} />
                Report Discrepancy
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
