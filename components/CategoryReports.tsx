'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  Filter,
  RefreshCw,
  FileBarChart,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategoryReportFilters {
  categoryId: string;
  includeInvalid: boolean;
  includeFlagged: boolean;
  startDate: string;
  endDate: string;
}

interface NomineeStats {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  votes: number;
  flaggedVotes: number;
  invalidVotes: number;
  totalVotes: number;
  percentage: string;
}

interface CategoryReport {
  category: {
    id: string;
    title: string;
    description: string;
  };
  stats: {
    totalVotes: number;
    validVotes: number;
    invalidVotes: number;
    flaggedVotes: number;
    uniqueVoters: number;
  };
  nominees: NomineeStats[];
  recentVotes: Array<{
    id: string;
    email: string;
    nomineeName: string;
    timestamp: number;
    flagged: boolean;
    invalid: boolean;
    anomalyScore: number | null;
  }>;
}

interface ReportData {
  summary: {
    totalCategories: number;
    totalVotes: number;
    validVotes: number;
    invalidVotes: number;
    flaggedVotes: number;
    uniqueVoters: number;
  };
  categories: CategoryReport[];
  filters: CategoryReportFilters;
  generatedAt: string;
}

interface Category {
  id: string;
  title: string;
}

const CategoryReports: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<CategoryReportFilters>({
    categoryId: 'all',
    includeInvalid: false,
    includeFlagged: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        categoryId: filters.categoryId,
        includeInvalid: filters.includeInvalid.toString(),
        includeFlagged: filters.includeFlagged.toString(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const res = await fetch(`/api/admin/reports/category?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        alert('Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CategoryReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add logo
    try {
      const logoUrl = 'https://res.cloudinary.com/dulzeafbm/image/upload/v1771503897/Unity_Summit_Logo-02_hdljmo.png';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/png');
            
            // Add logo (centered, at top)
            const logoWidth = 40;
            const logoHeight = (img.height / img.width) * logoWidth;
            doc.addImage(imgData, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
            resolve(true);
          } catch (error) {
            console.error('Error adding logo:', error);
            resolve(false);
          }
        };
        img.onerror = () => resolve(false);
        img.src = logoUrl;
      });
    } catch (error) {
      console.error('Error loading logo:', error);
    }
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Unity Summit - Category Voting Report', pageWidth / 2, 35, { align: 'center' });
    
    // Generated date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const generatedDate = new Date(reportData.generatedAt).toLocaleString('no-NO');
    doc.text(`Generated: ${generatedDate}`, pageWidth / 2, 43, { align: 'center' });
    
    // Filter info
    if (filters.categoryId !== 'all') {
      const selectedCategory = reportData.categories.find(c => c.category.id === filters.categoryId);
      if (selectedCategory) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Category: ${selectedCategory.category.title}`, pageWidth / 2, 49, { align: 'center' });
      }
    }
    
    let yPos = 58;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Overall Summary (only show if all categories or multiple categories in results)
    if (reportData.categories.length > 1 || filters.categoryId === 'all') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Summary', 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Categories', reportData.summary.totalCategories.toString()],
        ['Total Votes', reportData.summary.totalVotes.toString()],
        ['Valid Votes', reportData.summary.validVotes.toString()],
        ['Invalid Votes', reportData.summary.invalidVotes.toString()],
        ['Flagged Votes', reportData.summary.flaggedVotes.toString()],
        ['Unique Voters', reportData.summary.uniqueVoters.toString()],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Category Reports - filter based on selection
    const categoriesToExport = filters.categoryId === 'all' 
      ? reportData.categories 
      : reportData.categories.filter(c => c.category.id === filters.categoryId);

    categoriesToExport.forEach((categoryReport, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${categoryReport.category.title}`, 14, yPos);
      yPos += 8;

      // Category Stats
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const categoryStats = [
        ['Total Votes', categoryReport.stats.totalVotes.toString()],
        ['Valid Votes', categoryReport.stats.validVotes.toString()],
        ['Invalid Votes', categoryReport.stats.invalidVotes.toString()],
        ['Flagged Votes', categoryReport.stats.flaggedVotes.toString()],
        ['Unique Voters', categoryReport.stats.uniqueVoters.toString()],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: categoryStats,
        theme: 'plain',
        headStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Nominee Results
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Nominee Results:', 14, yPos);
      yPos += 6;

      const nomineeData = categoryReport.nominees.map((nominee, idx) => [
        (idx + 1).toString(),
        nominee.name,
        nominee.title,
        nominee.votes.toString(),
        `${nominee.percentage}%`,
        nominee.flaggedVotes.toString(),
        nominee.invalidVotes.toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Name', 'Title', 'Votes', '%', 'Flagged', 'Invalid']],
        body: nomineeData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    // Save PDF
    const fileName = `unity-summit-report-${filters.categoryId}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = 'Category,Nominee Name,Nominee Title,Votes,Percentage,Flagged Votes,Invalid Votes\n';

    // Filter based on selection
    const categoriesToExport = filters.categoryId === 'all' 
      ? reportData.categories 
      : reportData.categories.filter(c => c.category.id === filters.categoryId);

    categoriesToExport.forEach(categoryReport => {
      categoryReport.nominees.forEach(nominee => {
        csvContent += `"${categoryReport.category.title}","${nominee.name}","${nominee.title}",${nominee.votes},${nominee.percentage}%,${nominee.flaggedVotes},${nominee.invalidVotes}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `unity-summit-report-${filters.categoryId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Category Reports</h2>
            <p className="text-sm text-gray-600">Generate and export detailed voting reports</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Include Invalid */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeInvalid"
                checked={filters.includeInvalid}
                onChange={(e) => handleFilterChange('includeInvalid', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeInvalid" className="text-sm font-medium text-gray-700">
                Include Invalid Votes
              </label>
            </div>

            {/* Include Flagged */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeFlagged"
                checked={filters.includeFlagged}
                onChange={(e) => handleFilterChange('includeFlagged', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeFlagged" className="text-sm font-medium text-gray-700">
                Include Flagged Votes
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>

            {reportData && (
              <>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Overall Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-500" />
              Overall Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Categories</div>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.summary.totalCategories}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Votes</div>
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.summary.totalVotes}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Valid Votes</div>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.validVotes}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Invalid Votes</div>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.summary.invalidVotes}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Flagged Votes</div>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.summary.flaggedVotes}
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Unique Voters</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {reportData.summary.uniqueVoters}
                </div>
              </div>
            </div>
          </div>

          {/* Category Reports */}
          {reportData.categories.map((categoryReport, index) => (
            <div key={categoryReport.category.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">
                {index + 1}. {categoryReport.category.title}
              </h3>

              {/* Category Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Total Votes</div>
                  <div className="text-lg font-bold">{categoryReport.stats.totalVotes}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Valid</div>
                  <div className="text-lg font-bold text-green-600">{categoryReport.stats.validVotes}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Invalid</div>
                  <div className="text-lg font-bold text-red-600">{categoryReport.stats.invalidVotes}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Flagged</div>
                  <div className="text-lg font-bold text-orange-600">{categoryReport.stats.flaggedVotes}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Unique Voters</div>
                  <div className="text-lg font-bold text-indigo-600">{categoryReport.stats.uniqueVoters}</div>
                </div>
              </div>

              {/* Nominee Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Nominee</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Votes</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Percentage</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Flagged</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Invalid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryReport.nominees.map((nominee, idx) => (
                      <tr key={nominee.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          } font-bold text-sm`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{nominee.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{nominee.title}</td>
                        <td className="px-4 py-3 text-right font-semibold">{nominee.votes}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                            {nominee.percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {nominee.flaggedVotes > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-600">
                              <AlertTriangle className="w-4 h-4" />
                              {nominee.flaggedVotes}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {nominee.invalidVotes > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              {nominee.invalidVotes}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Data State */}
      {!loading && !reportData && (
        <div className="bg-white p-12 rounded-lg shadow-md border border-gray-200 text-center">
          <FileBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Report Generated</h3>
          <p className="text-gray-600">Click &quot;Generate Report&quot; to create your first report</p>
        </div>
      )}
    </div>
  );
};

export default CategoryReports;
