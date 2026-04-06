import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from './Toast';

interface ApprovalItem {
  id: number;
  type: 'sph' | 'audiensi';
  number: string; // sph_no or letter_number
  title: string; // project_name or purpose
  client_name: string;
  date: string;
  status: string;
  description?: string; // description or content
  value?: number; // for SPH
  pic?: string; // creator name
  file_path?: string;
  is_new_application?: boolean;
}

const ProjectApprovalScreen: React.FC = () => {
  const { user, isApprover, isHeadSection, isSeniorManager, isGeneralManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'sph' | 'audiensi'>('sph');
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [useExistingSignature, setUseExistingSignature] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (user && isApprover()) {
      loadApprovals();
    }
  }, [user, activeTab, isApprover, isHeadSection, isSeniorManager, isGeneralManager]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      
      let data;
      let statusFilter = '';

      if (isHeadSection()) {
        statusFilter = 'waiting_head_section,waiting_client';
      } else if (isSeniorManager()) {
        statusFilter = 'waiting_senior_manager';
      } else if (isGeneralManager()) {
        statusFilter = 'waiting_general_manager';
      } else {
        statusFilter = 'waiting_head_section';
      }

      if (activeTab === 'sph') {
        const res: any = await api.getSphList({ status: statusFilter });
        data = res.data || res;
      } else {
        const res: any = await api.getAudiensiList({ status: statusFilter });
        data = res.data || res;
      }
      
      // Normalize data
      const normalized: ApprovalItem[] = (Array.isArray(data) ? data : (data.data || [])).map((item: any) => ({
        id: item.id,
        type: activeTab,
        number: activeTab === 'sph' ? item.sph_no : item.letter_number,
        title: activeTab === 'sph' ? item.project_name : item.purpose,
        client_name: activeTab === 'sph' 
          ? item.client?.company_name || 'Unknown Client'
          : item.company_name || item.client?.company_name || 'Unknown Client',
        date: activeTab === 'sph' ? item.date_created : item.date,
        status: item.status,
        description: activeTab === 'sph' ? item.description : item.content,
        value: activeTab === 'sph' ? item.value : undefined,
        pic: item.creator?.name || 'Unknown',
        file_path: item.generated_file_path,
        is_new_application: item.is_new_application,
      }));

      setItems(normalized);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const isManual = activeTab === 'sph' && selectedItem?.is_new_application;
    const needsSignature = (isSeniorManager() || isGeneralManager()) && !isManual;
    if (needsSignature && !signatureFile && !useExistingSignature) {
      showToast('Silakan pilih file tanda tangan atau gunakan tanda tangan yang sudah ada', 'error');
      return;
    }

    try {
      setIsApproving(true);
      if (activeTab === 'sph') {
        await api.approveSph(id.toString(), signatureFile || undefined, useExistingSignature);
      } else {
        await api.approveAudiensi(id.toString(), signatureFile || undefined, useExistingSignature);
      }
      showToast('Dokumen berhasil disetujui', 'success');
      await loadApprovals();
      setSelectedItem(null);
      setSignatureFile(null);
      setUseExistingSignature(false);
    } catch (error: any) {
      console.error('Failed to approve:', error);
      showToast(error.message || 'Gagal menyetujui dokumen', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const in_array = (needle: any, haystack: any[]) => {
    return haystack.indexOf(needle) !== -1;
  };

  const handleClientDecision = async (decision: 'accepted' | 'rejected') => {
    if (!selectedItem) return;
    
    try {
      if (activeTab === 'sph') {
        await api.clientDecisionSph(selectedItem.id.toString(), decision);
      } else {
        await api.clientDecisionAudiensi(selectedItem.id.toString(), decision);
      }
      await loadApprovals();
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to update client decision:', error);
      showToast('Gagal memproses keputusan klien', 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      showToast('Pastikan Anda memasukkan alasan penolakan', 'error');
      return;
    }

    try {
      if (activeTab === 'sph') {
        await api.rejectSph(selectedItem.id.toString(), rejectionReason);
      } else {
        await api.rejectAudiensi(selectedItem.id.toString(), rejectionReason);
      }
      showToast('Dokumen berhasil ditolak', 'success');
      setRejectionReason('');
      setShowRejectModal(false);
      setSelectedItem(null);
      await loadApprovals();
    } catch (error) {
      console.error('Failed to reject:', error);
      showToast('Gagal menolak dokumen', 'error');
    }
  };

  if (!isApprover()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 dark:text-slate-400">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Persetujuan Dokumen</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review and approve SPH and Audiensi letters</p>
          </div>
          <button
            onClick={loadApprovals}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('sph')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sph'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            SPH
          </button>
          <button
            onClick={() => setActiveTab('audiensi')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'audiensi'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            Surat Audiensi
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-emerald-500"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading approvals...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No pending approvals</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate pr-2">{item.title}</h4>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.number}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{item.client_name}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>PIC: {item.pic}</span>
                      {item.value && (
                        <span>Rp {item.value.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selectedItem ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{selectedItem.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      <span>Number: {selectedItem.number}</span>
                      <span>Status: <span className="font-bold">{selectedItem.status}</span></span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Client</h4>
                    <p className="text-slate-600 dark:text-slate-300">{selectedItem.client_name}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Document Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Date:</span>
                        <p className="font-medium">{new Date(selectedItem.date).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">PIC:</span>
                        <p className="font-medium">{selectedItem.pic}</p>
                      </div>
                      {selectedItem.value && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Value:</span>
                          <p className="font-medium">Rp {selectedItem.value.toLocaleString('id-ID')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItem.description && (
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">Description/Content</h4>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedItem.description}</p>
                    </div>
                  )}

                  {(isSeniorManager() || isGeneralManager()) && (!selectedItem.is_new_application || activeTab !== 'sph') && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Input Tanda Tangan</h4>
                        {user?.signature && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="useExisting"
                              checked={useExistingSignature}
                              onChange={(e) => {
                                setUseExistingSignature(e.target.checked);
                                if (e.target.checked) setSignatureFile(null);
                              }}
                              className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary"
                            />
                            <label htmlFor="useExisting" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                              Gunakan Tanda Tangan Tersimpan
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                            {useExistingSignature ? 'Menggunakan tanda tangan yang tersimpan di profil Anda' : 'Silakan pilih file gambar tanda tangan (PNG/JPG)'}
                          </p>
                          <input 
                            type="file" 
                            accept="image/*"
                            disabled={useExistingSignature}
                            onChange={(e) => {
                              setSignatureFile(e.target.files?.[0] || null);
                              if (e.target.files?.[0]) setUseExistingSignature(false);
                            }}
                            className={`block w-full text-xs text-slate-500 dark:text-slate-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-xs file:font-black
                              ${useExistingSignature 
                                ? 'file:bg-slate-200 file:text-slate-400 cursor-not-allowed opacity-50' 
                                : 'file:bg-slate-800 file:text-white hover:file:bg-slate-900 dark:file:bg-slate-700 dark:hover:file:bg-slate-600 cursor-pointer'} 
                              transition-all`}
                          />
                          {signatureFile && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              File terpilih: {signatureFile.name}
                            </div>
                          )}
                        </div>

                        {(useExistingSignature && user?.signature) && (
                          <div className="flex flex-col items-center gap-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Preview</p>
                            <div className="h-16 w-24 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                              <img 
                                src={user.signature.startsWith('http') ? user.signature : `http://localhost:8000/storage/${user.signature}`} 
                                alt="Signature Preview" 
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {selectedItem.status === 'waiting_client' ? (
                      <>
                        <button
                          onClick={() => handleClientDecision('accepted')}
                          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          title="Client Accepted"
                        >
                          <span className="text-xl">✓</span> Client Accepted
                        </button>
                        <button
                          onClick={() => handleClientDecision('rejected')}
                          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                          title="Client Rejected"
                        >
                          <span className="text-xl">✕</span> Client Rejected
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(selectedItem.id)}
                          disabled={isApproving}
                          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isApproving ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                              Processing...
                            </>
                          ) : 'Approve & Sign'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-primary-dark transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">Select an item to review</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject Document</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-4 min-h-[100px]"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-primary-dark transition-colors"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProjectApprovalScreen;