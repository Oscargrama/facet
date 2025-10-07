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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contract_signatures: {
        Row: {
          block_number: number | null
          blockchain_tx_hash: string | null
          client_email: string
          client_phone: string | null
          contract_id: string
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          geolocation: string | null
          id: string
          ip_address: string | null
          ipfs_cid: string | null
          otp_verified_at: string | null
          signature_hash: string | null
          signature_token: string | null
          signed_at: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          block_number?: number | null
          blockchain_tx_hash?: string | null
          client_email: string
          client_phone?: string | null
          contract_id: string
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          ipfs_cid?: string | null
          otp_verified_at?: string | null
          signature_hash?: string | null
          signature_token?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          block_number?: number | null
          blockchain_tx_hash?: string | null
          client_email?: string
          client_phone?: string | null
          contract_id?: string
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          ipfs_cid?: string | null
          otp_verified_at?: string | null
          signature_hash?: string | null
          signature_token?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contract_signatures_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          activated_at: string | null
          additional_terms: string | null
          application_id: string
          block_number: number | null
          blockchain_tx_hash: string | null
          client_signature_method: string | null
          client_signed_at: string | null
          completed_at: string | null
          contract_hash: string | null
          contract_number: string
          created_at: string
          credit_amount: number
          early_payment_policy: string | null
          first_payment_date: string
          id: string
          interest_rate: number
          ipfs_cid: string | null
          late_fees_policy: string | null
          monthly_payment: number
          signature_token: string | null
          signed_at: string | null
          status: string
          term_months: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          additional_terms?: string | null
          application_id: string
          block_number?: number | null
          blockchain_tx_hash?: string | null
          client_signature_method?: string | null
          client_signed_at?: string | null
          completed_at?: string | null
          contract_hash?: string | null
          contract_number: string
          created_at?: string
          credit_amount: number
          early_payment_policy?: string | null
          first_payment_date: string
          id?: string
          interest_rate: number
          ipfs_cid?: string | null
          late_fees_policy?: string | null
          monthly_payment: number
          signature_token?: string | null
          signed_at?: string | null
          status?: string
          term_months: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          additional_terms?: string | null
          application_id?: string
          block_number?: number | null
          blockchain_tx_hash?: string | null
          client_signature_method?: string | null
          client_signed_at?: string | null
          completed_at?: string | null
          contract_hash?: string | null
          contract_number?: string
          created_at?: string
          credit_amount?: number
          early_payment_policy?: string | null
          first_payment_date?: string
          id?: string
          interest_rate?: number
          ipfs_cid?: string | null
          late_fees_policy?: string | null
          monthly_payment?: number
          signature_token?: string | null
          signed_at?: string | null
          status?: string
          term_months?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "credit_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_applications: {
        Row: {
          application_number: string
          created_at: string
          credit_amount: number
          credit_history_factor_score: number | null
          credit_history_score: number
          credit_purpose_factor_score: number | null
          debt_ratio_factor_score: number | null
          decision: string | null
          employment_stability_factor_score: number | null
          id: string
          monthly_debt_payment: number | null
          monthly_income: number
          monthly_income_factor_score: number | null
          purpose: string
          reviewed_at: string | null
          risk_score: number | null
          status: string
          submitted_at: string
          term_months: number
          updated_at: string
          user_id: string
          years_in_employment: number | null
        }
        Insert: {
          application_number: string
          created_at?: string
          credit_amount: number
          credit_history_factor_score?: number | null
          credit_history_score: number
          credit_purpose_factor_score?: number | null
          debt_ratio_factor_score?: number | null
          decision?: string | null
          employment_stability_factor_score?: number | null
          id?: string
          monthly_debt_payment?: number | null
          monthly_income: number
          monthly_income_factor_score?: number | null
          purpose: string
          reviewed_at?: string | null
          risk_score?: number | null
          status?: string
          submitted_at?: string
          term_months: number
          updated_at?: string
          user_id: string
          years_in_employment?: number | null
        }
        Update: {
          application_number?: string
          created_at?: string
          credit_amount?: number
          credit_history_factor_score?: number | null
          credit_history_score?: number
          credit_purpose_factor_score?: number | null
          debt_ratio_factor_score?: number | null
          decision?: string | null
          employment_stability_factor_score?: number | null
          id?: string
          monthly_debt_payment?: number | null
          monthly_income?: number
          monthly_income_factor_score?: number | null
          purpose?: string
          reviewed_at?: string | null
          risk_score?: number | null
          status?: string
          submitted_at?: string
          term_months?: number
          updated_at?: string
          user_id?: string
          years_in_employment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          application_id: string | null
          content: string
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          application_id?: string | null
          content: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          application_id?: string | null
          content?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp_code_hash: string
          phone_or_email: string
          signature_id: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code_hash: string
          phone_or_email: string
          signature_id?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code_hash?: string
          phone_or_email?: string
          signature_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_verifications_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "contract_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          blockchain_tx_hash: string | null
          contract_id: string
          created_at: string
          due_date: string
          id: string
          interest_amount: number | null
          late_fee: number | null
          paid_at: string | null
          payment_method: string | null
          payment_number: number
          principal_amount: number | null
          status: string
          transaction_reference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          blockchain_tx_hash?: string | null
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          interest_amount?: number | null
          late_fee?: number | null
          paid_at?: string | null
          payment_method?: string | null
          payment_number: number
          principal_amount?: number | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          blockchain_tx_hash?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          interest_amount?: number | null
          late_fee?: number | null
          paid_at?: string | null
          payment_method?: string | null
          payment_number?: number
          principal_amount?: number | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          credit_history_score: number | null
          email: string
          employment_status: string | null
          full_name: string
          id: string
          monthly_debt_payment: number | null
          monthly_income: number | null
          phone: string | null
          updated_at: string
          years_in_employment: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_history_score?: number | null
          email: string
          employment_status?: string | null
          full_name: string
          id: string
          monthly_debt_payment?: number | null
          monthly_income?: number | null
          phone?: string | null
          updated_at?: string
          years_in_employment?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_history_score?: number | null
          email?: string
          employment_status?: string | null
          full_name?: string
          id?: string
          monthly_debt_payment?: number | null
          monthly_income?: number | null
          phone?: string | null
          updated_at?: string
          years_in_employment?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
