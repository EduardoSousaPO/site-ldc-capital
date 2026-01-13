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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      BlogPost: {
        Row: {
          authorDisplayName: string | null
          authorId: string
          category: string
          categoryId: string | null
          content: string
          cover: string | null
          createdAt: string
          id: string
          published: boolean
          publishedAt: string | null
          readingTime: string | null
          slug: string
          summary: string | null
          title: string
          updatedAt: string
        }
        Insert: {
          authorDisplayName?: string | null
          authorId: string
          category?: string
          categoryId?: string | null
          content: string
          cover?: string | null
          createdAt?: string
          id?: string
          published?: boolean
          publishedAt?: string | null
          readingTime?: string | null
          slug: string
          summary?: string | null
          title: string
          updatedAt?: string
        }
        Update: {
          authorDisplayName?: string | null
          authorId?: string
          category?: string
          categoryId?: string | null
          content?: string
          cover?: string | null
          createdAt?: string
          id?: string
          published?: boolean
          publishedAt?: string | null
          readingTime?: string | null
          slug?: string
          summary?: string | null
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "BlogPost_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BlogPost_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          createdAt: string
          id: string
          name: string
          slug: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          name: string
          slug: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          slug?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Checkup: {
        Row: {
          analytics_json: Json | null
          created_at: string
          id: string
          idade_faixa: string | null
          objetivo_principal: string | null
          pdf_url: string | null
          policy_profile_id: string | null
          prazo_anos: number | null
          report_json: Json | null
          score_total: number | null
          status: Database["public"]["Enums"]["checkup_status"]
          tolerancia_risco: string | null
        }
        Insert: {
          analytics_json?: Json | null
          created_at?: string
          id?: string
          idade_faixa?: string | null
          objetivo_principal?: string | null
          pdf_url?: string | null
          policy_profile_id?: string | null
          prazo_anos?: number | null
          report_json?: Json | null
          score_total?: number | null
          status?: Database["public"]["Enums"]["checkup_status"]
          tolerancia_risco?: string | null
        }
        Update: {
          analytics_json?: Json | null
          created_at?: string
          id?: string
          idade_faixa?: string | null
          objetivo_principal?: string | null
          pdf_url?: string | null
          policy_profile_id?: string | null
          prazo_anos?: number | null
          report_json?: Json | null
          score_total?: number | null
          status?: Database["public"]["Enums"]["checkup_status"]
          tolerancia_risco?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Checkup_policy_profile_id_fkey"
            columns: ["policy_profile_id"]
            isOneToOne: false
            referencedRelation: "PolicyProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      Client: {
        Row: {
          createdAt: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      ebook_leads: {
        Row: {
          created_at: string | null
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          ip_address: string | null
          landing_page: string | null
          nome: string
          status: string | null
          telefone: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_investimento: string
          whatsapp_confirmed_at: string | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          nome: string
          status?: string | null
          telefone: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_investimento: string
          whatsapp_confirmed_at?: string | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          nome?: string
          status?: string | null
          telefone?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_investimento?: string
          whatsapp_confirmed_at?: string | null
          whatsapp_sent_at?: string | null
        }
        Relationships: []
      }
      Holding: {
        Row: {
          checkup_id: string
          created_at: string
          custo_bucket: string | null
          id: string
          liquidez_bucket: string | null
          moeda: string
          nome_raw: string
          risco_bucket: string | null
          ticker_norm: string | null
          tipo: string
          valor: number
        }
        Insert: {
          checkup_id: string
          created_at?: string
          custo_bucket?: string | null
          id?: string
          liquidez_bucket?: string | null
          moeda?: string
          nome_raw: string
          risco_bucket?: string | null
          ticker_norm?: string | null
          tipo: string
          valor: number
        }
        Update: {
          checkup_id?: string
          created_at?: string
          custo_bucket?: string | null
          id?: string
          liquidez_bucket?: string | null
          moeda?: string
          nome_raw?: string
          risco_bucket?: string | null
          ticker_norm?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "Holding_checkup_id_fkey"
            columns: ["checkup_id"]
            isOneToOne: false
            referencedRelation: "Checkup"
            referencedColumns: ["id"]
          },
        ]
      }
      LLMRun: {
        Row: {
          checkup_id: string
          created_at: string
          id: string
          input_hash: string | null
          model: string
          output_json: Json | null
          prompt_version: string
          provider: string
          task: string
        }
        Insert: {
          checkup_id: string
          created_at?: string
          id?: string
          input_hash?: string | null
          model: string
          output_json?: Json | null
          prompt_version: string
          provider: string
          task: string
        }
        Update: {
          checkup_id?: string
          created_at?: string
          id?: string
          input_hash?: string | null
          model?: string
          output_json?: Json | null
          prompt_version?: string
          provider?: string
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "LLMRun_checkup_id_fkey"
            columns: ["checkup_id"]
            isOneToOne: false
            referencedRelation: "Checkup"
            referencedColumns: ["id"]
          },
        ]
      }
      Material: {
        Row: {
          authorId: string
          category: string
          content: string | null
          cover: string | null
          createdAt: string
          description: string | null
          downloadCount: number
          featured: boolean
          fileName: string | null
          fileSize: string | null
          fileUrl: string | null
          id: string
          pages: number | null
          published: boolean
          publishedAt: string | null
          slug: string
          title: string
          type: string
          updatedAt: string
        }
        Insert: {
          authorId: string
          category: string
          content?: string | null
          cover?: string | null
          createdAt?: string
          description?: string | null
          downloadCount?: number
          featured?: boolean
          fileName?: string | null
          fileSize?: string | null
          fileUrl?: string | null
          id?: string
          pages?: number | null
          published?: boolean
          publishedAt?: string | null
          slug: string
          title: string
          type: string
          updatedAt?: string
        }
        Update: {
          authorId?: string
          category?: string
          content?: string | null
          cover?: string | null
          createdAt?: string
          description?: string | null
          downloadCount?: number
          featured?: boolean
          fileName?: string | null
          fileSize?: string | null
          fileUrl?: string | null
          id?: string
          pages?: number | null
          published?: boolean
          publishedAt?: string | null
          slug?: string
          title?: string
          type?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Material_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PolicyProfile: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      ScenarioComparison: {
        Row: {
          comparisonData: Json
          createdAt: string
          id: string
          scenarioIds: string[]
        }
        Insert: {
          comparisonData: Json
          createdAt?: string
          id?: string
          scenarioIds?: string[]
        }
        Update: {
          comparisonData?: Json
          createdAt?: string
          id?: string
          scenarioIds?: string[]
        }
        Relationships: []
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
          password: string | null
          role: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          password?: string | null
          role?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          password?: string | null
          role?: string
          updatedAt?: string
        }
        Relationships: []
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      WealthPlanningScenario: {
        Row: {
          assets: Json
          assumptions: Json
          calculatedResults: Json | null
          clientId: string
          consultantId: string
          createdAt: string
          debts: Json
          financialData: Json
          id: string
          otherRevenues: Json
          pdfUrl: string | null
          personalData: Json
          portfolio: Json
          projects: Json
          status: string
          title: string
          updatedAt: string
        }
        Insert: {
          assets: Json
          assumptions: Json
          calculatedResults?: Json | null
          clientId: string
          consultantId: string
          createdAt?: string
          debts: Json
          financialData: Json
          id?: string
          otherRevenues: Json
          pdfUrl?: string | null
          personalData: Json
          portfolio: Json
          projects: Json
          status?: string
          title: string
          updatedAt?: string
        }
        Update: {
          assets?: Json
          assumptions?: Json
          calculatedResults?: Json | null
          clientId?: string
          consultantId?: string
          createdAt?: string
          debts?: Json
          financialData?: Json
          id?: string
          otherRevenues?: Json
          pdfUrl?: string | null
          personalData?: Json
          portfolio?: Json
          projects?: Json
          status?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WealthPlanningScenario_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WealthPlanningScenario_consultantId_fkey"
            columns: ["consultantId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_editor: { Args: never; Returns: boolean }
    }
    Enums: {
      checkup_status: "draft" | "preview" | "paid" | "done"
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
      checkup_status: ["draft", "preview", "paid", "done"],
    },
  },
} as const
