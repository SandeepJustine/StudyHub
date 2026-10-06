'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, User, Mail, Phone, Award, FileText, CheckCircle, Upload, X, Eye, Shield } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

type KycDoc = {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reviewer: { fullName: string; email: string } | null;
};

const KYC_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'CERTIFICATE', label: 'Certificate / Qualification' },
  { value: 'OTHER', label: 'Other' },
] as const;

export default function InstructorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [bankDetails, setBankDetails] = useState<any>({});
  const [kycType, setKycType] = useState('NATIONAL_ID');

  useEffect(() => {
    fetchProfile();
    fetchKyc();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/instructor/profile');
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        setBio(json.data.bio || '');
        setExpertise(json.data.expertise || []);
        setBankDetails(json.data.bankDetails || {});
      } else {
        setError('Failed to load profile');
      }
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function fetchKyc() {
    setKycLoading(true);
    try {
      const res = await fetch('/api/instructor/kyc');
      if (res.ok) {
        const json = await res.json();
        setKycDocs(json.data || []);
      }
    } catch {
      // non-blocking
    } finally {
      setKycLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/instructor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          expertise,
          bankDetails,
        }),
      });
      if (res.ok) {
        setSuccess('Profile updated successfully');
        await fetchProfile();
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to update profile');
      }
    } catch (e) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function addExpertise() {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()]);
    }
    setExpertiseInput('');
  }

  function removeExpertise(item: string) {
    setExpertise(expertise.filter((e) => e !== item));
  }

  async function handleKycUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', kycType);

      const res = await fetch('/api/instructor/kyc', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      setKycDocs((prev) => [json.data, ...prev]);
      setSuccess('Document uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleKycDelete(id: string) {
    if (!confirm('Remove this document?')) return;
    try {
      const res = await fetch(`/api/instructor/kyc/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Delete failed');
      }
      setKycDocs((prev) => prev.filter((d) => d.id !== id));
      setSuccess('Document removed');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-grey-light rounded animate-pulse w-48"></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-grey-light rounded animate-pulse"></div>
              <div className="h-4 bg-grey-light rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-grey-light rounded animate-pulse w-4/6"></div>
            </div>
            </CardContent>
          </Card>

          {/* KYC Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={18} className="text-blue-600" />
                KYC Verification
              </CardTitle>
              <CardDescription>
                Upload your National ID and certificates for admin review. Approved documents
                unlock verified status and payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload form */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-medium text-grey-dark mb-1">Document Type</label>
                  <select
                    value={kycType}
                    onChange={(e) => setKycType(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
                  >
                    {KYC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-grey-dark mb-1">File</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleKycUpload}
                    disabled={uploading}
                    className="block text-sm text-grey-dark file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-navy file:text-white hover:file:bg-navy/90 disabled:opacity-50"
                  />
                </div>
              </div>
              {uploading && (
                <p className="text-xs text-grey-medium">Uploading…</p>
              )}

              {/* Document list */}
              {kycLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-grey-light rounded animate-pulse" />
                  ))}
                </div>
              ) : kycDocs.length === 0 ? (
                <p className="text-sm text-grey-medium py-4 text-center">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {kycDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 p-3 bg-grey-light/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={18} className="text-navy shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-grey-medium">
                            {KYC_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
                            {' · '}
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                            {' · '}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          {doc.status !== 'PENDING' && doc.reviewNote && (
                            <p className="text-xs text-grey-dark mt-0.5">
                              Note: {doc.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            doc.status === 'APPROVED' ? 'success' :
                            doc.status === 'REJECTED' ? 'error' : 'warning'
                          }
                          size="sm"
                        >
                          {doc.status}
                        </Badge>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-grey-medium hover:text-navy rounded"
                          title="View"
                        >
                          <Eye size={14} />
                        </a>
                        {doc.status === 'PENDING' && (
                          <button
                            onClick={() => handleKycDelete(doc.id)}
                            className="p-1.5 text-grey-medium hover:text-red rounded"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">Error</h2>
        <p className="text-grey-dark">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Instructor Profile</h1>
          <p className="text-sm text-grey-medium">Manage your profile and payout settings</p>
        </div>
        <Button variant="primary" onClick={saveProfile} loading={saving} leftIcon={<Save size={18} />}>
          Save Changes
        </Button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your public profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center">
                  <User size={40} className="text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{profile?.user?.fullName}</h3>
                  <p className="text-sm text-grey-medium">{profile?.user?.email}</p>
                </div>
              </div>

              <Input
                label="Full Name"
                value={profile?.user?.fullName || ''}
                disabled
                helperText="Name is managed in account settings"
              />

              <Input
                label="Email"
                value={profile?.user?.email || ''}
                disabled
                helperText="Email is managed in account settings"
              />

              <Input
                label="Phone"
                value={profile?.user?.phone || ''}
                disabled
                helperText="Phone is managed in account settings"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Bio</label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[120px]"
                  placeholder="Tell students about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-grey-dark">Expertise</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {expertise.map((item) => (
                    <Badge key={item} variant="info" size="md" className="flex items-center gap-1">
                      {item}
                      <button
                        onClick={() => removeExpertise(item)}
                        className="text-grey-medium hover:text-red"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add expertise (e.g., Mathematics)"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    fullWidth={false}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addExpertise}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Information</CardTitle>
              <CardDescription>Bank details for receiving payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Account Holder Name"
                placeholder="John Doe"
                value={bankDetails?.accountHolderName || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
              />
              <Input
                label="Account Number"
                placeholder="1234567890"
                value={bankDetails?.accountNumber || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              />
              <Input
                label="Bank Name"
                placeholder="Standard Bank"
                value={bankDetails?.bankName || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              />
              <Input
                label="Payment Method"
                placeholder="AIRTEL_MONEY, TNM_MPAMBA, BANK_TRANSFER"
                value={bankDetails?.paymentMethod || 'AIRTEL_MONEY'}
                onChange={(e) => setBankDetails({ ...bankDetails, paymentMethod: e.target.value })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">{formatCurrency(profile?.totalEarnings || 0)}</p>
                <p className="text-sm text-grey-medium">Total Earnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">{formatCurrency(profile?.pendingEarnings || 0)}</p>
                <p className="text-sm text-grey-medium">Pending Payout</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">{Math.round((profile?.revenueShare || 0.7) * 100)}%</p>
                <p className="text-sm text-grey-medium">Revenue Share</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-dark">Verified Instructor</span>
                {profile?.isVerified ? (
                  <Badge variant="success" size="sm">Verified</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Pending</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-dark">Bank Details</span>
                {profile?.hasBankDetails ? (
                  <Badge variant="success" size="sm">Set</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Not Set</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-dark">Rating</span>
                <span className="font-semibold text-navy">★ {profile?.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-dark">Students</span>
                <span className="font-semibold text-navy">{profile?._count?.courses || 0} courses</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
