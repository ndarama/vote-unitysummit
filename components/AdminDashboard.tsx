'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Category, Nominee, User, Vote } from '../types';
import {
  Trash2,
  Edit,
  Plus,
  Users,
  Award,
  Layers,
  BarChart2,
  LogOut,
  Activity,
  Filter,
  Eye,
  ShieldAlert,
  Lock,
  Unlock,
  Download,
  UserMinus,
  RotateCcw,
  FileBarChart,
} from 'lucide-react';
import VoteModal from './VoteModal';
import ConfirmDialog from './ConfirmDialog';
import CategoryReports from './CategoryReports';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'manager' | null>(null);
  const [activeTab, setActiveTab] = useState<
    'stats' | 'monitor' | 'categories' | 'nominees' | 'users' | 'integrity' | 'reports'
  >('stats');

  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Integrity State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [allVotes, setAllVotes] = useState<Vote[]>([]);
  const [recentVotes, setRecentVotes] = useState<Vote[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // Item being edited or null for new
  const [modalType, setModalType] = useState<'category' | 'nominee' | 'user' | null>(
    null
  );
  const [previewNominee, setPreviewNominee] = useState<Nominee | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFocalPoint, setImageFocalPoint] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDraggingFocal, setIsDraggingFocal] = useState(false);

  // Withdraw state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
  const [withdrawNote, setWithdrawNote] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  // Monitor Filters
  const [monitorCategoryFilter, setMonitorCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => {
        if (res.status === 401) router.push('/');
        return res.json();
      })
      .then((data) => setRole(data.role));

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for monitor data when active
  useEffect(() => {
    if (activeTab !== 'monitor') return;

    const interval = setInterval(() => {
      fetch('/api/admin/stats')
        .then((res) => res.json())
        .then(setStats)
        .catch(err => console.error('Error fetching stats:', err));
      fetch('/api/admin/votes/recent?limit=20')
        .then((res) => res.json())
        .then((data) => setRecentVotes(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error('Error fetching recent votes:', err);
          setRecentVotes([]);
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = () => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(err => console.error('Error fetching stats:', err));
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setCategories([]);
      });
    fetch('/api/admin/nominees/list')
      .then((res) => res.json())
      .then((data) => setNominees(data || []))
      .catch(err => {
        console.error('Error fetching nominees:', err);
        setNominees([]);
      });
    // Only fetch users if admin (will be checked on server too, but safe to try)
    fetch('/api/admin/users')
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => setUsers(data || []))
      .catch(err => {
        console.error('Error fetching users:', err);
        setUsers([]);
      });

    if (activeTab === 'integrity') {
      fetch('/api/admin/audit-logs')
        .then((res) => res.json())
        .then((data) => setAuditLogs(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error('Error fetching audit logs:', err);
          setAuditLogs([]);
        });
      fetch('/api/admin/system/config')
        .then((res) => res.json())
        .then(setSystemConfig)
        .catch(err => console.error('Error fetching system config:', err));
    }
    if (activeTab === 'integrity') {
      fetch('/api/admin/votes/all')
        .then((res) => res.json())
        .then((data) => setAllVotes(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error('Error fetching all votes:', err);
          setAllVotes([]);
        });
    }
    if (activeTab === 'monitor') {
      fetch('/api/admin/votes/recent?limit=20')
        .then((res) => res.json())
        .then((data) => setRecentVotes(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error('Error fetching recent votes:', err);
          setRecentVotes([]);
        });
    }
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Unity Awards 2026 — Stemmeresultater', 14, 20);
    doc.setFontSize(10);
    doc.text(`Eksportert: ${new Date().toLocaleString('nb-NO')}`, 14, 28);
    let y = 36;
    categories.forEach((cat) => {
      const rows = nominees
        .filter((n) => n.categoryId === cat.id)
        .map((n) => [n.name, n.title, String(stats?.[n.id] || 0)])
        .sort((a, b) => Number(b[2]) - Number(a[2]));
      autoTable(doc, {
        head: [[cat.title, 'Tittel', 'Stemmer']],
        body: rows,
        startY: y,
        headStyles: { fillColor: [0, 40, 56] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    });
    doc.save('unity-awards-2026-resultater.pdf');
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleDelete = (type: 'categories' | 'nominees' | 'users', id: string) => {
    showConfirm('Er du sikker på at du vil slette dette elementet?', async () => {
      setConfirmDialog(null);
      const res = await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Kunne ikke slette elementet');
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Upload image file if one was selected
    const imageFile = formData.get('imageFile') as File | null;
    let uploadedImageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const uploadData = new FormData();
      uploadData.append('file', imageFile);
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: uploadData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        alert(err?.error ?? 'Kunne ikke laste opp bilde');
        return;
      }
      const result = await uploadRes.json();
      uploadedImageUrl = result.url;
    }

    // Build data object, skipping the file field
    const data: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'imageFile') data[key] = value;
    }
    if (uploadedImageUrl) data.imageUrl = uploadedImageUrl;

    const endpoint = `/api/admin/${modalType === 'category' ? 'categories' : modalType === 'nominee' ? 'nominees' : 'users'}`;
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        setImagePreview(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? 'Kunne ikke lagre endringer');
      }
    } catch (err) {
      console.error('handleSave error:', err);
      alert('Nettverksfeil – sjekk at serveren kjører.');
    }
  };

  const togglePollLock = async () => {
    if (!systemConfig) return;
    const res = await fetch('/api/admin/system/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked: !systemConfig.pollLocked }),
    });
    if (res.ok) {
      const config = await res.json();
      setSystemConfig(config);
      fetchData(); // Refresh audit logs
    }
  };

  const invalidateVote = (email: string, categoryId: string, reason: string) => {
    showConfirm('Er du sikker på at du vil ugyldiggjøre denne stemmen?', async () => {
      setConfirmDialog(null);
      const res = await fetch('/api/admin/votes/invalidate', {
      method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, categoryId, reason }),
      });
      if (res.ok) fetchData();
    });
  };

  const openWithdrawModal = (id: string) => {
    setWithdrawTargetId(id);
    setWithdrawNote('');
    setWithdrawModalOpen(true);
  };

  const handleWithdraw = async () => {
    if (!withdrawTargetId || !withdrawNote.trim()) return;
    const res = await fetch(`/api/admin/nominees/${withdrawTargetId}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: withdrawNote.trim() }),
    });
    if (res.ok) {
      setWithdrawModalOpen(false);
      setWithdrawTargetId(null);
      setWithdrawNote('');
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? 'Kunne ikke trekke tilbake nominert');
    }
  };

  const handleRestore = (id: string) => {
    showConfirm('Gjenopprett denne nominerte til den offentlige listen?', async () => {
      setConfirmDialog(null);
      const res = await fetch(`/api/admin/nominees/${id}/withdraw`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Kunne ikke gjenopprette nominert');
      }
    });
  };

  const openModal = (type: 'category' | 'nominee' | 'user', item: any = null) => {    setModalType(type);
    setEditingItem(item);
    setImagePreview(null);
    if (item?.imageFocalPoint) {
      const parts = item.imageFocalPoint.split(' ');
      setImageFocalPoint({ x: parseFloat(parts[0]), y: parseFloat(parts[1]) });
    } else {
      setImageFocalPoint({ x: 50, y: 50 });
    }
    setIsModalOpen(true);
  };

  const handleFocalDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setImageFocalPoint({ x, y });
  };

  if (!role) return <div className="p-10 text-center">Laster...</div>;

  const filteredCategories =
    monitorCategoryFilter === 'all'
      ? categories
      : categories.filter((c) => c.id === monitorCategoryFilter);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-unity-blue text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{role}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'stats' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <BarChart2 size={20} /> Oversikt
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'monitor' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <Activity size={20} /> Monitor
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <Layers size={20} /> Kategorier
          </button>
          <button
            onClick={() => setActiveTab('nominees')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'nominees' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <Award size={20} /> Nominerte
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <FileBarChart size={20} /> Rapporter
          </button>
          {role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
              >
                <Users size={20} /> Brukere
              </button>
              <button
                onClick={() => setActiveTab('integrity')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'integrity' ? 'bg-unity-orange text-white' : 'hover:bg-white/10 text-gray-300'}`}
              >
                <ShieldAlert size={20} /> Integritet
              </button>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-100 transition-colors"
          >
            <LogOut size={20} /> Logg ut
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'stats' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm mb-8">
              <h2 className="text-3xl font-bold text-unity-blue mb-4">
                Velkommen tilbake, {role === 'admin' ? 'Administrator' : 'Manager'}!
              </h2>
              <p className="text-gray-600 text-lg">
                Her har du full oversikt over Unity Awards 2026. Bruk menyen til venstre for å
                administrere kategorier, nominerte og se live stemmegivning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-unity-blue">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                      Totalt Stemmer
                    </p>
                    <h3 className="text-4xl font-bold text-gray-800">
                      {stats
                        ? Number(Object.values(stats).reduce((a: any, b: any) => a + b, 0))
                        : 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-unity-blue">
                    <Activity size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-unity-orange">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                      Kategorier
                    </p>
                    <h3 className="text-4xl font-bold text-gray-800">{categories?.length || 0}</h3>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-unity-orange">
                    <Layers size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                      Nominerte
                    </p>
                    <h3 className="text-4xl font-bold text-gray-800">{nominees?.length || 0}</h3>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <Award size={24} />
                  </div>
                </div>
              </div>
            </div>

            {stats && (
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-gray-800">Stemmer per kategori</h3>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-unity-blue text-white rounded-lg hover:bg-unity-orange transition-colors text-sm font-medium"
                  >
                    <Download size={16} /> Eksporter PDF
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={categories.map((cat) => ({
                      name: cat.title.replace(' 2026', ''),
                      Stemmer: nominees
                        .filter((n) => n.categoryId === cat.id)
                        .reduce((sum, n) => sum + (stats?.[n.id] || 0), 0),
                    }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 55 }}
                  >
                    <XAxis
                      dataKey="name"
                      angle={-20}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Stemmer" radius={[6, 6, 0, 0]}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#001f2b' : '#ff6b35'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Live Monitor</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Filter
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <select
                    value={monitorCategoryFilter}
                    onChange={(e) => setMonitorCategoryFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-unity-orange outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">Alle kategorier</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${monitorCategoryFilter === 'all' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 mb-8`}
            >
              {filteredCategories.map((category) => {
                const categoryNominees = (nominees || [])
                  .filter((n) => n.categoryId === category.id)
                  .map((n) => ({ ...n, votes: stats ? stats[n.id] || 0 : 0 }))
                  .sort((a, b) => b.votes - a.votes);

                const totalCategoryVotes = categoryNominees.reduce((sum, n) => sum + n.votes, 0);

                return (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 truncate" title={category.title}>
                        {category.title}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">
                        {totalCategoryVotes} stemmer
                      </span>
                    </div>
                    <div className="divide-y overflow-y-auto max-h-96">
                      {categoryNominees.map((nominee, index) => {
                        const percentage =
                          totalCategoryVotes > 0
                            ? ((nominee.votes / totalCategoryVotes) * 100).toFixed(1)
                            : '0.0';

                        return (
                          <div
                            key={nominee.id}
                            className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-grow">
                              <span
                                className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {index + 1}
                              </span>
                              <Image
                                src={nominee.imageUrl}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="w-8 h-8 rounded-full object-cover bg-gray-200 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-grow">
                                <p className="font-medium text-gray-700 truncate text-sm">
                                  {nominee.name}
                                </p>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-unity-blue h-1.5 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4 min-w-[80px]">
                              <div className="font-bold text-unity-blue text-sm">
                                {nominee.votes}{' '}
                                <span className="text-gray-400 font-normal text-xs">
                                  / {totalCategoryVotes}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 font-medium">{percentage}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Votes Feed */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-8">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Activity size={16} className="text-unity-orange" />
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                  Siste stemmer (live)
                </h3>
              </div>
              <div className="divide-y overflow-y-auto max-h-80">
                {!recentVotes || recentVotes.length === 0 ? (
                  <p className="p-6 text-center text-gray-400 text-sm">Ingen stemmer ennå.</p>
                ) : (
                  recentVotes.map((vote, i) => {
                    const nom = nominees?.find((n) => n.id === vote.nomineeId);
                    const cat = categories?.find((c) => c.id === vote.categoryId);
                    const masked = vote.email.replace(
                      /(.{2})(.*)(@.*)/,
                      (_m, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c
                    );
                    return (
                      <div
                        key={i}
                        className="p-3 flex items-center justify-between text-sm hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {nom?.imageUrl && (
                            <Image
                              src={nom.imageUrl}
                              alt=""
                              width={28}
                              height={28}
                              unoptimized
                              className="w-7 h-7 rounded-full object-cover bg-gray-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {nom?.name ?? vote.nomineeId}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {cat?.title ?? vote.categoryId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3 space-y-0.5">
                          <p className="text-xs font-mono text-gray-500">{masked}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(vote.timestamp).toLocaleTimeString('nb-NO')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Kategorier</h2>
              <button
                onClick={() => openModal('category')}
                className="bg-unity-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-unity-orange transition-colors"
              >
                <Plus size={18} /> Ny Kategori
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Tittel</th>
                    <th className="p-4 font-semibold text-gray-600">Beskrivelse</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{cat.title}</td>
                      <td className="p-4 text-gray-500 truncate max-w-xs">{cat.description}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openModal('category', cat)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete('categories', cat.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'nominees' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Nominerte</h2>
              <button
                onClick={() => openModal('nominee')}
                className="bg-unity-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-unity-orange transition-colors"
              >
                <Plus size={18} /> Ny Nominert
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Navn</th>
                    <th className="p-4 font-semibold text-gray-600">Kategori</th>
                    <th className="p-4 font-semibold text-gray-600">Tittel</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {!nominees || nominees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Ingen nominerte funnet.
                      </td>
                    </tr>
                  ) : (
                    nominees.map((nom) => (
                    <tr key={nom.id} className={`hover:bg-gray-50 ${nom.withdrawn ? 'opacity-60 bg-gray-50' : ''}`}>
                      <td className="p-4 font-medium flex items-center gap-3">
                        <Image
                          src={nom.imageUrl}
                          alt=""
                          width={32}
                          height={32}
                          unoptimized
                          className="w-8 h-8 rounded-full object-cover bg-gray-200"
                        />
                        {nom.name}
                      </td>
                      <td className="p-4 text-gray-500">
                        {categories.find((c) => c.id === nom.categoryId)?.title || 'Ukjent'}
                      </td>
                      <td className="p-4 text-gray-500">{nom.title}</td>
                      <td className="p-4">
                        {nom.withdrawn ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
                            title={nom.withdrawalNote}
                          >
                            <UserMinus size={12} /> Trukket tilbake
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Aktiv
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setPreviewNominee(nom)}
                          className="text-gray-600 hover:text-gray-800 p-1"
                          title="Forhåndsvisning"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openModal('nominee', nom)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Rediger"
                        >
                          <Edit size={18} />
                        </button>
                        {nom.withdrawn ? (
                          <button
                            onClick={() => handleRestore(nom.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Gjenopprett"
                          >
                            <RotateCcw size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openWithdrawModal(nom.id)}
                            className="text-orange-500 hover:text-orange-700 p-1"
                            title="Trekk tilbake"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete('nominees', nom.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Slett"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && role === 'admin' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Brukere</h2>
              <button
                onClick={() => openModal('user')}
                className="bg-unity-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-unity-orange transition-colors"
              >
                <Plus size={18} /> Ny Bruker
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Brukernavn</th>
                    <th className="p-4 font-semibold text-gray-600">E-post</th>
                    <th className="p-4 font-semibold text-gray-600">Rolle</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {!users || users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        Ingen brukere funnet.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{user.username}</td>
                      <td className="p-4 text-gray-500">{user.email || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openModal('user', user)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete('users', user.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="max-w-7xl mx-auto">
            <CategoryReports />
          </div>
        )}

        {activeTab === 'integrity' && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* System Status */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShieldAlert className="text-purple-500" /> Systemstatus
                </h3>
                <p className="text-gray-500 mt-1">
                  {systemConfig?.pollLocked
                    ? 'Avstemningen er stengt. Ingen nye stemmer kan registreres.'
                    : 'Avstemningen er åpen og aktiv.'}
                </p>
              </div>
              <button
                onClick={togglePollLock}
                className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${systemConfig?.pollLocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                {systemConfig?.pollLocked ? <Unlock size={20} /> : <Lock size={20} />}
                {systemConfig?.pollLocked ? 'Åpne Avstemning' : 'Steng Avstemning'}
              </button>
            </div>

            {/* Suspicious Votes */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <ShieldAlert className="text-red-500" size={20} /> Mistenkelige Stemmer
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600">Tidspunkt</th>
                      <th className="p-4 font-semibold text-gray-600">E-post</th>
                      <th className="p-4 font-semibold text-gray-600">IP</th>
                      <th className="p-4 font-semibold text-gray-600">Score</th>
                      <th className="p-4 font-semibold text-gray-600 text-right">Handling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!allVotes || allVotes.filter((v) => v.flagged && !v.invalid).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Ingen mistenkelige stemmer funnet.
                        </td>
                      </tr>
                    ) : (
                      allVotes
                        .filter((v) => v.flagged && !v.invalid)
                        .map((vote, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-4 text-sm">
                              {new Date(vote.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4 font-mono text-sm">{vote.email}</td>
                            <td className="p-4 font-mono text-sm">{vote.ip || 'N/A'}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                {vote.anomalyScore || 0}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() =>
                                  invalidateVote(
                                    vote.email,
                                    vote.categoryId,
                                    'Flagged as suspicious'
                                  )
                                }
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Ugyldiggjør
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">Sikkerhetslogg</h3>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600">Tidspunkt</th>
                      <th className="p-4 font-semibold text-gray-600">Type</th>
                      <th className="p-4 font-semibold text-gray-600">Alvorlighetsgrad</th>
                      <th className="p-4 font-semibold text-gray-600">Melding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!auditLogs || auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          Ingen revisjonslogger ennå.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm font-medium uppercase tracking-wider">
                          {log.type}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                              log.severity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : log.severity === 'medium'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-4 text-sm">{log.message}</td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 sticky top-0 bg-white pb-2 border-b z-10">
              {editingItem ? 'Rediger' : 'Ny'}{' '}
              {modalType === 'category'
                ? 'Kategori'
                : modalType === 'nominee'
                  ? 'Nominert'
                  : 'Bruker'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {modalType === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tittel</label>
                    <input
                      name="title"
                      defaultValue={editingItem?.title}
                      required
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beskrivelse
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingItem?.description}
                      required
                      className="w-full border rounded-lg p-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bilde</label>
                    {(imagePreview || editingItem?.imageUrl) && (
                      <div
                        className="w-full h-32 overflow-hidden rounded-lg mb-1 border relative select-none cursor-crosshair"
                        onMouseDown={(e) => { setIsDraggingFocal(true); handleFocalDrag(e); }}
                        onMouseMove={(e) => { if (isDraggingFocal) handleFocalDrag(e); }}
                        onMouseUp={() => setIsDraggingFocal(false)}
                        onMouseLeave={() => setIsDraggingFocal(false)}
                        onTouchStart={(e) => { setIsDraggingFocal(true); handleFocalDrag(e); }}
                        onTouchMove={(e) => { if (isDraggingFocal) handleFocalDrag(e); }}
                        onTouchEnd={() => setIsDraggingFocal(false)}
                      >
                        <Image
                          src={imagePreview ?? editingItem?.imageUrl ?? ''}
                          alt="Forhåndsvisning"
                          fill
                          unoptimized
                          className="object-cover pointer-events-none"
                          style={{ objectPosition: `${imageFocalPoint.x}% ${imageFocalPoint.y}%` }}
                        />
                        <div
                          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg bg-white/20 pointer-events-none"
                          style={{ left: `${imageFocalPoint.x}%`, top: `${imageFocalPoint.y}%`, transform: 'translate(-50%, -50%)' }}
                        />
                        <p className="absolute bottom-1 right-2 text-xs text-white bg-black/40 px-1.5 py-0.5 rounded pointer-events-none">
                          Dra for å justere
                        </p>
                      </div>
                    )}
                    <input
                      name="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImagePreview(URL.createObjectURL(file));
                      }}
                      className="w-full border rounded-lg p-2 text-sm"
                      required={!editingItem}
                    />
                    {editingItem?.imageUrl && (
                      <input type="hidden" name="imageUrl" defaultValue={editingItem.imageUrl} />
                    )}
                    <input
                      type="hidden"
                      name="imageFocalPoint"
                      value={`${imageFocalPoint.x.toFixed(1)}% ${imageFocalPoint.y.toFixed(1)}%`}
                    />
                  </div>
                </>
              )}

              {modalType === 'nominee' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
                    <input
                      name="name"
                      defaultValue={editingItem?.name}
                      required
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      name="categoryId"
                      defaultValue={editingItem?.categoryId}
                      required
                      className="w-full border rounded-lg p-2"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tittel / Rolle
                    </label>
                    <input
                      name="title"
                      defaultValue={editingItem?.title}
                      required
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beskrivelse
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingItem?.description}
                      required
                      className="w-full border rounded-lg p-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bilde</label>
                    {(imagePreview || editingItem?.imageUrl) && (
                      <div className="flex gap-4 mb-3 items-start">
                        {/* Focal point editor — portrait card */}
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Juster fokuspunkt</p>
                          <div
                            className="w-full aspect-[3/4] overflow-hidden rounded-xl border border-gray-200 relative select-none cursor-crosshair shadow-sm"
                            onMouseDown={(e) => { setIsDraggingFocal(true); handleFocalDrag(e); }}
                            onMouseMove={(e) => { if (isDraggingFocal) handleFocalDrag(e); }}
                            onMouseUp={() => setIsDraggingFocal(false)}
                            onMouseLeave={() => setIsDraggingFocal(false)}
                            onTouchStart={(e) => { setIsDraggingFocal(true); handleFocalDrag(e); }}
                            onTouchMove={(e) => { if (isDraggingFocal) handleFocalDrag(e); }}
                            onTouchEnd={() => setIsDraggingFocal(false)}
                          >
                            <Image
                              src={imagePreview ?? editingItem?.imageUrl ?? ''}
                              alt="Forhåndsvisning"
                              fill
                              unoptimized
                              className="object-cover pointer-events-none"
                              style={{ objectPosition: `${imageFocalPoint.x}% ${imageFocalPoint.y}%` }}
                            />
                            <div
                              className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg bg-white/30 pointer-events-none ring-2 ring-unity-orange/60"
                              style={{ left: `${imageFocalPoint.x}%`, top: `${imageFocalPoint.y}%`, transform: 'translate(-50%, -50%)' }}
                            />
                            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white bg-black/40 py-0.5 pointer-events-none">
                              Dra for å justere
                            </p>
                          </div>
                        </div>
                        {/* Card preview */}
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Kortvisning</p>
                          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="aspect-[3/4] overflow-hidden relative">
                              <Image
                                src={imagePreview ?? editingItem?.imageUrl ?? ''}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                                style={{ objectPosition: `${imageFocalPoint.x}% ${imageFocalPoint.y}%` }}
                              />
                            </div>
                            <div className="p-2 text-center">
                              <p className="text-xs font-bold text-unity-blue truncate">
                                {editingItem?.name || 'Navn'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <input
                      name="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImagePreview(URL.createObjectURL(file));
                      }}
                      className="w-full border rounded-lg p-2 text-sm"
                      required={!editingItem}
                    />
                    {editingItem?.imageUrl && (
                      <input type="hidden" name="imageUrl" defaultValue={editingItem.imageUrl} />
                    )}
                    <input
                      type="hidden"
                      name="imageFocalPoint"
                      value={`${imageFocalPoint.x.toFixed(1)}% ${imageFocalPoint.y.toFixed(1)}%`}
                    />
                  </div>
                </>
              )}

              {modalType === 'user' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brukernavn
                    </label>
                    <input
                      name="username"
                      defaultValue={editingItem?.username}
                      required
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={editingItem?.email}
                      required
                      className="w-full border rounded-lg p-2"
                      placeholder="bruker@eksempel.no"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passord</label>
                    <input
                      name="password"
                      type="password"
                      defaultValue={editingItem?.password}
                      required
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                    <select
                      name="role"
                      defaultValue={editingItem?.role || 'manager'}
                      required
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {!editingItem && (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                      En invitasjon vil bli sendt til denne e-postadressen med påloggingsinformasjon.
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setImagePreview(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-unity-blue text-white rounded-lg hover:bg-unity-orange transition-colors"
                >
                  Lagre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewNominee && (
        <VoteModal
          nominee={previewNominee}
          onClose={() => setPreviewNominee(null)}
          onSuccess={() => {}}
          mode="preview"
        />
      )}

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <UserMinus size={20} className="text-orange-500" /> Trekk tilbake nominert
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Nominerte vil ikke lenger vises offentlig. Du kan gjenopprette dem senere.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Begrunnelse (kreves)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-unity-orange"
              rows={3}
              placeholder="Skriv årsaken til tilbaketrekkingen..."
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setWithdrawModalOpen(false); setWithdrawTargetId(null); setWithdrawNote(''); }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawNote.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trekk tilbake
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
