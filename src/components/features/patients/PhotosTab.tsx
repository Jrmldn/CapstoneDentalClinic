'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Camera, Upload, Trash, Eye, FileImage, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/date'
import imageCompression from 'browser-image-compression'

interface PhotosTabProps {
  patientId: number | string
  viewerRole: string
}

interface MedicalPhoto {
  name: string
  displayName: string
  url: string
  createdAt: string
  size: number
  uploadedBy: string
  branchName: string
}

export default function PhotosTab({ patientId, viewerRole }: PhotosTabProps) {
  const [photos, setPhotos] = useState<MedicalPhoto[]>([])
  const [isListing, setIsListing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<MedicalPhoto | null>(null)
  const [uploaderInfo, setUploaderInfo] = useState<{ name: string; branch: string } | null>(null)

  useEffect(() => {
    async function fetchUploaderInfo() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile) return

        let name = 'Unknown'
        let branch = 'Unknown Branch'

        if (profile.role === 'dentist') {
          const { data: dentist } = await supabase
            .from('dentists')
            .select('first_name, last_name, clinics ( name )')
            .eq('user_id', user.id)
            .single()
          if (dentist) {
            name = `Dr. ${dentist.first_name} ${dentist.last_name}`
            branch = (dentist.clinics as any)?.name || 'Unknown Branch'
          }
        } else if (profile.role === 'staff') {
          const { data: staff } = await supabase
            .from('clinic_staff')
            .select('first_name, last_name, clinics ( name )')
            .eq('user_id', user.id)
            .single()
          if (staff) {
            name = `${staff.first_name} ${staff.last_name}`
            branch = (staff.clinics as any)?.name || 'Unknown Branch'
          }
        } else if (profile.role === 'superadmin') {
          name = 'Superadmin'
          branch = 'Central Business'
        }

        setUploaderInfo({ name, branch })
      } catch (err) {
        console.error('Error fetching uploader info:', err)
      }
    }

    fetchUploaderInfo()
  }, [])

  const patientIdStr = patientId.toString()

  const loadPhotos = useCallback(async () => {
    setIsListing(true)
    setError(null)
    try {
      // 1. List all files in the patient's subfolder
      const { data: files, error: listError } = await supabase.storage
        .from('medical_photos')
        .list(patientIdStr, {
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) {
        throw listError
      }

      if (!files || files.length === 0) {
        setPhotos([])
        return
      }

      // 2. Generate signed URLs for all files
      const filePaths = files.map(file => `${patientIdStr}/${file.name}`)
      const { data: signedUrls, error: urlError } = await supabase.storage
        .from('medical_photos')
        .createSignedUrls(filePaths, 3600) // 1 hour expiration

      if (urlError) {
        throw urlError
      }

      // 3. Map to our state structure
      const mappedPhotos: MedicalPhoto[] = files.map((file, index) => {
        const signedUrlObj = signedUrls?.find(url => url.path === `${patientIdStr}/${file.name}`)
        
        // Parse metadata from filename
        // Filename format: timestamp_uploader_branch_originalName_uniqueId.ext
        const parts = file.name.split('_')
        let uploader = 'Unknown'
        let branch = 'Unknown Branch'
        let fileTimestamp = file.created_at || new Date().toISOString()
        let displayName = file.name

        if (parts.length >= 5) {
          const tsPart = parseInt(parts[0], 10)
          if (!isNaN(tsPart)) {
            fileTimestamp = new Date(tsPart).toISOString()
          }
          uploader = parts[1].replace(/-/g, ' ')
          branch = parts[2].replace(/-/g, ' ')
          displayName = `${parts.slice(3, -1).join('_')}.${parts[parts.length - 1].split('.').pop()}`
        } else if (parts.length >= 2) {
          const tsPart = parseInt(parts[0], 10)
          if (!isNaN(tsPart)) {
            fileTimestamp = new Date(tsPart).toISOString()
          }
          displayName = parts.slice(1).join('_')
        }

        return {
          name: file.name,
          displayName,
          url: signedUrlObj?.signedUrl || '',
          createdAt: fileTimestamp,
          size: file.metadata?.size || 0,
          uploadedBy: uploader,
          branchName: branch
        }
      })

      setPhotos(mappedPhotos.filter(p => p.url !== ''))
    } catch (err: any) {
      console.error('Error loading medical photos:', err)
      setError('Failed to load medical photos from private storage.')
    } finally {
      setIsListing(false)
    }
  }, [patientIdStr])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit files to common image types
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG).')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)
    setUploadProgress('Compressing image...')

    try {
      // Compress the image on the client side (max size 1MB)
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(file, options)
      
      setUploadProgress('Uploading to secure storage...')

      // Generate a unique filename with uploader and branch stamps
      const fileExt = file.name.split('.').pop() || 'jpg'
      const uniqueId = Math.random().toString(36).substring(2, 9)
      const timestamp = Date.now()
      const cleanOriginalName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-')
      
      const safeUploader = (uploaderInfo?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '-')
      const safeBranch = (uploaderInfo?.branch || 'Unknown').replace(/[^a-zA-Z0-9]/g, '-')
      
      // Stamp format: timestamp_uploader_branch_originalName_uniqueId.ext
      const fileName = `${timestamp}_${safeUploader}_${safeBranch}_${cleanOriginalName}_${uniqueId}.${fileExt}`
      const filePath = `${patientIdStr}/${fileName}`

      // Upload file to the private medical_photos bucket
      const { error: uploadError } = await supabase.storage
        .from('medical_photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      setSuccess('Photo uploaded successfully.')
      loadPhotos()
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to compress or upload photo.')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
      // Reset input element value
      e.target.value = ''
    }
  }

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to permanently delete this medical photo?')) {
      return
    }

    setError(null)
    setSuccess(null)
    
    try {
      const filePath = `${patientIdStr}/${fileName}`
      const { error: deleteError } = await supabase.storage
        .from('medical_photos')
        .remove([filePath])

      if (deleteError) {
        throw deleteError
      }

      setSuccess('Photo deleted successfully.')
      if (previewPhoto?.name === fileName) {
        setPreviewPhoto(null)
      }
      loadPhotos()
    } catch (err: any) {
      console.error('Delete error:', err)
      setError('Failed to delete photo from storage.')
    }
  }

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  // Restrict access if role is not dentist or superadmin
  const canUpload = viewerRole === 'dentist' || viewerRole === 'superadmin'

  return (
    <div className="space-y-6">
      {/* Upload card - Only visible for dentists and superadmins */}
      {canUpload && (
        <Card className="border-dashed border-2 border-slate-200 shadow-none hover:border-blue-400 transition-colors">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Upload Medical Photo</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                Upload patient diagnostic images, X-rays, or clinical photos. Max file size: 1MB (automatically compressed).
              </p>
              
              <label className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                <span className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition select-none">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {uploadProgress || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Select Photo
                    </>
                  )}
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileImage className="w-5 h-5 text-blue-600" />
            Medical Photos Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isListing ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Retrieving private photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.name} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all">
                  <div className="aspect-square relative bg-slate-100 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt="Medical Diagnostic"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewPhoto(photo)}
                        className="p-2 bg-white text-slate-800 rounded-full hover:bg-slate-100 transition shadow-sm"
                        title="View Fullscreen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canUpload && (
                        <button
                          onClick={() => handleDelete(photo.name)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-sm"
                          title="Delete Photo"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] font-semibold text-slate-700 truncate" title={photo.displayName}>
                      {photo.displayName}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {formatDateTime(photo.createdAt)} · {formatBytes(photo.size)}
                    </p>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[8px] text-slate-500 font-medium space-y-0.5">
                      <p><span className="font-semibold text-slate-600">Uploaded by:</span> {photo.uploadedBy}</p>
                      <p><span className="font-semibold text-slate-600">Branch:</span> {photo.branchName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileImage className="w-10 h-10 mx-auto opacity-35 mb-2.5 text-blue-600" />
              <p className="text-xs font-medium">No medical photos uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox / Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto.url}
              alt="Medical Diagnostic Fullscreen"
              className="object-contain max-h-[75vh] rounded-lg shadow-xl"
            />
            <div className="text-center mt-3 text-white">
              <p className="text-xs font-bold">{previewPhoto.displayName}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">
                {formatDateTime(previewPhoto.createdAt)} · Uploaded by: {previewPhoto.uploadedBy} ({previewPhoto.branchName})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
