export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_logs: {
        Row: {
          action: Database["public"]["Enums"]["log_action"]
          appointment_id: number
          created_at: string | null
          id: number
          new_status: Database["public"]["Enums"]["appointment_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["appointment_status"] | null
          performed_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          action: Database["public"]["Enums"]["log_action"]
          appointment_id: number
          created_at?: string | null
          id?: number
          new_status?: Database["public"]["Enums"]["appointment_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
          performed_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          action?: Database["public"]["Enums"]["log_action"]
          appointment_id?: number
          created_at?: string | null
          id?: number
          new_status?: Database["public"]["Enums"]["appointment_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
          performed_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          booked_at: string | null
          clinic_id: number
          created_at: string | null
          dentist_id: number
          downpayment: number | null
          end_at: string
          id: number
          is_walk_in: boolean | null
          notes: string | null
          patient_id: number
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          reschedule_count: number | null
          scheduled_at: string
          service_id: number | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string | null
        }
        Insert: {
          appointment_type?: string | null
          booked_at?: string | null
          clinic_id: number
          created_at?: string | null
          dentist_id: number
          downpayment?: number | null
          end_at: string
          id?: number
          is_walk_in?: boolean | null
          notes?: string | null
          patient_id: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          reschedule_count?: number | null
          scheduled_at: string
          service_id?: number | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string | null
          booked_at?: string | null
          clinic_id?: number
          created_at?: string | null
          dentist_id?: number
          downpayment?: number | null
          end_at?: string
          id?: number
          is_walk_in?: boolean | null
          notes?: string | null
          patient_id?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          reschedule_count?: number | null
          scheduled_at?: string
          service_id?: number | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_gallery: {
        Row: {
          clinic_id: number
          id: number
          image_url: string
          sort_order: number | null
        }
        Insert: {
          clinic_id: number
          id?: number
          image_url: string
          sort_order?: number | null
        }
        Update: {
          clinic_id?: number
          id?: number
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_gallery_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_holidays: {
        Row: {
          clinic_id: number
          date: string
          description: string | null
          id: number
          is_special_day: boolean | null
        }
        Insert: {
          clinic_id: number
          date: string
          description?: string | null
          id?: number
          is_special_day?: boolean | null
        }
        Update: {
          clinic_id?: number
          date?: string
          description?: string | null
          id?: number
          is_special_day?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_holidays_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_operating_hours: {
        Row: {
          clinic_id: number
          close_time: string
          day_of_week: number
          id: number
          is_closed: boolean | null
          open_time: string
        }
        Insert: {
          clinic_id: number
          close_time: string
          day_of_week: number
          id?: number
          is_closed?: boolean | null
          open_time: string
        }
        Update: {
          clinic_id?: number
          close_time?: string
          day_of_week?: number
          id?: number
          is_closed?: boolean | null
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_operating_hours_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_patients: {
        Row: {
          clinic_id: number
          created_at: string | null
          enrolled_by: string | null
          id: number
          is_active: boolean
          patient_id: number
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          enrolled_by?: string | null
          id?: number
          is_active?: boolean
          patient_id: number
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          enrolled_by?: string | null
          id?: number
          is_active?: boolean
          patient_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_patients_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_staff: {
        Row: {
          clinic_id: number
          first_name: string
          id: number
          last_name: string
          user_id: string
        }
        Insert: {
          clinic_id: number
          first_name: string
          id?: number
          last_name: string
          user_id: string
        }
        Update: {
          clinic_id?: number
          first_name?: string
          id?: number
          last_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_assessments: {
        Row: {
          appointment_id: number | null
          assessed_at: string | null
          chief_complaint: string | null
          clinic_id: number
          dentist_id: number
          diagnosis: string
          id: number
          notes: string | null
          patient_id: number
          treatment_plan: string | null
        }
        Insert: {
          appointment_id?: number | null
          assessed_at?: string | null
          chief_complaint?: string | null
          clinic_id: number
          dentist_id: number
          diagnosis: string
          id?: number
          notes?: string | null
          patient_id: number
          treatment_plan?: string | null
        }
        Update: {
          appointment_id?: number | null
          assessed_at?: string | null
          chief_complaint?: string | null
          clinic_id?: number
          dentist_id?: number
          diagnosis?: string
          id?: number
          notes?: string | null
          patient_id?: number
          treatment_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_assessments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_assessments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_assessments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string
          created_at: string | null
          default_downpayment_amount: number | null
          email: string | null
          id: number
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          manual_status: string | null
          max_appointments_per_day: number | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          default_downpayment_amount?: number | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          manual_status?: string | null
          max_appointments_per_day?: number | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          default_downpayment_amount?: number | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          manual_status?: string | null
          max_appointments_per_day?: number | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dental_charts: {
        Row: {
          clinic_id: number
          created_at: string | null
          dentist_id: number
          id: number
          patient_id: number
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          dentist_id: number
          id?: number
          patient_id: number
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          dentist_id?: number
          id?: number
          patient_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_charts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_charts_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_availability: {
        Row: {
          day_of_week: number
          dentist_id: number
          end_time: string
          id: number
          start_time: string
        }
        Insert: {
          day_of_week: number
          dentist_id: number
          end_time: string
          id?: number
          start_time: string
        }
        Update: {
          day_of_week?: number
          dentist_id?: number
          end_time?: string
          id?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_availability_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_blocked_slots: {
        Row: {
          blocked_date: string
          dentist_id: number
          end_time: string | null
          id: number
          reason: string | null
          start_time: string | null
        }
        Insert: {
          blocked_date: string
          dentist_id: number
          end_time?: string | null
          id?: number
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          blocked_date?: string
          dentist_id?: number
          end_time?: string | null
          id?: number
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dentist_blocked_slots_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      dentists: {
        Row: {
          clinic_id: number
          first_name: string
          id: number
          last_name: string
          license_no: string | null
          user_id: string
        }
        Insert: {
          clinic_id: number
          first_name: string
          id?: number
          last_name: string
          license_no?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: number
          first_name?: string
          id?: number
          last_name?: string
          license_no?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentists_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          appointment_id: number
          clinic_id: number
          comment: string | null
          created_at: string | null
          id: number
          patient_id: number
          rating: number
        }
        Insert: {
          appointment_id: number
          clinic_id: number
          comment?: string | null
          created_at?: string | null
          id?: number
          patient_id: number
          rating: number
        }
        Update: {
          appointment_id?: number
          clinic_id?: number
          comment?: string | null
          created_at?: string | null
          id?: number
          patient_id?: number
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_schedules: {
        Row: {
          appointment_id: number | null
          clinic_id: number
          created_at: string | null
          dentist_id: number
          id: number
          is_completed: boolean | null
          patient_id: number
          reason: string | null
          scheduled_at: string
        }
        Insert: {
          appointment_id?: number | null
          clinic_id: number
          created_at?: string | null
          dentist_id: number
          id?: number
          is_completed?: boolean | null
          patient_id: number
          reason?: string | null
          scheduled_at: string
        }
        Update: {
          appointment_id?: number | null
          clinic_id?: number
          created_at?: string | null
          dentist_id?: number
          id?: number
          is_completed?: boolean | null
          patient_id?: number
          reason?: string | null
          scheduled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_schedules_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_schedules_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_schedules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      informed_consent: {
        Row: {
          accepted_at: string | null
          id: number
          ip_address: string | null
          patient_id: number
        }
        Insert: {
          accepted_at?: string | null
          id?: number
          ip_address?: string | null
          patient_id: number
        }
        Update: {
          accepted_at?: string | null
          id?: number
          ip_address?: string | null
          patient_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "informed_consent_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: number
          installment_number: number
          paid_at: string | null
          plan_id: number
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: number
          installment_number: number
          paid_at?: string | null
          plan_id: number
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: number
          installment_number?: number
          paid_at?: string | null
          plan_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          clinic_id: number
          created_at: string | null
          id: number
          notes: string | null
          num_installments: number
          patient_id: number
          status: string
          total_amount: number
          transaction_id: number | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          id?: number
          notes?: string | null
          num_installments: number
          patient_id: number
          status?: string
          total_amount: number
          transaction_id?: number | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          id?: number
          notes?: string | null
          num_installments?: number
          patient_id?: number
          status?: string
          total_amount?: number
          transaction_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          clinic_id: number
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          alert_threshold: number
          category_id: number | null
          clinic_id: number
          created_at: string | null
          expiry_date: string | null
          id: number
          name: string
          quantity: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          alert_threshold?: number
          category_id?: number | null
          clinic_id: number
          created_at?: string | null
          expiry_date?: string | null
          id?: number
          name: string
          quantity?: number
          unit: string
          updated_at?: string | null
        }
        Update: {
          alert_threshold?: number
          category_id?: number | null
          clinic_id?: number
          created_at?: string | null
          expiry_date?: string | null
          id?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          changed_by: string | null
          created_at: string | null
          delta: number
          id: number
          item_id: number
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          delta: number
          id?: number
          item_id: number
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          delta?: number
          id?: number
          item_id?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          email: string
          id: string
          login_at: string
          role: string
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          login_at?: string
          role: string
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          login_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: number | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          error_message: string | null
          id: number
          patient_id: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          trigger_type: Database["public"]["Enums"]["notification_trigger"]
        }
        Insert: {
          appointment_id?: number | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          error_message?: string | null
          id?: number
          patient_id?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          trigger_type: Database["public"]["Enums"]["notification_trigger"]
        }
        Update: {
          appointment_id?: number | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          error_message?: string | null
          id?: number
          patient_id?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          trigger_type?: Database["public"]["Enums"]["notification_trigger"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_surgery_records: {
        Row: {
          anesthesia: string | null
          appointment_id: number | null
          clinic_id: number
          dentist_id: number
          id: number
          notes: string | null
          patient_id: number
          performed_at: string | null
          procedure_name: string
          tooth_number: number | null
        }
        Insert: {
          anesthesia?: string | null
          appointment_id?: number | null
          clinic_id: number
          dentist_id: number
          id?: number
          notes?: string | null
          patient_id: number
          performed_at?: string | null
          procedure_name: string
          tooth_number?: number | null
        }
        Update: {
          anesthesia?: string | null
          appointment_id?: number | null
          clinic_id?: number
          dentist_id?: number
          id?: number
          notes?: string | null
          patient_id?: number
          performed_at?: string | null
          procedure_name?: string
          tooth_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oral_surgery_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oral_surgery_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oral_surgery_records_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oral_surgery_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_hmo: {
        Row: {
          id: number
          clinic_id: number
          hmo_name: string
          created_at: string | null
        }
        Insert: {
          id?: number
          clinic_id: number
          hmo_name: string
          created_at?: string | null
        }
        Update: {
          id?: number
          clinic_id?: number
          hmo_name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      clinic_specialties: {
        Row: {
          id: number
          clinic_id: number
          specialty_name: string
          created_at: string | null
        }
        Insert: {
          id?: number
          clinic_id: number
          specialty_name: string
          created_at?: string | null
        }
        Update: {
          id?: number
          clinic_id?: number
          specialty_name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      patient_medical_history: {
        Row: {
          allergies: string | null
          blood_pressure: string | null
          blood_type: string | null
          current_medications: string | null
          detailed_info: Json | null
          id: number
          is_pregnant: boolean | null
          is_smoker: boolean | null
          medical_conditions: string | null
          medical_flags: string | null
          patient_id: number
          previous_surgeries: string | null
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          blood_pressure?: string | null
          blood_type?: string | null
          current_medications?: string | null
          detailed_info?: Json | null
          id?: number
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          medical_conditions?: string | null
          medical_flags?: string | null
          patient_id: number
          previous_surgeries?: string | null
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          blood_pressure?: string | null
          blood_type?: string | null
          current_medications?: string | null
          detailed_info?: Json | null
          id?: number
          is_pregnant?: boolean | null
          is_smoker?: boolean | null
          medical_conditions?: string | null
          medical_flags?: string | null
          patient_id?: number
          previous_surgeries?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birthdate: string | null
          created_at: string | null
          email: string | null
          first_name: string
          gender: string | null
          guardian_address: string | null
          guardian_name: string | null
          guardian_phone: string | null
          hmo_cards: Json | null
          id: number
          is_guest: boolean | null
          last_name: string
          phone: string
          previous_dentist: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birthdate?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          guardian_address?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          hmo_cards?: Json | null
          id?: number
          is_guest?: boolean | null
          last_name: string
          phone: string
          previous_dentist?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birthdate?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          guardian_address?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          hmo_cards?: Json | null
          id?: number
          is_guest?: boolean | null
          last_name?: string
          phone?: string
          previous_dentist?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      paymongo_events: {
        Row: {
          event_type: string | null
          id: string
          received_at: string | null
        }
        Insert: {
          event_type?: string | null
          id: string
          received_at?: string | null
        }
        Update: {
          event_type?: string | null
          id?: string
          received_at?: string | null
        }
        Relationships: []
      }
      paymongo_payments: {
        Row: {
          amount: number
          checkout_url: string | null
          context_id: number
          context_type: string
          created_at: string | null
          currency: string
          id: number
          paid_at: string | null
          patient_id: number
          payment_method: string | null
          paymongo_link_id: string | null
          status: string
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          context_id: number
          context_type: string
          created_at?: string | null
          currency?: string
          id?: number
          paid_at?: string | null
          patient_id: number
          payment_method?: string | null
          paymongo_link_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          context_id?: number
          context_type?: string
          created_at?: string | null
          currency?: string
          id?: number
          paid_at?: string | null
          patient_id?: number
          payment_method?: string | null
          paymongo_link_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "paymongo_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      periodontal_screenings: {
        Row: {
          appointment_id: number | null
          bleeding_points: Json | null
          clinic_id: number
          dentist_id: number
          findings: string | null
          id: number
          patient_id: number
          pocket_depths: Json | null
          screened_at: string | null
        }
        Insert: {
          appointment_id?: number | null
          bleeding_points?: Json | null
          clinic_id: number
          dentist_id: number
          findings?: string | null
          id?: number
          patient_id: number
          pocket_depths?: Json | null
          screened_at?: string | null
        }
        Update: {
          appointment_id?: number | null
          bleeding_points?: Json | null
          clinic_id?: number
          dentist_id?: number
          findings?: string | null
          id?: number
          patient_id?: number
          pocket_depths?: Json | null
          screened_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "periodontal_screenings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodontal_screenings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodontal_screenings_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodontal_screenings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: number | null
          clinic_id: number
          dentist_id: number
          dosage: string
          duration: string | null
          frequency: string
          id: number
          medication: string
          notes: string | null
          patient_id: number
          prescribed_at: string | null
        }
        Insert: {
          appointment_id?: number | null
          clinic_id: number
          dentist_id: number
          dosage: string
          duration?: string | null
          frequency: string
          id?: number
          medication: string
          notes?: string | null
          patient_id: number
          prescribed_at?: string | null
        }
        Update: {
          appointment_id?: number | null
          clinic_id?: number
          dentist_id?: number
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: number
          medication?: string
          notes?: string | null
          patient_id?: number
          prescribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          clinic_id: number
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          price: number
          price_max: number | null
          price_min: number | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          price: number
          price_max?: number | null
          price_min?: number | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          price?: number
          price_max?: number | null
          price_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allows_installment: boolean
          clinic_id: number
          created_at: string | null
          downpayment_amount: number | null
          id: number
          is_active: boolean | null
          name: string
          num_installments: number | null
          price: number
          price_max: number | null
          price_min: number | null
          slot_duration_min: number
        }
        Insert: {
          allows_installment?: boolean
          clinic_id: number
          created_at?: string | null
          downpayment_amount?: number | null
          id?: number
          is_active?: boolean | null
          name: string
          num_installments?: number | null
          price: number
          price_max?: number | null
          price_min?: number | null
          slot_duration_min?: number
        }
        Update: {
          allows_installment?: boolean
          clinic_id?: number
          created_at?: string | null
          downpayment_amount?: number | null
          id?: number
          is_active?: boolean | null
          name?: string
          num_installments?: number | null
          price?: number
          price_max?: number | null
          price_min?: number | null
          slot_duration_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      tmj_assessments: {
        Row: {
          appointment_id: number | null
          assessed_at: string | null
          clinic_id: number
          dentist_id: number
          findings: string | null
          id: number
          pain_scale: number | null
          patient_id: number
        }
        Insert: {
          appointment_id?: number | null
          assessed_at?: string | null
          clinic_id: number
          dentist_id: number
          findings?: string | null
          id?: number
          pain_scale?: number | null
          patient_id: number
        }
        Update: {
          appointment_id?: number | null
          assessed_at?: string | null
          clinic_id?: number
          dentist_id?: number
          findings?: string | null
          id?: number
          pain_scale?: number | null
          patient_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tmj_assessments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tmj_assessments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tmj_assessments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tmj_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      tooth_conditions: {
        Row: {
          condition: string
          dental_chart_id: number
          id: number
          notes: string | null
          recorded_at: string | null
          surface: string | null
          tooth_number: number
          tooth_type: Database["public"]["Enums"]["tooth_type"]
        }
        Insert: {
          condition: string
          dental_chart_id: number
          id?: number
          notes?: string | null
          recorded_at?: string | null
          surface?: string | null
          tooth_number: number
          tooth_type: Database["public"]["Enums"]["tooth_type"]
        }
        Update: {
          condition?: string
          dental_chart_id?: number
          id?: number
          notes?: string | null
          recorded_at?: string | null
          surface?: string | null
          tooth_number?: number
          tooth_type?: Database["public"]["Enums"]["tooth_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tooth_conditions_dental_chart_id_fkey"
            columns: ["dental_chart_id"]
            isOneToOne: false
            referencedRelation: "dental_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          description: string
          id: number
          product_id: number | null
          quantity: number
          service_id: number | null
          total_price: number
          transaction_id: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: number
          product_id?: number | null
          quantity?: number
          service_id?: number | null
          total_price: number
          transaction_id: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: number
          product_id?: number | null
          quantity?: number
          service_id?: number | null
          total_price?: number
          transaction_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          appointment_id: number | null
          billing_status: string
          clinic_id: number
          created_at: string | null
          discount_amount: number | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          hmo_coverage: number | null
          id: number
          patient_id: number
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          philhealth_coverage: number | null
          subtotal: number
          total_amount: number
        }
        Insert: {
          appointment_id?: number | null
          billing_status?: string
          clinic_id: number
          created_at?: string | null
          discount_amount?: number | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          hmo_coverage?: number | null
          id?: number
          patient_id: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          philhealth_coverage?: number | null
          subtotal: number
          total_amount: number
        }
        Update: {
          appointment_id?: number | null
          billing_status?: string
          clinic_id?: number
          created_at?: string | null
          discount_amount?: number | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          hmo_coverage?: number | null
          id?: number
          patient_id?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          philhealth_coverage?: number | null
          subtotal?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_history: {
        Row: {
          appointment_id: number | null
          clinic_id: number
          dentist_id: number
          id: number
          notes: string | null
          patient_id: number
          performed_at: string | null
          service_id: number | null
          tooth_number: number | null
          treatment: string
        }
        Insert: {
          appointment_id?: number | null
          clinic_id: number
          dentist_id: number
          id?: number
          notes?: string | null
          patient_id: number
          performed_at?: string | null
          service_id?: number | null
          tooth_number?: number | null
          treatment: string
        }
        Update: {
          appointment_id?: number | null
          clinic_id?: number
          dentist_id?: number
          id?: number
          notes?: string | null
          patient_id?: number
          performed_at?: string | null
          service_id?: number | null
          tooth_number?: number | null
          treatment?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_history_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_disabled: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_disabled?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_disabled?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_clinic_id: { Args: never; Returns: number }
      auth_is_clinic_patient: {
        Args: { p_patient_id: number }
        Returns: boolean
      }
      auth_role: { Args: never; Returns: string }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "rescheduled"
        | "completed"
        | "cancelled"
        | "no_show"
        | "pending_patient_confirm"
      discount_type: "senior" | "pwd" | "hmo" | "philhealth" | "none"
      log_action:
        | "created"
        | "confirmed"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "no_show"
        | "follow_up_set"
        | "status_updated"
      notification_channel: "sms" | "email"
      notification_status: "sent" | "failed" | "pending"
      notification_trigger:
        | "confirmation"
        | "reschedule"
        | "day_before"
        | "follow_up"
        | "manual"
        | "email_verification"
        | "password_reset"
        | "account_created"
        | "six_month_recall"
      payment_method: "gcash" | "paymaya" | "credit_card" | "cash"
      payment_status: "unpaid" | "downpaid" | "paid" | "refunded" | "partial"
      tooth_type: "permanent" | "temporary"
      user_role: "superadmin" | "patient" | "staff" | "dentist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "pending",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
        "no_show",
        "pending_patient_confirm",
      ],
      discount_type: ["senior", "pwd", "hmo", "philhealth", "none"],
      log_action: [
        "created",
        "confirmed",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show",
        "follow_up_set",
        "status_updated",
      ],
      notification_channel: ["sms", "email"],
      notification_status: ["sent", "failed", "pending"],
      notification_trigger: [
        "confirmation",
        "reschedule",
        "day_before",
        "follow_up",
        "manual",
        "email_verification",
        "password_reset",
        "account_created",
        "six_month_recall",
      ],
      payment_method: ["gcash", "paymaya", "credit_card", "cash"],
      payment_status: ["unpaid", "downpaid", "paid", "refunded", "partial"],
      tooth_type: ["permanent", "temporary"],
      user_role: ["superadmin", "patient", "staff", "dentist"],
    },
  },
} as const
