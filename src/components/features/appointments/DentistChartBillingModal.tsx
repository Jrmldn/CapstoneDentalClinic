'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, FileText, Trash2, Activity, ClipboardList, User, HeartPulse, Package, ShoppingBag } from 'lucide-react'
import { updateAppointmentStatus } from '@/actions/appointmentActions'
import { createDraftInvoice } from '@/actions/billingActions'
import { updateDentalChart } from '@/actions/dentalChartActions'
import { fetchPatientRecord } from '@/actions/patientMedicalActions'
import { addTreatmentRecords, addPrescriptions } from '@/actions/clinicalRecordActions'
import { addPeriodontalFindings } from '@/actions/periodontalFindingsActions'
import { updateInventoryStock } from '@/actions/inventoryActions'
import { fetchProducts } from '@/actions/serviceActions'
import { usePatientRecord } from '../patients/usePatientRecord'
import DentalChartTab from '../patients/DentalChartTab'
import TreatmentTab from '../patients/TreatmentTab'
import MedicalHistoryTab from '../patients/MedicalHistoryTab'
import PrescriptionsTab from '../patients/PrescriptionsTab'
import PeriodontalTab from '../patients/PeriodontalTab'
import FollowupsTab from '../patients/FollowupsTab'
import type { RecordTab, PatientRecord as FullPatientRecord } from '../patients/types'
import type { Appointment } from '../dashboard/DentistDashboardView'
import type { Service } from '../billing/types'
import type { ToothConditionData } from '@/actions/dentalChartActions'
import type { StagedTreatmentData } from '../patients/TreatmentTab'
import type { StagedPrescriptionData } from '../patients/PrescriptionsTab'
import type { PeriodontalFindingsInput } from '../patients/PeriodontalFindingsSection'
import { serviceRequiresToothNumber } from '@/utils/teeth'
import type { InventoryItem } from '../inventory/types'
import type { Product } from '../billing/types'

interface DentistChartBillingModalProps {
  appointment: Appointment | null
  onClose: () => void
  clinicId: number
  dentistUserId: string
  dentistId: number
  dentistName: string
  branchName: string
  services: Service[]
  inventoryItems: InventoryItem[]
  onSuccess: () => void
}

// The cart item type — one entry per "Add to Invoice" / "Add to Session" click
type SessionItemType = 'chart_condition' | 'treatment' | 'prescription' | 'manual' | 'retail_product' | 'consumable'

interface SessionItem {
  id: string
  type: SessionItemType
  label: string
  billable: boolean
  // billing fields (for billable items)
  service_id?: number | ''
  unit_price?: number
  tooth_number?: string
  notes?: string
  // product reference
  productId?: number
  quantity?: number
  // inventory tracking
  inventoryItemId?: number
  // raw payload preserved for bulk-save
  chartConditions?: ToothConditionData[]
  treatmentData?: StagedTreatmentData
  prescriptionData?: StagedPrescriptionData
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}



export default function DentistChartBillingModal({
  appointment,
  onClose,
  clinicId,
  dentistUserId,
  dentistId,
  dentistName,
  branchName,
  services,
  inventoryItems,
  onSuccess,
}: DentistChartBillingModalProps) {
  const [patientRecord, setPatientRecord] = useState<FullPatientRecord | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingRecord, setIsLoadingRecord] = useState(true)
  const [activeTab, setActiveTab] = useState<RecordTab>('chart')

  // Cart state
  const [currentSessionItems, setCurrentSessionItems] = useState<SessionItem[]>([])
  const [periodontalFindings, setPeriodontalFindings] = useState<PeriodontalFindingsInput | null>(null)

  // Inventory picker state
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [showConsumablePicker, setShowConsumablePicker] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Load patient clinical record
  useEffect(() => {
    if (appointment?.patients?.id) {
      setIsLoadingRecord(true)
      fetchPatientRecord(appointment.patients.id, clinicId).then(res => {
        if (res.success && res.record) {
          setPatientRecord(res.record as FullPatientRecord)
        }
        setIsLoadingRecord(false)
      })
    }
  }, [appointment, clinicId])

  useEffect(() => {
    fetchProducts(clinicId).then(res => {
      if (res.success && res.products) {
        setProducts(res.products as Product[])
      }
    })
  }, [clinicId])

  const {
    localRecord,
    lastVisitDate,
    medHistory,
    handleRefreshRecord,
  } = usePatientRecord(patientRecord, clinicId, dentistId)

  // --- Cart handlers ---

  const handleChartConditionsAdd = (conditions: ToothConditionData[]) => {
    if (conditions.length === 0) return
    const newItems: SessionItem[] = conditions.map(c => {
      const billable = c.condition !== 'healthy'
      const label = c.condition.charAt(0).toUpperCase() + c.condition.slice(1).replace('_', ' ')
      return {
        id: generateId(),
        type: 'chart_condition',
        label,
        billable,
        service_id: billable ? (appointment?.services?.id ?? '') : '',
        unit_price: 0,
        tooth_number: String(c.tooth_number),
        notes: c.notes ?? '',
        chartConditions: [c],
      }
    })
    setCurrentSessionItems(prev => [...prev, ...newItems])
  }

  const handleFindingsStage = (data: PeriodontalFindingsInput) => {
    const hasAny = data.gingivitis.length || data.periodontal_condition.length || data.occlusion.length || data.appliances.length
    setPeriodontalFindings(hasAny ? data : null)
  }

  const handleTreatmentAdd = (data: StagedTreatmentData) => {
    const serviceObj = data.services ?? services.find(s => s.id === data.service_id)
    const label = serviceObj?.name ?? data.treatment
    // data.notes is JSON.stringify({clinical_notes, prescription_notes}) — extract plain text
    const rawNotes = data.notes ?? ''
    let clinicalNotes = rawNotes
    try {
      if (rawNotes.startsWith('{')) {
        const parsed = JSON.parse(rawNotes) as { clinical_notes?: string }
        clinicalNotes = parsed.clinical_notes ?? ''
      }
    } catch {}
    const requiresTooth = serviceRequiresToothNumber(label)
    const finalToothNumber = requiresTooth && data.tooth_number ? String(data.tooth_number) : ''
    setCurrentSessionItems(prev => [
      ...prev,
      {
        id: generateId(),
        type: 'treatment',
        label,
        billable: true,
        service_id: data.service_id ?? '',
        unit_price: services.find(s => s.id === data.service_id)?.price ?? 0,
        tooth_number: finalToothNumber,
        notes: clinicalNotes,
        treatmentData: {
          ...data,
          tooth_number: requiresTooth ? data.tooth_number : null,
        },
      },
    ])
  }

  const addRetailProduct = (item: Product) => {
    setCurrentSessionItems(prev => [
      ...prev,
      {
        id: generateId(),
        type: 'retail_product',
        label: item.name,
        billable: true,
        service_id: '',
        unit_price: item.price,
        productId: item.id,
        notes: '',
        quantity: 1,
      },
    ])
    setShowProductPicker(false)
  }

  const addConsumable = (item: InventoryItem) => {
    setCurrentSessionItems(prev => [
      ...prev,
      {
        id: generateId(),
        type: 'consumable',
        label: item.name,
        billable: false,
        unit_price: 0,
        inventoryItemId: item.id,
        notes: '',
        quantity: 1,
      },
    ])
    setShowConsumablePicker(false)
  }

  const handlePrescriptionAdd = (data: StagedPrescriptionData) => {
    setCurrentSessionItems(prev => [
      ...prev,
      {
        id: generateId(),
        type: 'prescription',
        label: `${data.medication} — ${data.dosage}`,
        billable: false,
        prescriptionData: data,
      },
    ])
  }

  const removeItem = (id: string) => {
    setCurrentSessionItems(prev => prev.filter(item => item.id !== id))
  }

  const updateItem = (id: string, patch: Partial<SessionItem>) => {
    setCurrentSessionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const handleServiceChange = (id: string, rawServiceId: string) => {
    if (!rawServiceId) {
      updateItem(id, { service_id: '', label: '', unit_price: 0 })
      return
    }
    const svcId = Number(rawServiceId)
    const service = services.find(s => s.id === svcId)
    updateItem(id, {
      service_id: svcId,
      label: service?.name ?? '',
      unit_price: service?.price ?? service?.price_min ?? 0,
    })
  }



  const billableItems = currentSessionItems.filter(item => item.billable)
  const sessionRecords = currentSessionItems.filter(item => !item.billable)
  const subtotal = billableItems.reduce((sum, item) => sum + (Number(item.unit_price) || 0) * (item.quantity ?? 1), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !appointment.patients) return

    const hasValidBillable = billableItems.some(item => (item.type === 'retail_product' && item.productId) || (item.service_id !== ''))
    if (!hasValidBillable && billableItems.length > 0) {
      setErrorMsg('Add at least one billable item with a selected service or product to queue an invoice.')
      return
    }
    if (billableItems.some(item => Number(item.unit_price) < 0)) {
      setErrorMsg('Fees cannot be negative.')
      return
    }

    setErrorMsg(null)
    setShowConfirmModal(true)
  }

  const handleFinalSubmit = async () => {
    if (!appointment || !appointment.patients) return

    const validBillable = billableItems.filter(item => (item.type === 'retail_product' && item.productId) || (item.service_id !== ''))
    if (validBillable.length === 0 && billableItems.length > 0) return

    setIsSubmitting(true)
    setErrorMsg(null)
    setShowConfirmModal(false)

    const sessionTimestamp = new Date().toISOString()

    // 1. Save dental chart conditions (bulk)
    const allChartConditions = currentSessionItems
      .filter(item => item.type === 'chart_condition' && item.chartConditions)
      .flatMap(item => item.chartConditions!)
    let savedChartId: number | null = null
    if (allChartConditions.length > 0) {
      const chartResult = await updateDentalChart(
        appointment.patients.id,
        clinicId,
        dentistId,
        allChartConditions
      )
      if (!chartResult.success) {
        setErrorMsg(chartResult.error || 'Failed to save dental chart conditions')
        setIsSubmitting(false)
        return
      }
      savedChartId = chartResult.chartId ?? null
    }

    // 1.5 Save periodontal findings (single record for this session)
    if (periodontalFindings) {
      const findingsResult = await addPeriodontalFindings({
        patient_id: appointment.patients.id,
        clinic_id: clinicId,
        dentist_id: dentistId,
        appointment_id: appointment.id,
        dental_chart_id: savedChartId,
        ...periodontalFindings,
      })
      if (!findingsResult.success) {
        console.error('Failed to save periodontal findings:', findingsResult.error)
      }
    }

    // 2. Save treatments (bulk)
    const serviceItems = currentSessionItems.filter(item => {
      if (item.type === 'treatment') return true
      if (item.billable && item.type !== 'retail_product' && item.type !== 'consumable' && item.type !== 'prescription' && item.service_id !== '' && item.service_id !== undefined) return true
      return false
    })

    const uniqueServiceItems = Array.from(new Map(serviceItems.map(item => [item.id, item])).values())

    const treatmentRows = uniqueServiceItems.map(item => {
      let serializedNotes = null
      if (item.type === 'treatment' && item.treatmentData?.notes) {
        serializedNotes = item.treatmentData.notes
      } else {
        serializedNotes = JSON.stringify({
          clinical_notes: item.notes || '—',
          prescription_notes: '—',
        })
      }

      let toothNum: number | null = null
      if (serviceRequiresToothNumber(item.label) && item.tooth_number) {
        toothNum = Number(item.tooth_number.split(',')[0].trim()) || null
      }

      return {
        patient_id: appointment.patients!.id,
        clinic_id: clinicId,
        dentist_id: dentistId,
        appointment_id: appointment.id,
        service_id: item.service_id ? Number(item.service_id) : null,
        tooth_number: toothNum,
        treatment: item.label,
        notes: serializedNotes,
        performed_at: sessionTimestamp,
      }
    })

    if (treatmentRows.length > 0) {
      const treatResult = await addTreatmentRecords(treatmentRows)
      if (!treatResult.success) {
        console.error('Failed to save treatment records:', treatResult.error)
      }
    }

    // 3. Save prescriptions (bulk)
    const prescriptionRows = currentSessionItems
      .filter(item => item.type === 'prescription' && item.prescriptionData)
      .map(item => ({
        patient_id: appointment.patients!.id,
        clinic_id: clinicId,
        dentist_id: dentistId,
        appointment_id: appointment.id,
        medication: item.prescriptionData!.medication,
        dosage: item.prescriptionData!.dosage,
        frequency: item.prescriptionData!.frequency,
        duration: item.prescriptionData!.duration ?? null,
        notes: item.prescriptionData!.notes ?? null,
      }))
    if (prescriptionRows.length > 0) {
      const rxResult = await addPrescriptions(prescriptionRows)
      if (!rxResult.success) {
        console.error('Failed to save prescriptions:', rxResult.error)
      }
    }

    // 4. Mark appointment as completed
    const completionResult = await updateAppointmentStatus(
      appointment.id,
      'completed',
      dentistUserId,
      'dentist',
      'Completed and sent to billing'
    )
    if (!completionResult.success) {
      setErrorMsg(completionResult.error || 'Failed to mark appointment as completed')
      setIsSubmitting(false)
      return
    }

    // 5. Deduct inventory stock for consumables
    const inventoryItemsToDeduct = currentSessionItems.filter(
      item => item.type === 'consumable' && item.inventoryItemId
    )
    for (const item of inventoryItemsToDeduct) {
      const qty = item.quantity ?? 1
      const stockResult = await updateInventoryStock(
        item.inventoryItemId!,
        -qty,
        dentistUserId,
        `Used in session — ${item.label}`
      )
      if (!stockResult.success) {
        console.error('Failed to deduct inventory stock for item:', item.label, stockResult.error)
      }
    }

    // 6. Create draft invoice (billable items only)
    const draftResult = await createDraftInvoice({
      appointment_id: appointment.id,
      patient_id: appointment.patients.id,
      clinic_id: clinicId,
      dentist_id: dentistId,
      items: validBillable.map(item => ({
        service_id: item.type !== 'retail_product' ? (Number(item.service_id) || undefined) : undefined,
        product_id: item.type === 'retail_product' ? item.productId : undefined,
        description: item.label,
        quantity: item.quantity ?? 1,
        unit_price: Number(item.unit_price) || 0,
        tooth_number: item.type !== 'retail_product' && serviceRequiresToothNumber(item.label) && item.tooth_number
          ? Number(item.tooth_number.split(',')[0].trim()) || null
          : null,
        treatment_notes: item.notes || null,
      })),
    })

    setIsSubmitting(false)
    if (draftResult.success) {
      setCurrentSessionItems([])
      setPeriodontalFindings(null)
      onSuccess()
    } else {
      setErrorMsg(draftResult.error || 'Failed to create draft invoice')
    }
  }

  if (!mounted || !appointment) return null

  const patient = appointment.patients

  const tabs: Array<{ id: RecordTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'chart', label: 'Dental Chart', icon: Activity },
    { id: 'treatments', label: 'Treatment', icon: ClipboardList },
    { id: 'info', label: 'Medical History', icon: User },
    { id: 'periodontal', label: 'Periodontal', icon: HeartPulse },
  ]

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Main Modal Header */}
        <div className="px-5 py-2.5 border-b border-gray-150 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Current Session &amp; Billing Workspace
              </h3>
              <p className="text-[11px] text-gray-500">
                Patient: <span className="font-semibold text-slate-700">{patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Split Screen Container */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Panel: EHR Workspace (55% width) */}
          <div className="w-[55%] border-r border-gray-150 flex flex-col bg-slate-50/30 overflow-hidden">
            {/* EHR Tab bar */}
            <div className="flex border-b border-gray-100 bg-white px-4 shrink-0">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 flex-1 py-3 text-[11px] font-bold transition-all border-b-2 outline-none ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* EHR Tab contents */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingRecord ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 gap-2">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="text-sm font-semibold">Loading Clinical Records...</span>
                </div>
              ) : localRecord ? (
                <>
                  <div className={activeTab !== 'chart' ? 'hidden' : ''}>
                    <DentalChartTab
                      patientId={localRecord.patient.id}
                      clinicId={clinicId}
                      dentalCharts={localRecord.dentalCharts}
                      dentistId={dentistId}
                      onRefresh={handleRefreshRecord}
                      readOnly={false}
                      onChartSave={handleChartConditionsAdd}
                      periodontalFindings={[]}
                      onFindingsSave={handleFindingsStage}
                    />
                  </div>
                  <div className={activeTab !== 'treatments' ? 'hidden' : 'space-y-8'}>
                    <TreatmentTab
                      patientId={localRecord.patient.id}
                      clinicId={clinicId}
                      dentistId={dentistId}
                      treatments={localRecord.treatmentHistory || []}
                      onRefresh={handleRefreshRecord}
                      onAddTreatment={handleTreatmentAdd}
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescriptions</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>
                      <PrescriptionsTab
                        patientId={localRecord.patient.id}
                        clinicId={clinicId}
                        dentistId={dentistId}
                        prescriptions={localRecord.prescriptions || []}
                        onRefresh={handleRefreshRecord}
                        patient={{
                          first_name: localRecord.patient.first_name,
                          last_name: localRecord.patient.last_name,
                          birthdate: localRecord.patient.birthdate,
                          gender: localRecord.patient.gender,
                        }}
                        onAddPrescription={handlePrescriptionAdd}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Follow-ups</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>
                      <FollowupsTab
                        patientId={localRecord.patient.id}
                        clinicId={clinicId}
                        dentistId={dentistId}
                        appointments={localRecord.appointments || []}
                        onRefresh={handleRefreshRecord}
                        onAddFollowup={() => {}}
                      />
                      <p className="text-[10px] text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-3">
                        Follow-up dates are reflected in the dentist, clinic staff, and patient calendar views.
                      </p>
                    </div>
                  </div>
                  <div className={activeTab !== 'info' ? 'hidden' : ''}>
                    <MedicalHistoryTab
                      localRecord={localRecord}
                      viewerRole="dentist"
                      lastVisitDate={lastVisitDate}
                      medHistory={medHistory}
                    />
                  </div>
                  <div className={activeTab !== 'periodontal' ? 'hidden' : ''}>
                    <PeriodontalTab
                      patientId={localRecord.patient.id}
                      clinicId={clinicId}
                      dentistId={dentistId}
                      screenings={localRecord.periodontalScreenings || []}
                      tmjAssessments={localRecord.tmjAssessments || []}
                      onRefresh={handleRefreshRecord}
                      onAddPeriodontal={() => {}}
                    />
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-400">Failed to load patient clinical records.</div>
              )}
            </div>
          </div>

          {/* Right Panel: Invoice Preview (45% width) */}
          <div className="w-[45%] flex flex-col bg-white overflow-hidden">
            <div className="px-5 py-2.5 border-b border-gray-100 bg-slate-50/50 shrink-0">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Invoice Preview
                {currentSessionItems.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    {currentSessionItems.length}
                  </span>
                )}
              </h4>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {/* Meta details */}
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-gray-150 shrink-0">
                  <span className="bg-white border px-2 py-0.5 rounded-md">Dentist: <span className="text-slate-800 font-bold">{dentistName}</span></span>
                  <span className="bg-white border px-2 py-0.5 rounded-md">Branch: <span className="text-slate-800 font-bold">{branchName}</span></span>
                  <span className="bg-white border px-2 py-0.5 rounded-md">Date: <span className="text-slate-800 font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></span>
                </div>

                {/* Empty state */}
                {currentSessionItems.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">Invoice is empty.</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">
                      Use the tabs on the left to chart conditions, log treatments, or write prescriptions.
                    </p>
                  </div>
                )}

                {/* Billable Items */}
                {billableItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billable Items</p>
                    {billableItems.map(item => {
                      if (item.type === 'retail_product') {
                        const qty = item.quantity ?? 1
                        const itemSubtotal = (item.unit_price ?? 0) * qty
                        return (
                          <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2 relative">
                            <div className="flex items-start gap-2.5">
                              <div className="flex-1 space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Retail Product</label>
                                <div className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-slate-800 font-semibold truncate">
                                  {item.label}
                                </div>
                              </div>
                              <div className="w-16 space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Qty</label>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white outline-none text-center font-semibold focus:ring-1 focus:ring-blue-500"
                                  value={qty}
                                  onChange={e => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1)
                                    updateItem(item.id, { quantity: val })
                                  }}
                                />
                              </div>
                              <div className="w-24 space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price (₱)</label>
                                <input
                                  type="number"
                                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white outline-none text-right font-semibold focus:ring-1 focus:ring-blue-500"
                                  value={item.unit_price ?? 0}
                                  onChange={e => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="w-24 space-y-0.5 text-right">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subtotal (₱)</label>
                                <div className="px-2 py-1 text-xs font-bold text-slate-900 leading-normal">
                                  ₱{itemSubtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="mt-4 p-1.5 text-gray-400 hover:text-red-600 transition"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      }

                      const selectedService = item.service_id !== '' && item.service_id !== undefined
                        ? services.find(s => s.id === item.service_id)
                        : undefined
                      const hasRange = selectedService?.allows_installment && selectedService.price_min != null && selectedService.price_max != null

                      return (
                        <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2 relative">
                          <div className="flex items-start gap-2.5">
                            <div className="flex-1 space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service / Procedure</label>
                              <select
                                className="w-full px-2.5 py-1 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                value={item.service_id ?? ''}
                                onChange={e => handleServiceChange(item.id, e.target.value)}
                              >
                                <option value="">Select a service…</option>
                                {services.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            {item.tooth_number && (
                              <div className="w-14 space-y-0.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tooth</label>
                                <div className="w-full text-center px-2 py-1 border bg-blue-50 border-blue-200 text-blue-700 font-bold rounded-lg text-xs">
                                  #{item.tooth_number.split(',')[0].trim()}
                                </div>
                              </div>
                            )}
                            <div className="w-24 space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fee (₱)</label>
                              <input
                                type="number"
                                min={hasRange ? selectedService!.price_min! : 0}
                                max={hasRange ? selectedService!.price_max! : undefined}
                                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white outline-none text-right font-semibold focus:ring-1 focus:ring-blue-500"
                                value={item.unit_price ?? 0}
                                onChange={e => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                              />
                              {hasRange && (
                                <p className="text-[9px] text-slate-400 text-right leading-none mt-0.5">
                                  ₱{selectedService!.price_min!.toLocaleString()}–₱{selectedService!.price_max!.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="mt-4 p-1.5 text-gray-400 hover:text-red-600 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Non-billable session records */}
                {sessionRecords.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Session Records (Non-billable)</p>
                    {sessionRecords.map(item => {
                      if (item.type === 'consumable') {
                        const invItem = inventoryItems.find(i => i.id === item.inventoryItemId)
                        const maxStock = invItem?.quantity ?? 0
                        const qty = item.quantity ?? 1
                        return (
                          <div key={item.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-gray-150">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase shrink-0">
                                Supply
                              </span>
                              <span className="text-xs text-slate-700 font-semibold truncate flex-1">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">Qty:</span>
                              <input
                                type="number"
                                min={1}
                                max={maxStock}
                                className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-xs bg-white text-center font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                                value={qty}
                                onChange={e => {
                                  const val = Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1))
                                  updateItem(item.id, { quantity: val })
                                }}
                              />
                              <span className="text-[10px] text-gray-400">/ {maxStock}</span>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition shrink-0 ml-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={item.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-gray-150">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase shrink-0">
                              {item.type === 'prescription' ? 'Rx' : 'Chart'}
                            </span>
                            <span className="text-xs text-slate-700 font-semibold truncate">{item.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition shrink-0 ml-2"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add Retail Product */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowProductPicker(v => !v); setShowConsumablePicker(false) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition border border-dashed border-emerald-300"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    + Add Retail Product
                  </button>
                  {showProductPicker && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 space-y-1 max-h-40 overflow-y-auto">
                      {products.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No retail products available.</p>
                      ) : (
                        products.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => addRetailProduct(item)}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-emerald-50 text-slate-700 font-medium flex justify-between items-center"
                          >
                            <span>{item.name}</span>
                            <span className="text-gray-400 text-[10px]">₱{item.price.toLocaleString()}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Add Consumables */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowConsumablePicker(v => !v); setShowProductPicker(false) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition border border-dashed border-blue-200"
                  >
                    <Package className="w-3.5 h-3.5" />
                    + Add Consumables
                  </button>
                  {showConsumablePicker && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 space-y-1 max-h-40 overflow-y-auto">
                      {inventoryItems.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No inventory items available.</p>
                      ) : (
                        inventoryItems.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => addConsumable(item)}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-blue-50 text-slate-700 font-medium flex justify-between items-center"
                          >
                            <span>{item.name}</span>
                            <span className="text-gray-400 text-[10px]">{item.quantity} {item.unit} in stock</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="p-4 border-t border-gray-150 bg-slate-50/50 space-y-3 shrink-0">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Subtotal</span>
                    <span className="text-sm text-slate-950">₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {appointment.downpayment > 0 && (
                    <>
                      <p className="flex justify-between text-xs text-slate-400 font-semibold">
                        <span>Downpayment on file:</span>
                        <span>-₱{appointment.downpayment.toLocaleString()}</span>
                      </p>
                      <p className="text-[9px] text-gray-400 italic">Deducted automatically by staff at checkout.</p>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-normal">
                  Invoice will be sent to the Clinic Assistant dashboard in <strong>Draft</strong> status for payment collection and discount applications.
                </p>

                {errorMsg && (
                  <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">{errorMsg}</p>
                )}

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Complete Session & Queue Invoice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Confirm Session &amp; Queue Invoice</h4>
                    <p className="text-[11px] text-gray-500">Review before finalizing. All writes happen at once.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs text-slate-600">
                  Completing this session will save all clinical records, generate a draft invoice, and mark the appointment as completed.
                </p>

                {/* Billable summary */}
                <div className="space-y-1.5">
                  {(() => {
                    const visibleInvoiceItems = billableItems.filter(i => i.service_id !== '' || (i.type === 'retail_product' && i.productId))
                    return (
                      <>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Invoice Line Items ({visibleInvoiceItems.length})
                        </label>
                        <div className="bg-slate-50 p-3 rounded-xl border border-gray-200/60 divide-y divide-gray-150 space-y-2 text-xs max-h-[180px] overflow-y-auto">
                          {visibleInvoiceItems.map(item => {
                            const qty = item.quantity ?? 1
                            const isProduct = item.type === 'retail_product'
                            const lineTotal = (item.unit_price ?? 0) * (isProduct ? qty : 1)
                            return (
                              <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800">
                                    {item.label}
                                    {isProduct && qty > 1 && <span className="text-gray-500 font-normal"> (x{qty})</span>}
                                  </p>
                                  {item.tooth_number && <p className="text-[10px] font-semibold text-blue-600">Tooth #{item.tooth_number.split(',')[0].trim()}</p>}
                                </div>
                                <p className="font-bold text-slate-900 shrink-0">₱{lineTotal.toLocaleString()}</p>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Session records summary */}
                {sessionRecords.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clinical Records to Save ({sessionRecords.length})</label>
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-200/60 max-h-[120px] overflow-y-auto space-y-1 text-xs">
                      {sessionRecords.map(item => (
                        <div key={item.id} className="flex items-center gap-2 py-0.5 border-b border-gray-100 last:border-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase shrink-0">
                            {item.type === 'prescription' ? 'Rx' : 'Chart'}
                          </span>
                          <span className="text-slate-700 font-medium truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span>₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {appointment.downpayment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Downpayment on file</span>
                      <span>-₱{appointment.downpayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-sm">
                    <span>Estimated Due</span>
                    <span className="text-emerald-400">
                      ₱{(Math.max(0, subtotal - (appointment.downpayment || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-150 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    'Confirm & Complete Session'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  )
}
