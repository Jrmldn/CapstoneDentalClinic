'use server'

import { sanitizeServerError } from '@/lib/errors/sanitizeError'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ServiceData {
  clinic_id: number
  name: string
  price: number
  slot_duration_min: number
  is_active?: boolean
}

// ==========================================
// SERVICES
// ==========================================

export async function addService(data: ServiceData) {
  try {
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert([{
        ...data,
        is_active: data.is_active ?? true
      }])
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/services')
    return { success: true, service: service?.[0] }
  } catch (error) {
    console.error('Error in addService:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function updateService(serviceId: number, data: Partial<ServiceData>) {
  try {
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update(data)
      .eq('id', serviceId)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/services')
    return { success: true, service: service?.[0] }
  } catch (error) {
    console.error('Error in updateService:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function deleteService(serviceId: number) {
  try {
    // Soft delete recommended to preserve transaction history, but using hard delete for now if requested
    // Better practice: update({ is_active: false })
    const { error } = await supabaseAdmin
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/services')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteService:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function fetchServices(clinicId: number) {
  try {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, services: services || [] }
  } catch (error) {
    console.error('Error in fetchServices:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      services: []
    }
  }
}

// ==========================================
// PRODUCTS
// ==========================================

export interface ProductData {
  clinic_id: number
  name: string
  price: number
  is_active?: boolean
}

export async function addProduct(data: ProductData) {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([{
        ...data,
        is_active: data.is_active ?? true
      }])
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/products')
    return { success: true, product: product?.[0] }
  } catch (error) {
    console.error('Error in addProduct:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function updateProduct(productId: number, data: Partial<ProductData>) {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(data)
      .eq('id', productId)
      .select()

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/products')
    return { success: true, product: product?.[0] }
  } catch (error) {
    console.error('Error in updateProduct:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function deleteProduct(productId: number) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)

    if (error) throw new Error(error.message)

    revalidatePath('/staff-dashboard/products')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
    }
  }
}

export async function fetchProducts(clinicId: number) {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return { success: true, products: products || [] }
  } catch (error) {
    console.error('Error in fetchProducts:', error)
    return {
      success: false,
      error: sanitizeServerError(error),
      products: []
    }
  }
}

