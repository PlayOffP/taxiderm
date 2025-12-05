export type Database = {
  public: {
    Tables: {
      customer: {
        Row: {
          id: string;
          name: string;
          phone: string;
          sms_opt_in: boolean;
          email: string | null;
          address_line1: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          sms_opt_in?: boolean;
          email?: string | null;
          address_line1?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          sms_opt_in?: boolean;
          email?: string | null;
          address_line1?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          created_at?: string;
        };
      };
      job: {
        Row: {
          id: string;
          invoice_no: string;
          customer_id: string;
          species: 'deer' | 'turkey' | 'duck' | 'quail' | 'dove' | 'other';
          sex: 'male' | 'female' | 'unknown';
          antler_points: number | null;
          beard_attached: boolean | null;
          date_killed: string;
          license_no: string;
          ranch_area: string | null;
          county: string | null;
          state: string | null;
          status: 'received' | 'in_cooler' | 'hide_removed' | 'cut_and_bagged' | 'skinned_quartered' | 'processing' | 'freezer' | 'ready' | 'picked_up' | 'paid';
          dressed_weight: number | null;
          hang_weight: number | null;
          yield_weight: number | null;
          processing_type: 'standard' | 'euro_mount' | 'shoulder_mount' | 'full_mount' | 'processing_only';
          cut_sheet: Record<string, any>;
          instructions: string | null;
          deposit_paid: boolean;
          deposit_amount: number | null;
          mount_requested: boolean;
          hide_return_requested: boolean;
          taxidermy_stage: 'prep' | 'mounting' | 'painting' | 'drying' | 'finishing' | 'qa' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_no: string;
          customer_id: string;
          species: 'deer' | 'turkey' | 'duck' | 'quail' | 'dove' | 'other';
          sex: 'male' | 'female' | 'unknown';
          antler_points?: number | null;
          beard_attached?: boolean | null;
          date_killed: string;
          license_no: string;
          ranch_area?: string | null;
          county?: string | null;
          state?: string | null;
          status?: 'received' | 'in_cooler' | 'hide_removed' | 'cut_and_bagged' | 'skinned_quartered' | 'processing' | 'freezer' | 'ready' | 'picked_up' | 'paid';
          dressed_weight?: number | null;
          hang_weight?: number | null;
          yield_weight?: number | null;
          processing_type?: 'standard' | 'euro_mount' | 'shoulder_mount' | 'full_mount' | 'processing_only';
          cut_sheet?: Record<string, any>;
          instructions?: string | null;
          deposit_paid?: boolean;
          deposit_amount?: number | null;
          mount_requested?: boolean;
          hide_return_requested?: boolean;
          taxidermy_stage?: 'prep' | 'mounting' | 'painting' | 'drying' | 'finishing' | 'qa' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_no?: string;
          customer_id?: string;
          species?: 'deer' | 'turkey' | 'duck' | 'quail' | 'dove' | 'other';
          sex?: 'male' | 'female' | 'unknown';
          antler_points?: number | null;
          beard_attached?: boolean | null;
          date_killed?: string;
          license_no?: string;
          ranch_area?: string | null;
          county?: string | null;
          state?: string | null;
          status?: 'received' | 'in_cooler' | 'hide_removed' | 'cut_and_bagged' | 'skinned_quartered' | 'processing' | 'freezer' | 'ready' | 'picked_up' | 'paid';
          dressed_weight?: number | null;
          hang_weight?: number | null;
          yield_weight?: number | null;
          processing_type?: 'standard' | 'euro_mount' | 'shoulder_mount' | 'full_mount' | 'processing_only';
          cut_sheet?: Record<string, any>;
          instructions?: string | null;
          deposit_paid?: boolean;
          deposit_amount?: number | null;
          mount_requested?: boolean;
          hide_return_requested?: boolean;
          taxidermy_stage?: 'prep' | 'mounting' | 'painting' | 'drying' | 'finishing' | 'qa' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      compliance_doc: {
        Row: {
          id: string;
          job_id: string;
          type: 'PWD-535' | 'WRD';
          pdf_url: string | null;
          printed: boolean;
          donor_signature_url: string | null;
          taxidermist_signature_url: string | null;
          taxidermist_name: string | null;
          business_name: string | null;
          business_phone: string | null;
          business_address: string | null;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          type: 'PWD-535' | 'WRD';
          pdf_url?: string | null;
          printed?: boolean;
          donor_signature_url?: string | null;
          taxidermist_signature_url?: string | null;
          taxidermist_name?: string | null;
          business_name?: string | null;
          business_phone?: string | null;
          business_address?: string | null;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          type?: 'PWD-535' | 'WRD';
          pdf_url?: string | null;
          printed?: boolean;
          donor_signature_url?: string | null;
          taxidermist_signature_url?: string | null;
          taxidermist_name?: string | null;
          business_name?: string | null;
          business_phone?: string | null;
          business_address?: string | null;
          version?: number;
          created_at?: string;
        };
      };
      payment: {
        Row: {
          id: string;
          job_id: string;
          method: 'cash' | 'check' | 'card';
          base_flat_fee: number;
          per_lb_rate: number;
          per_lb_weight: number;
          fee_pass: boolean;
          total: number;
          payment_type: 'deposit' | 'final' | 'refund';
          paid_at: string;
          receipt_url: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          method: 'cash' | 'check' | 'card';
          base_flat_fee?: number;
          per_lb_rate?: number;
          per_lb_weight?: number;
          fee_pass?: boolean;
          total: number;
          payment_type?: 'deposit' | 'final' | 'refund';
          paid_at?: string;
          receipt_url?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          method?: 'cash' | 'check' | 'card';
          base_flat_fee?: number;
          per_lb_rate?: number;
          per_lb_weight?: number;
          fee_pass?: boolean;
          total?: number;
          payment_type?: 'deposit' | 'final' | 'refund';
          paid_at?: string;
          receipt_url?: string | null;
        };
      };
      notification: {
        Row: {
          id: string;
          job_id: string;
          channel: 'sms' | 'email';
          template_key: string;
          sent_at: string;
          delivery_status: string;
          payload: Record<string, any>;
        };
        Insert: {
          id?: string;
          job_id: string;
          channel: 'sms' | 'email';
          template_key: string;
          sent_at?: string;
          delivery_status?: string;
          payload?: Record<string, any>;
        };
        Update: {
          id?: string;
          job_id?: string;
          channel?: 'sms' | 'email';
          template_key?: string;
          sent_at?: string;
          delivery_status?: string;
          payload?: Record<string, any>;
        };
      };
      audit_log: {
        Row: {
          id: string;
          job_id: string | null;
          actor: string;
          action: string;
          meta: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          actor: string;
          action: string;
          meta?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          actor?: string;
          action?: string;
          meta?: Record<string, any>;
          created_at?: string;
        };
      };
    };
  };
};

export type CustomerRow = Database['public']['Tables']['customer']['Row'];
export type JobRow = Database['public']['Tables']['job']['Row'];
export type ComplianceDocRow = Database['public']['Tables']['compliance_doc']['Row'];
export type PaymentRow = Database['public']['Tables']['payment']['Row'];
export type NotificationRow = Database['public']['Tables']['notification']['Row'];
export type AuditLogRow = Database['public']['Tables']['audit_log']['Row'];

export type CustomerInsert = Database['public']['Tables']['customer']['Insert'];
export type JobInsert = Database['public']['Tables']['job']['Insert'];
export type ComplianceDocInsert = Database['public']['Tables']['compliance_doc']['Insert'];
export type PaymentInsert = Database['public']['Tables']['payment']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notification']['Insert'];
export type AuditLogInsert = Database['public']['Tables']['audit_log']['Insert'];