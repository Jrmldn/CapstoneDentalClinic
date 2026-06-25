

export interface ClinicOperatingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean | null;
}

export interface ClinicGallery {
  image_url: string;
  sort_order: number | null;
}

export interface ClinicFeedback {
  rating: number;
}

export interface Clinic {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  manual_status: string | null;
  latitude: number | null;
  longitude: number | null;
  clinic_operating_hours: ClinicOperatingHour[];
  clinic_gallery: ClinicGallery[];
  feedback: ClinicFeedback[];
}

export interface ClinicMapProps {
  clinics: Clinic[];
}
