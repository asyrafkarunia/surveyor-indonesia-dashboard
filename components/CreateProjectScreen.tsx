
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import BackButton from './BackButton';

// Fix default marker icon
const DefaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface CreateProjectScreenProps {
  onCancel: () => void;
  onSave: () => void;
  initialClientId?: number | null;
}

interface AttachmentFile {
  file: File;
  name: string;
  size: string;
  id?: string;
}

interface Client {
  id: number;
  company_name: string;
  code: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  division?: string;
}

interface ProjectLocation {
  address: string;
  latitude: number | string;
  longitude: number | string;
}

const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({ onCancel, onSave, initialClientId }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [useCustomPic, setUseCustomPic] = useState(false);
  const [customTeamNotes, setCustomTeamNotes] = useState('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    client_id: initialClientId ? String(initialClientId) : '',
    start_date: '',
    end_date: '',
    budget: '',
    target_margin: '',
    pic_id: '',
    custom_pic_name: '',
    location_address: '',
    latitude: '',
    longitude: '',
    quality_standard: '',
    target_compliance: '',
    compliance_requirements: '',
    is_tender: false,
    pic_marketing_id: '',
  });

  const [paymentTerms, setPaymentTerms] = useState<any[]>([
    { term_date: '', percentage: '', amount: '', pic_name: '' }
  ]);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta default
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(13);

  // Helper: normalize division name – treat 'Operations' as 'Operasi'
  const normalizeDivision = (division?: string) => {
    if (!division) return '';
    const lower = division.trim().toLowerCase();
    if (lower === 'operations') return 'Operasi';
    return division.trim();
  };

  // Derived filtered user lists
  const marketingUsers = users.filter(u => u.role === 'marketing');
  const operasiUsers = users.filter(u => {
    const div = normalizeDivision(u.division);
    return div.toLowerCase().includes('operasi');
  });

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    try {
      // Only fetch active clients — Non-Aktif and Suspended clients should not be selectable
      const response: any = await api.getClients({ status: 'Aktif' });
      const data = response.data || response;
      setClients(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response: any = await (api as any).getUsers();
      const data = response.data || response;
      const rawUsers = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      // Normalize division names client-side before storing
      const normalizedUsers = rawUsers.map((u: User) => ({
        ...u,
        division: normalizeDivision(u.division),
      }));
      setUsers(normalizedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Helper function to format number with thousand separator
  const formatNumberInput = (value: string | number) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle formatted number inputs
    if (name === 'budget') {
      const rawValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: rawValue }));
      return;
    }

    if (name === 'is_tender') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentTermChange = (index: number, field: string, value: string) => {
    const updated = [...paymentTerms];
    
    if (field === 'amount') {
      updated[index][field] = value.replace(/\D/g, '');
    } else {
      updated[index][field] = value;
    }
    
    setPaymentTerms(updated);
  };

  const calculateRemainingPercentage = () => {
    const total = paymentTerms.reduce((sum, term) => sum + (parseFloat(term.percentage) || 0), 0);
    return Math.max(0, 100 - total);
  };

  const calculateRemainingAmount = () => {
    const budget = parseFloat(formData.budget) || 0;
    const total = paymentTerms.reduce((sum, term) => sum + (parseFloat(term.amount) || 0), 0);
    return Math.max(0, budget - total);
  };

  const addPaymentTerm = () => {
    setPaymentTerms([...paymentTerms, { term_date: '', percentage: '', amount: '', pic_name: '' }]);
  };

  const removePaymentTerm = (index: number) => {
    const updated = [...paymentTerms];
    updated.splice(index, 1);
    // Ensure at least one empty row remains
    if (updated.length === 0) {
      updated.push({ term_date: '', percentage: '', amount: '', pic_name: '' });
    }
    setPaymentTerms(updated);
  };

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    }));
    
    // Reverse geocoding using Nominatim (free OpenStreetMap geocoding)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          setFormData(prev => ({
            ...prev,
            location_address: data.display_name,
          }));
        }
      })
      .catch(err => console.error('Geocoding error:', err));
  };

  const handleSearchLocation = async () => {
    if (!searchLocation.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setMapCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
        setMapZoom(15);
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(8),
          longitude: lng.toFixed(8),
          location_address: result.display_name,
        }));
      } else {
        alert('Lokasi tidak ditemukan');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Gagal mencari lokasi');
    }
  };

  const handleAddLocation = () => {
    if (!formData.location_address || !formData.latitude || !formData.longitude) {
      alert('Tentukan alamat, latitude, dan longitude terlebih dahulu dari peta atau pencarian.');
      return;
    }
    
    // Check for duplicates based on lat/lng (with slight rounding)
    const isDuplicate = locations.some(loc => 
      Number(loc.latitude).toFixed(4) === Number(formData.latitude).toFixed(4) && 
      Number(loc.longitude).toFixed(4) === Number(formData.longitude).toFixed(4)
    );

    if (isDuplicate) {
      alert('Lokasi ini sudah ada dalam daftar.');
      return;
    }

    setLocations(prev => [...prev, {
      address: formData.location_address,
      latitude: formData.latitude,
      longitude: formData.longitude
    }]);

    // Optional: clear current formulation so they can pick another
    setFormData(prev => ({
      ...prev,
      location_address: '',
      latitude: '',
      longitude: ''
    }));
    setMarkerPosition(null);
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 20MB`);
        return;
      }

      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      setAttachments(prev => [...prev, {
        file,
        name: file.name,
        size: sizeStr,
      }]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTeamMember = () => {
    // This will be handled by a modal or dropdown
    // For now, we'll use a simple select approach
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare project data
      const projectData: any = {
        title: formData.title,
        description: formData.description || null,
        project_type: formData.project_type || null,
        client_id: parseInt(formData.client_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        target_margin: formData.target_margin ? parseFloat(formData.target_margin) : null,
        pic_id: useCustomPic ? null : (formData.pic_id ? parseInt(formData.pic_id) : null),
        custom_pic_name: useCustomPic ? (formData.custom_pic_name || null) : null,
        // Since we can have multiple locations, we still provide main location fields 
        // to maintain backward auth compatibility (we'll just use the first location in the array)
        location_address: locations.length > 0 ? locations[0].address : (formData.location_address || null),
        latitude: locations.length > 0 ? parseFloat(String(locations[0].latitude)) : (formData.latitude ? parseFloat(formData.latitude) : null),
        longitude: locations.length > 0 ? parseFloat(String(locations[0].longitude)) : (formData.longitude ? parseFloat(formData.longitude) : null),
        quality_standard: formData.quality_standard || null,
        target_compliance: formData.target_compliance || null,
        compliance_requirements: formData.compliance_requirements || null,
        is_tender: formData.is_tender,
        team_members: selectedTeamMembers,
        locations: locations.length > 0 ? locations : (formData.location_address ? [{
          address: formData.location_address,
          latitude: formData.latitude,
          longitude: formData.longitude
        }] : []),
        custom_team_notes: customTeamNotes || null,
        payment_terms: paymentTerms.filter(pt => pt.percentage || pt.amount || pt.term_date || pt.pic_name),
      };

      // Remove team_members if empty or not needed
      if (!projectData.team_members || projectData.team_members.length === 0) {
        delete projectData.team_members;
      }

      // Create project
      const project = await api.createProject(projectData);

      // Upload attachments
      if (attachments.length > 0 && project && (project as any).id) {
        for (const attachment of attachments) {
          try {
            await api.uploadProjectAttachment((project as any).id.toString(), attachment.file);
          } catch (error) {
            console.error('Failed to upload attachment:', attachment.name, error);
          }
        }
      }

      onSave();
    } catch (error: any) {
      console.error('Failed to create project:', error);
      alert(error.message || 'Gagal menyimpan proyek. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Map component that updates center when mapCenter changes
  const MapUpdater = () => {
    const map = useMap();
    useEffect(() => {
      map.setView(mapCenter, mapZoom);
      // Force Leaflet to recalc size when container changes (prevents grey area)
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    }, [mapCenter, mapZoom, map]);
    return null;
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-stone)' }}>
      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white sm:text-4xl">Tambah Proyek Baru</h2>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Silakan lengkapi formulir di bawah ini untuk mendaftarkan proyek assurance baru.</p>
            </div>
            <BackButton onClick={onCancel} className="mb-0" />
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Informasi Dasar */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary">info</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Dasar</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Klien <span className="text-primary">*</span>
                  </label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                    required
                  >
                    <option value="">Pilih Klien</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.code} - {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Judul Proyek <span className="text-primary">*</span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    placeholder="Masukkan nama lengkap proyek"
                    required
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    PIC Marketing <span className="text-primary">*</span>
                  </label>
                  <select
                    name="pic_marketing_id"
                    value={formData.pic_marketing_id}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                    required
                  >
                    <option value="">Pilih PIC Marketing</option>
                    {marketingUsers.length > 0 ? marketingUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    )) : (
                      <option disabled value="">Tidak ada pengguna Marketing</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Kategori Pengadaan <span className="text-primary">*</span>
                  </label>
                  <div className="flex gap-4 items-center h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="radio"
                        name="is_tender"
                        value="true"
                        checked={formData.is_tender === true}
                        onChange={handleInputChange}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      Proyek Tender
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="radio"
                        name="is_tender"
                        value="false"
                        checked={formData.is_tender === false}
                        onChange={handleInputChange}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      Non-Tender
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Deskripsi Proyek</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    placeholder="Jelaskan detail lingkup kerja proyek..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Jenis Proyek <span className="text-primary">*</span>
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                    required
                  >
                    <option value="">Pilih jenis proyek</option>
                    <option value="assurance">Assurance</option>
                    <option value="inspection">Inspection</option>
                    <option value="testing">Testing</option>
                    <option value="certification">Certification</option>
                    <option value="consultancy">Consultancy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lokasi Proyek */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary">distance</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lokasi Proyek</h3>
              </div>
              <div className="space-y-6">
                <div className="relative w-full aspect-video rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden" style={{ minHeight: '400px' }}>
                  {/* Search Box */}
                  <div className="absolute top-4 left-4 z-50 w-full max-w-md">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-md shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <input
                        className="border-none text-xs px-3 py-2 flex-1 focus:ring-0 text-slate-900 dark:text-white"
                        placeholder="Cari lokasi..."
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchLocation();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSearchLocation}
                        className="px-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                      </button>
                    </div>
                  </div>

                  {/* Map */}
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    onClick={handleMapClick}
                  >
                    <MapUpdater />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {markerPosition && (
                      <Marker position={markerPosition} icon={DefaultIcon} />
                    )}
                  </MapContainer>

                  {/* Coordinates Display */}
                  {markerPosition && (
                    <div className="absolute bottom-3 left-3 bg-white dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded text-[10px] text-slate-600 dark:text-slate-300 font-mono border border-white/50 shadow-sm z-50">
                      {formData.latitude}° N, {formData.longitude}° E
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                      Alamat Lengkap <span className="text-primary">*</span>
                    </label>
                    <textarea
                      name="location_address"
                      value={formData.location_address}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="Alamat otomatis terisi saat pin dipilih atau cari lokasi..."
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Latitude</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-primary">explore</span>
                      <input
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="-6.234567"
                        type="text"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Longitude</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-primary">explore</span>
                      <input
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="106.827234"
                        type="text"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddLocation}
                      disabled={!formData.location_address || !formData.latitude || !formData.longitude}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_location</span>
                      Tambahkan ke Daftar Lokasi
                    </button>
                  </div>

                  {locations.length > 0 && (
                    <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                        Lokasi Tersimpan ({locations.length})
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {locations.map((loc, index) => (
                          <div key={index} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 relative group">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2" title={loc.address}>
                                {loc.address}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">
                                {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLocation(index)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Hapus Lokasi"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            {index === 0 && (
                              <div className="absolute -top-2.5 -left-2.5 bg-primary text-white text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase">
                                Lokasi Utama
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Waktu & Nilai */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Waktu & Nilai</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Tanggal Mulai <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary">calendar_today</span>
                    <input
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                      type="date"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Tanggal Selesai <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary">calendar_today</span>
                    <input
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                      type="date"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Nilai Kontrak <span className="text-primary">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <span className="absolute left-4 text-sm font-black text-slate-400 group-focus-within:text-primary transition-colors">Rp</span>
                    <input
                      name="budget"
                      value={formatNumberInput(formData.budget)}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-12 pr-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="0"
                      type="text"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Margin Proyek Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary">percent</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Margin Proyek</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Target Margin (%) <span className="text-primary">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <input
                      name="target_margin"
                      value={formData.target_margin}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pr-12 pl-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="0"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                    />
                    <span className="absolute right-4 text-sm font-black text-slate-400 group-focus-within:text-primary transition-colors">%</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Tentukan persentase margin keuntungan yang diharapkan.</p>
                </div>
              </div>
            </div>

            {/* Detail Assurance */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detail Assurance</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Pelaksana (Project Lead) <span className="text-primary">*</span>
                  </label>
              <div className="flex gap-3 items-center">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="pic_mode"
                    checked={!useCustomPic}
                    onChange={() => setUseCustomPic(false)}
                    className="text-primary focus:ring-primary"
                  />
                  Pilih dari daftar
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="pic_mode"
                    checked={useCustomPic}
                    onChange={() => {
                      setUseCustomPic(true);
                      setFormData(prev => ({ ...prev, pic_id: '' }));
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  Ketik manual
                </label>
              </div>

              {!useCustomPic ? (
                <select
                  name="pic_id"
                  value={formData.pic_id}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                  required
                >
                  <option value="">Pilih Project Lead</option>
                  {operasiUsers.length > 0 ? operasiUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  )) : (
                    <option disabled value="">Tidak ada pengguna Divisi Operasi</option>
                  )}
                </select>
              ) : (
                <input
                  name="custom_pic_name"
                  value={formData.custom_pic_name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  placeholder="Tuliskan nama project lead"
                  required
                />
              )}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Anggota Tim Berdasarkan Akun</label>
                  
                  {/* Selected Chips */}
                  {selectedTeamMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedTeamMembers.map(userId => {
                        const user = users.find(u => u.id === userId);
                        if (!user) return null;
                        return (
                          <div key={userId} className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg border border-primary/20">
                            <div className="size-4 rounded-full bg-white/50 flex items-center justify-center text-[8px] font-black">
                              {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold leading-none">{user.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedTeamMembers(prev => prev.filter(id => id !== userId))}
                              className="ml-1 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Searchable Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Cari dan tambah anggota tim..."
                      className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                      value={teamSearchTerm}
                      onChange={(e) => {
                        setTeamSearchTerm(e.target.value);
                        if (!isTeamDropdownOpen) setIsTeamDropdownOpen(true);
                      }}
                      onFocus={() => setIsTeamDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsTeamDropdownOpen(false), 200)}
                    />

                    {/* Dropdown Options */}
                    {isTeamDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl max-h-[200px] overflow-y-auto custom-scrollbar">
                        {users.filter(u => 
                          !selectedTeamMembers.includes(u.id) &&
                          (u.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(teamSearchTerm.toLowerCase()))
                        ).length > 0 ? (
                          users.filter(u => 
                            !selectedTeamMembers.includes(u.id) &&
                            (u.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(teamSearchTerm.toLowerCase()))
                          ).map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                              onMouseDown={() => {
                                setSelectedTeamMembers((prev) => [...prev, u.id]);
                                setTeamSearchTerm('');
                              }}
                            >
                              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                  {u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{u.name}</span>
                                <span className="text-[10px] font-medium text-slate-500">{u.email}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <span className="text-xs text-slate-400 font-medium">
                              {users.length === 0 ? "Memuat anggota tim..." : "Tidak ada anggota tim yang cocok"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anggota Tim Tambahan (Ketik Manual)</label>
                    <textarea
                      value={customTeamNotes}
                      onChange={(e) => setCustomTeamNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                      rows={2}
                      placeholder="Pisahkan dengan koma jika lebih dari satu. Contoh: Budi Santoso, Andi Setiawan"
                    />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Tuliskan nama anggota tim yang belum memiliki akun pada sistem.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Standar Kualitas</label>
                    <select
                      name="quality_standard"
                      value={formData.quality_standard}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">Pilih Standar</option>
                      <option value="ISO 9001:2015">ISO 9001:2015</option>
                      <option value="ISO 14001:2015">ISO 14001:2015</option>
                      <option value="ISO 45001:2018">ISO 45001:2018</option>
                      <option value="ISO/IEC 27001">ISO/IEC 27001</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Target Kepatuhan</label>
                    <input
                      name="target_compliance"
                      value={formData.target_compliance}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none font-bold"
                      placeholder="Misal: Regulasi KLHK No. 12"
                      type="text"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[10px]">Persyaratan Kepatuhan Khusus</label>
                  <textarea
                    name="compliance_requirements"
                    value={formData.compliance_requirements}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    placeholder="Sebutkan jika ada persyaratan kepatuhan spesifik dari klien..."
                    rows={3}
                  />
                </div>
              </div>
            </div>            {/* Pengaturan Termin Pembayaran Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengaturan Termin Pembayaran</h3>
                </div>
                <button
                  type="button"
                  onClick={addPaymentTerm}
                  className="flex items-center gap-1.5 text-xs font-black text-primary hover:text-red-700 uppercase tracking-widest transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Tambah Termin
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Sisa Persentase: <span className={calculateRemainingPercentage() === 0 ? "text-emerald-500" : "text-amber-500"}>{calculateRemainingPercentage().toFixed(2)}%</span>
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Sisa Nominal: <span className={calculateRemainingAmount() === 0 ? "text-emerald-500" : "text-amber-500"}>Rp {calculateRemainingAmount().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 w-16">Termin</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 min-w-[130px]">Tanggal</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 w-24">Besaran (%)</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 min-w-[150px]">Nominal (Rp)</th>
                        <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 min-w-[150px]">PIC (Opsional)</th>
                        <th className="py-3 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paymentTerms.map((term, index) => (
                        <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-300">
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="date"
                              value={term.term_date}
                              onChange={(e) => handlePaymentTermChange(index, 'term_date', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={term.percentage}
                              onChange={(e) => handlePaymentTermChange(index, 'percentage', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                              placeholder="%"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                              <input
                                type="text"
                                value={term.amount ? Number(term.amount).toLocaleString('id-ID') : ''}
                                onChange={(e) => handlePaymentTermChange(index, 'amount', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={term.pic_name}
                              onChange={(e) => handlePaymentTermChange(index, 'pic_name', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                              placeholder="Nama PIC"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <button
                              type="button"
                              onClick={() => removePaymentTerm(index)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Lampiran & Dokumen Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary">attach_file</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lampiran & Dokumen</h3>
              </div>
              <div className="space-y-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-900 hover:border-primary transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary shadow-sm mb-3 transition-colors">
                    <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Klik untuk upload atau tarik file ke sini</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Hanya Dokumen Kontrak. PDF, DOCX (Max. 20MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[22px]">description</span>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{attachment.name}</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase">{attachment.size}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Footer Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 pb-12">
              <button
                onClick={onCancel}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 transition-all shadow-sm active:scale-95"
                type="button"
                disabled={loading}
              >
                Batal
              </button>
              <button
                className="rounded-lg bg-primary px-10 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Proyek'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="text-center py-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">© 2025 PT Surveyor Indonesia. All rights reserved.</p>
      </footer>
    </main>
  );
};

export default CreateProjectScreen;
