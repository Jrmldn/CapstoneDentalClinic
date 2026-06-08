import React from 'react'
import { Activity, ClipboardList, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PatientRecord } from './types'
import { formatDate } from './utils'

interface MedicalTabProps {
  record: PatientRecord
}

export function MedicalTab({ record }: MedicalTabProps) {
  return (
    <div className="space-y-6">
      {/* Dental Conditions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recorded Tooth Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {record.dentalCharts.length > 0 && record.dentalCharts[0].tooth_conditions?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {record.dentalCharts[0].tooth_conditions.map((tc: any) => (
                <div key={tc.id} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-800">Tooth #{tc.tooth_number} ({tc.tooth_type})</span>
                    {tc.surface && <p className="text-xs text-slate-500">Surface: {tc.surface}</p>}
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold uppercase text-[10px]">
                    {tc.condition}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No recorded dental chart conditions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Treatment History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Performed Treatments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.treatmentHistory.length > 0 ? (
            record.treatmentHistory.map((tr: any) => (
              <div key={tr.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-950">{tr.services?.name}</h5>
                    <p className="text-xs text-slate-500 mt-1">Performed by: Dr. {tr.dentists?.first_name} {tr.dentists?.last_name}</p>
                  </div>
                  <span className="text-sm font-extrabold text-blue-600">PHP {tr.services?.price}</span>
                </div>
                {tr.notes && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{tr.notes}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No treatments performed yet</p>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Active Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.prescriptions.length > 0 ? (
            record.prescriptions.map((pr: any) => (
              <div key={pr.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-950">{pr.medication_name || 'Prescription'}</h5>
                    <p className="text-xs text-slate-500 mt-1">Dr. {pr.dentists?.first_name} {pr.dentists?.last_name}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(pr.prescribed_at)}</span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p><span className="font-semibold text-slate-500">Dosage: </span>{pr.dosage || 'As indicated'}</p>
                  {pr.instructions && <p><span className="font-semibold text-slate-500">Instructions: </span>{pr.instructions}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No active prescriptions</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
