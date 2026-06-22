export interface ClinicSpecialty {
  specialty_name: string;
}


export interface ClinicOperatingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface ClinicGallery {
  image_url: string;
  sort_order: number;
}

export interface ClinicFeedback {
  rating: number;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  manual_status: string | null;
  latitude: number | null;
  longitude: number | null;
  clinic_specialties: ClinicSpecialty[];
  clinic_operating_hours: ClinicOperatingHour[];
  clinic_gallery: ClinicGallery[];
  feedback: ClinicFeedback[];
}

export interface ClinicMapProps {
  clinics: Clinic[];
  availableSpecialties?: string[];
}
