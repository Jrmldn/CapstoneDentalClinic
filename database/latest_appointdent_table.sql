[
  {
    "table_name": "appointment_logs",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "appointment_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "performed_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "role",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "action",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "old_status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "new_status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointment_logs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "appointments",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "patient_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "dentist_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "service_id",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'pending'::appointment_status"
  },
  {
    "table_name": "appointments",
    "column_name": "scheduled_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "end_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "is_walk_in",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "appointments",
    "column_name": "downpayment",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "appointments",
    "column_name": "payment_method",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "appointments",
    "column_name": "payment_status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'unpaid'::payment_status"
  },
  {
    "table_name": "appointments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "appointments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "clinic_gallery",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_gallery",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_gallery",
    "column_name": "image_url",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_gallery",
    "column_name": "sort_order",
    "data_type": "smallint",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "clinic_hmo",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_hmo",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_hmo",
    "column_name": "hmo_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_holidays",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_holidays",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_holidays",
    "column_name": "date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_holidays",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinic_holidays",
    "column_name": "is_special_day",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "clinic_operating_hours",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_operating_hours",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_operating_hours",
    "column_name": "day_of_week",
    "data_type": "smallint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_operating_hours",
    "column_name": "open_time",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_operating_hours",
    "column_name": "close_time",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_operating_hours",
    "column_name": "is_closed",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "clinic_staff",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_staff",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_staff",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_staff",
    "column_name": "first_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinic_staff",
    "column_name": "last_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "patient_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "dentist_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "appointment_id",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "chief_complaint",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "diagnosis",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "treatment_plan",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinical_assessments",
    "column_name": "assessed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "clinics",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "address",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "latitude",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "longitude",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "phone",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "clinics",
    "column_name": "max_appointments_per_day",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "20"
  },
  {
    "table_name": "clinics",
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "clinics",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "clinics",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "dental_charts",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dental_charts",
    "column_name": "patient_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dental_charts",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dental_charts",
    "column_name": "dentist_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dental_charts",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "dental_charts",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "dentist_availability",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_availability",
    "column_name": "dentist_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_availability",
    "column_name": "day_of_week",
    "data_type": "smallint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_availability",
    "column_name": "start_time",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_availability",
    "column_name": "end_time",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "column_name": "dentist_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "column_name": "blocked_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "column_name": "start_time",
    "data_type": "time without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "column_name": "end_time",
    "data_type": "time without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "column_name": "reason",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "dentists",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentists",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentists",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentists",
    "column_name": "first_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentists",
    "column_name": "last_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "dentists",
    "column_name": "specialty",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "patient_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "clinic_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "appointment_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "rating",
    "data_type": "smallint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "comment",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "feedback",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "follow_up_schedules",
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "follow_up_schedules",
    "column_name": "patient_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null
  }
]